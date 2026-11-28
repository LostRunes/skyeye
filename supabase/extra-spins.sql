-- Extra spins (run once in Supabase → SQL Editor; safe to re-run).
--
-- Each player now has `spins_left` (starts at 1). Spinning uses one; the
-- admin panel's Players tab can add more ("+1 spin"), e.g. for doing a task at
-- the stall. The player reloads the spin page and can spin again.
-- Replaces check_code() and spin() (spin keeps the assigned-prize logic from
-- prize-assignments.sql).

-- The column; on first run, players who've already spun have used their spin
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'players' and column_name = 'spins_left') then
    alter table public.players add column spins_left int not null default 1 check (spins_left >= 0);
    update public.players p set spins_left = 0 where exists (select 1 from public.spins s where s.player_id = p.id);
  end if;
end $$;

-- A player may now spin more than once in the same round
do $$ declare c text; begin
  for c in select conname from pg_constraint
    where conrelid = 'public.spins'::regclass and contype = 'u' and pg_get_constraintdef(oid) ilike '%(session_id, player_id)%'
  loop
    execute format('alter table public.spins drop constraint %I', c);
  end loop;
end $$;

-- Admin: give a player more spins (or take them away with a negative n)
create or replace function public.add_spins(p_player bigint, p_n int default 1)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.players set spins_left = greatest(0, spins_left + coalesce(p_n, 1)) where id = p_player returning spins_left into v;
  return v;
end $$;
revoke all on function public.add_spins(bigint, int) from public, anon;
grant execute on function public.add_spins(bigint, int) to authenticated;

-- Can this code spin right now?
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

  if v_player.spins_left <= 0 then
    return json_build_object('ok', false, 'reason',
      case when exists (select 1 from public.spins where player_id = v_player.id and is_winner) then 'already_won' else 'already_spun' end,
      'first_name', v_player.first_name, 'spins_left', 0);
  end if;

  select * into v_session from public.sessions where status = 'open' order by started_at desc limit 1;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_round', 'first_name', v_player.first_name, 'spins_left', v_player.spins_left);
  end if;

  return json_build_object('ok', true, 'first_name', v_player.first_name, 'round', v_session.name,
    'spins_so_far', (select count(*) from public.spins where session_id = v_session.id),
    'max_winners', v_session.max_winners, 'spins_left', v_player.spins_left);
end $$;
grant execute on function public.check_code(text) to anon, authenticated;

-- The spin
drop function if exists public.spin(text);
create function public.spin(p_code text)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_player public.players;
  v_session public.sessions;
  v_rank int;
  v_won int;
  v_full boolean;
  v_total int;
  v_roll int;
  v_prize_id bigint;
  v_prize public.prizes;
  v_assign public.prize_assignments;
  v_spin_id bigint;
begin
  -- Lock the player so two taps can't spend the same spin twice
  select * into v_player from public.players where code = upper(trim(p_code)) for update;
  if not found then
    perform pg_sleep(0.4);
    return json_build_object('ok', false, 'reason', 'invalid');
  end if;

  if v_player.spins_left <= 0 then
    return json_build_object('ok', false, 'reason',
      case when exists (select 1 from public.spins where player_id = v_player.id and is_winner) then 'already_won' else 'already_spun' end,
      'first_name', v_player.first_name, 'spins_left', 0);
  end if;

  -- Lock the open round so simultaneous spins can't overshoot its goodies
  select * into v_session from public.sessions where status = 'open'
    order by started_at desc limit 1 for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_round', 'first_name', v_player.first_name, 'spins_left', v_player.spins_left);
  end if;

  select count(*) + 1, count(*) filter (where is_winner) into v_rank, v_won
    from public.spins where session_id = v_session.id;
  v_full := v_won >= v_session.max_winners;

  -- An assigned prize for this player's email, if it can still be given
  select a.* into v_assign from public.prize_assignments a
    join public.prizes p on p.id = a.prize_id
    where lower(a.email) = lower(v_player.email) and a.used_at is null
      and p.active and (p.is_blank or p.stock is null or p.stock > 0)
    order by a.created_at desc limit 1
    for update of a;
  if found then
    v_prize_id := v_assign.prize_id;
  else
    select coalesce(sum(weight), 0) into v_total from public.prizes
      where active and weight > 0 and (is_blank or (not v_full and (stock is null or stock > 0)));
    if v_total = 0 then
      return json_build_object('ok', false, 'reason', 'no_prizes', 'first_name', v_player.first_name, 'spins_left', v_player.spins_left);
    end if;
    v_roll := floor(random() * v_total)::int;

    select id into v_prize_id from (
      select id, sum(weight) over (order by sort, id) as upto
      from public.prizes
      where active and weight > 0 and (is_blank or (not v_full and (stock is null or stock > 0)))
    ) t where upto > v_roll order by upto limit 1;
  end if;

  select * into v_prize from public.prizes where id = v_prize_id;

  if not v_prize.is_blank and v_prize.stock is not null then
    update public.prizes set stock = stock - 1 where id = v_prize.id;
  end if;

  insert into public.spins (session_id, player_id, prize_id, prize_name, rank, is_winner)
  values (v_session.id, v_player.id, v_prize.id, v_prize.name, v_rank, not v_prize.is_blank)
  returning id into v_spin_id;

  update public.players set spins_left = spins_left - 1 where id = v_player.id;

  if v_assign.id is not null then
    update public.prize_assignments set used_at = now(), spin_id = v_spin_id where id = v_assign.id;
  end if;

  return json_build_object('ok', true, 'first_name', v_player.first_name, 'round', v_session.name,
    'prize_id', v_prize.id, 'prize_name', v_prize.name, 'rank', v_rank,
    'is_winner', not v_prize.is_blank, 'max_winners', v_session.max_winners,
    'spins_left', v_player.spins_left - 1);
end $$;
grant execute on function public.spin(text) to anon, authenticated;
