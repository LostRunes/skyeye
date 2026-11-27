-- Assigned prizes (run once in Supabase → SQL Editor; safe to re-run).
--
-- The admin panel's "Assigned prizes" tab sets a prize for a player's email.
-- When that player spins, the wheel lands on that prize instead of the normal
-- weighted draw (the round's "max goodies" limit doesn't apply to it). Each
-- assignment is used once; if its prize is switched off or out of stock by
-- then, the spin falls back to the normal draw.

create table if not exists public.prize_assignments (
  id bigint generated always as identity primary key,
  email text not null,
  prize_id bigint not null references public.prizes (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  spin_id bigint
);
create unique index if not exists prize_assignments_email_key on public.prize_assignments (lower(email)) where used_at is null;

alter table public.prize_assignments enable row level security;
revoke all on public.prize_assignments from anon;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'prize_assignments: admins only') then
    create policy "prize_assignments: admins only" on public.prize_assignments for all to authenticated
      using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- The spin (as in spin-odds.sql, plus the assigned-prize check)
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

  -- Lock the open round so simultaneous spins can't overshoot its goodies
  select * into v_session from public.sessions where status = 'open'
    order by started_at desc limit 1 for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'no_round', 'first_name', v_player.first_name);
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
    -- Weighted draw over the slices that can still come up: the blank slice
    -- always; goodies only while in stock and while the round has goodies left.
    select coalesce(sum(weight), 0) into v_total from public.prizes
      where active and weight > 0 and (is_blank or (not v_full and (stock is null or stock > 0)));
    if v_total = 0 then
      return json_build_object('ok', false, 'reason', 'no_prizes', 'first_name', v_player.first_name);
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

  if v_assign.id is not null then
    update public.prize_assignments set used_at = now(), spin_id = v_spin_id where id = v_assign.id;
  end if;

  return json_build_object('ok', true, 'first_name', v_player.first_name, 'round', v_session.name,
    'prize_id', v_prize.id, 'prize_name', v_prize.name, 'rank', v_rank,
    'is_winner', not v_prize.is_blank, 'max_winners', v_session.max_winners);
end $$;

grant execute on function public.spin(text) to anon, authenticated;
