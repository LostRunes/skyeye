-- Sky Eye spin-the-wheel (KIIT MUN stall).
-- Run once in Supabase → SQL Editor. Safe to re-run: it drops and recreates
-- the functions, and only creates tables/policies that don't exist yet.
--
-- How it fits together
--   players   one row per registered person, with their unique spin code
--             (emailed to them). Filled by the website's MUN stall form via
--             the /api/spin-register function, or backfilled from Zoho CRM.
--   prizes    what's on the wheel: name, icon, colour, odds (weight) and
--             stock (null = unlimited).
--   sessions  a round of the game. Staff start a round in the admin panel;
--             only one round is open at a time.
--   spins     every spin: who, which round, what they landed on, and their
--             position in that round. The first `max_winners` (10) spins of
--             a round win the goodie. Each code spins once, ever: later
--             spinners see what they landed on but don't get another go.
--   admins    which Supabase Auth users may use the admin panel.
--
-- Players never touch the tables directly. They call two functions:
--   check_code(code)  → is this code valid, and can it spin right now?
--   spin(code)        → the server picks the prize and records the spin.
-- The prize is chosen here, on the server, so it can't be faked from a phone.

-- ─── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.prizes (
  id bigint generated always as identity primary key,
  name text not null,
  icon text,                                   -- Material Symbols name
  color text not null default '#5ef2ff',       -- wheel segment colour
  weight int not null default 1 check (weight >= 0),   -- relative odds
  stock int check (stock >= 0),                -- null = unlimited
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  college text,
  code text not null unique,
  code_sent_at timestamptz,                    -- when the code email went out
  email_error text,                            -- last send failure, if any
  zoho_lead_id text,
  source text not null default 'website',      -- website | zoho-backfill | admin
  created_at timestamptz not null default now()
);
create unique index if not exists players_email_key on public.players (lower(email));

create table if not exists public.sessions (
  id bigint generated always as identity primary key,
  name text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  max_winners int not null default 10 check (max_winners > 0),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  started_by uuid references auth.users (id) on delete set null
);
-- Only one round can be open at a time
create unique index if not exists sessions_one_open on public.sessions ((true)) where status = 'open';

create table if not exists public.spins (
  id bigint generated always as identity primary key,
  session_id bigint not null references public.sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  prize_id bigint references public.prizes (id) on delete set null,
  prize_name text not null,                    -- kept even if the prize is renamed
  rank int not null,                           -- 1 = first to spin this round
  is_winner boolean not null,
  collected boolean not null default false,
  collected_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  unique (session_id, player_id),
  unique (session_id, rank)
);
create index if not exists spins_session_idx on public.spins (session_id, rank);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- ─── Helpers ───────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 6-character code without look-alike characters (no 0/O, 1/I/L)
create or replace function public.gen_code()
returns text language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.players where code = c);
  end loop;
  return c;
end $$;

-- ─── Registration (server only: called by /api/spin-register) ─────────────
-- Creates the player, or updates their details if the email is already
-- registered. Returns their code. Not callable from the browser, so nobody
-- can get a code for an email they don't own.

drop function if exists public.register_player(text, text, text, text, text, text, text);
create function public.register_player(
  p_first text, p_last text, p_email text, p_phone text default null,
  p_college text default null, p_source text default 'website', p_zoho_lead_id text default null
) returns json language plpgsql security definer set search_path = public as $$
declare
  v public.players;
  v_new boolean := false;
begin
  if coalesce(trim(p_first), '') = '' or position('@' in coalesce(p_email, '')) = 0 then
    raise exception 'first name and a valid email are required';
  end if;

  select * into v from public.players where lower(email) = lower(trim(p_email));
  if not found then
    insert into public.players (first_name, last_name, email, phone, college, code, source, zoho_lead_id)
    values (trim(p_first), nullif(trim(p_last), ''), lower(trim(p_email)), nullif(trim(p_phone), ''),
            nullif(trim(p_college), ''), public.gen_code(), coalesce(p_source, 'website'), p_zoho_lead_id)
    returning * into v;
    v_new := true;
  else
    update public.players set
      first_name = trim(p_first),
      last_name = coalesce(nullif(trim(p_last), ''), last_name),
      phone = coalesce(nullif(trim(p_phone), ''), phone),
      college = coalesce(nullif(trim(p_college), ''), college),
      zoho_lead_id = coalesce(p_zoho_lead_id, zoho_lead_id)
    where id = v.id
    returning * into v;
  end if;

  return json_build_object('id', v.id, 'code', v.code, 'first_name', v.first_name,
                           'email', v.email, 'code_sent_at', v.code_sent_at, 'new', v_new);
end $$;

revoke all on function public.register_player(text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.register_player(text, text, text, text, text, text, text) to service_role;

-- ─── Player functions (called from the phone) ─────────────────────────────

-- Why a code can't spin: invalid | no_round | already_spun (used, no goodie) | already_won
create or replace function public.check_code(p_code text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_player public.players;
  v_session public.sessions;
begin
  select * into v_player from public.players where code = upper(trim(p_code));
  if not found then
    perform pg_sleep(0.4);                       -- slows down code guessing
    return json_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- One code = one spin, ever (win or not)
  if exists (select 1 from public.spins where player_id = v_player.id) then
    return json_build_object('ok', false, 'reason',
      case when exists (select 1 from public.spins where player_id = v_player.id and is_winner) then 'already_won' else 'already_spun' end,
      'first_name', v_player.first_name);
  end if;

  select * into v_session from public.sessions where status = 'open' order by started_at desc limit 1;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_round', 'first_name', v_player.first_name);
  end if;


  return json_build_object('ok', true, 'first_name', v_player.first_name, 'round', v_session.name,
    'spins_so_far', (select count(*) from public.spins where session_id = v_session.id),
    'max_winners', v_session.max_winners);
end $$;

drop function if exists public.spin(text);
-- NOTE: replaced by supabase/spin-odds.sql (weighted draw with a "Better luck
-- next time" slice). If you re-run this file, run spin-odds.sql after it.
create function public.spin(p_code text)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_player public.players;
  v_session public.sessions;
  v_rank int;
  v_winner boolean;
  v_total int;
  v_roll int;
  v_prize_id bigint;
  v_prize public.prizes;
begin
  select * into v_player from public.players where code = upper(trim(p_code));
  if not found then
    perform pg_sleep(0.4);
    return json_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- One code = one spin, ever (win or not)
  if exists (select 1 from public.spins where player_id = v_player.id) then
    return json_build_object('ok', false, 'reason',
      case when exists (select 1 from public.spins where player_id = v_player.id and is_winner) then 'already_won' else 'already_spun' end,
      'first_name', v_player.first_name);
  end if;

  -- Lock the open round so simultaneous spins get distinct, ordered ranks
  select * into v_session from public.sessions where status = 'open'
    order by started_at desc limit 1 for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_round', 'first_name', v_player.first_name);
  end if;


  select count(*) + 1 into v_rank from public.spins where session_id = v_session.id;
  v_winner := v_rank <= v_session.max_winners;

  -- Weighted pick. Winners only land on prizes that are still in stock.
  select coalesce(sum(weight), 0) into v_total from public.prizes
    where active and weight > 0 and (not v_winner or stock is null or stock > 0);
  if v_total = 0 then
    return json_build_object('ok', false, 'reason', 'no_prizes', 'first_name', v_player.first_name);
  end if;
  v_roll := floor(random() * v_total)::int;

  select id into v_prize_id from (
    select id, sum(weight) over (order by sort, id) as upto
    from public.prizes
    where active and weight > 0 and (not v_winner or stock is null or stock > 0)
  ) t where upto > v_roll order by upto limit 1;

  select * into v_prize from public.prizes where id = v_prize_id;

  if v_winner and v_prize.stock is not null then
    update public.prizes set stock = stock - 1 where id = v_prize.id;
  end if;

  insert into public.spins (session_id, player_id, prize_id, prize_name, rank, is_winner)
  values (v_session.id, v_player.id, v_prize.id, v_prize.name, v_rank, v_winner);

  return json_build_object('ok', true, 'first_name', v_player.first_name, 'round', v_session.name,
    'prize_id', v_prize.id, 'prize_name', v_prize.name, 'rank', v_rank,
    'is_winner', v_winner, 'max_winners', v_session.max_winners);
end $$;

grant execute on function public.check_code(text) to anon, authenticated;
grant execute on function public.spin(text) to anon, authenticated;

-- ─── Admin functions ───────────────────────────────────────────────────────

-- Closes any open round and opens a new one
drop function if exists public.start_round(text, int);
create function public.start_round(p_name text default null, p_max_winners int default 10)
returns public.sessions language plpgsql security definer set search_path = public as $$
declare
  v public.sessions;
  n int;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.sessions set status = 'closed', ended_at = now() where status = 'open';
  select count(*) + 1 into n from public.sessions;
  insert into public.sessions (name, max_winners, started_by)
  values (coalesce(nullif(trim(p_name), ''), 'Round ' || n), greatest(1, coalesce(p_max_winners, 10)), auth.uid())
  returning * into v;
  return v;
end $$;

drop function if exists public.end_round();
create function public.end_round()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.sessions set status = 'closed', ended_at = now() where status = 'open';
end $$;

grant execute on function public.start_round(text, int) to authenticated;
grant execute on function public.end_round() to authenticated;

-- ─── Row-level security ────────────────────────────────────────────────────
-- The public (anon) key can only read the wheel's prizes and the open round.
-- Everything else is admins only; players go through the functions above.

alter table public.prizes enable row level security;
alter table public.players enable row level security;
alter table public.sessions enable row level security;
alter table public.spins enable row level security;
alter table public.admins enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'prizes: everyone reads active') then
    create policy "prizes: everyone reads active" on public.prizes for select using (active or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'prizes: admins write') then
    create policy "prizes: admins write" on public.prizes for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'sessions: everyone reads') then
    create policy "sessions: everyone reads" on public.sessions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'sessions: admins write') then
    create policy "sessions: admins write" on public.sessions for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'players: admins only') then
    create policy "players: admins only" on public.players for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'spins: admins only') then
    create policy "spins: admins only" on public.spins for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'admins: admins read') then
    create policy "admins: admins read" on public.admins for select to authenticated using (public.is_admin());
  end if;
end $$;

-- ─── Live updates for the admin panel and big screen ──────────────────────

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'spins') then
    alter publication supabase_realtime add table public.spins;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'sessions') then
    alter publication supabase_realtime add table public.sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'players') then
    alter publication supabase_realtime add table public.players;
  end if;
end $$;

-- ─── Starting prizes (the stall's goodies; edit freely in the admin panel) ─

insert into public.prizes (name, icon, color, weight, sort)
select * from (values
  ('Pilot card', 'badge', '#7c5cff', 7, 1),
  ('Keychain', 'key', '#5ef2ff', 18, 2),
  ('Mug', 'coffee', '#ff6b9d', 10, 3),
  ('Stickers', 'sell', '#ffd166', 25, 4),
  ('Bottle', 'water_bottle', '#4ade80', 10, 5),
  ('Toffees', 'cookie', '#ff9f43', 30, 6)
) as v (name, icon, color, weight, sort)
where not exists (select 1 from public.prizes);
