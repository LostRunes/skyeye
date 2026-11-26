-- Spin odds: "Better luck next time" + rarer goodies (run once in Supabase →
-- SQL Editor; safe to re-run).
--
-- Before: the first N spins of a round always won something.
-- Now: every spin is a weighted draw. Most spins land on "Better luck next
-- time" (a blank slice); goodies are rare, prizes with stock run out, and a
-- round still never hands out more than its "max goodies" number.
--
-- Default odds (weights out of 1000, change them any time in the admin
-- panel's Prizes tab):
--   Better luck next time  520   52%
--   Toffees                220   22%   about 1 in 5
--   Stickers               140   14%   about 1 in 7
--   Keychain                45   4.5%  about 1 in 22
--   Bottle                  25   2.5%  about 1 in 40
--   Pilot card              25   2.5%  about 1 in 40
--   Mug                     25   2.5%  about 1 in 40, stock 30

alter table public.prizes add column if not exists is_blank boolean not null default false;

insert into public.prizes (name, icon, color, weight, stock, active, sort, is_blank)
select 'Better luck next time', 'sentiment_satisfied', '#E9DBBD', 520, null, true, 0, true
where not exists (select 1 from public.prizes where is_blank);

update public.prizes set weight = 220 where name = 'Toffees';
update public.prizes set weight = 140 where name = 'Stickers';
update public.prizes set weight = 45 where name = 'Keychain';
update public.prizes set weight = 25 where name = 'Bottle';
update public.prizes set weight = 25 where name = 'Pilot card';
update public.prizes set weight = 25, stock = coalesce(stock, 30) where name = 'Mug';

-- The spin itself (same checks as before; only the prize logic changed)
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

  select * into v_prize from public.prizes where id = v_prize_id;

  if not v_prize.is_blank and v_prize.stock is not null then
    update public.prizes set stock = stock - 1 where id = v_prize.id;
  end if;

  insert into public.spins (session_id, player_id, prize_id, prize_name, rank, is_winner)
  values (v_session.id, v_player.id, v_prize.id, v_prize.name, v_rank, not v_prize.is_blank);

  return json_build_object('ok', true, 'first_name', v_player.first_name, 'round', v_session.name,
    'prize_id', v_prize.id, 'prize_name', v_prize.name, 'rank', v_rank,
    'is_winner', not v_prize.is_blank, 'max_winners', v_session.max_winners);
end $$;

grant execute on function public.spin(text) to anon, authenticated;
