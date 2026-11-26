-- #skyeyetechnology reel challenge leaderboard (run once in Supabase → SQL
-- Editor; safe to re-run).
--
-- People post a reel with #skyeyetechnology and submit its link on the
-- Events page. The team checks it in the admin panel's "Reels" tab, approves
-- it and keeps its view count up to date. The Events page shows the approved
-- reels ranked by views.
--
-- Why views are entered by the team: Instagram's API doesn't give view
-- counts for other people's reels (its hashtag search only returns likes and
-- comments, and only to a verified business app), so there's no reliable
-- way to read them automatically.

create table if not exists public.reel_entries (
  id bigint generated always as identity primary key,
  handle text not null,                      -- Instagram username, without @
  email text,                                -- to contact winners; never shown publicly
  reel_url text not null,
  shortcode text not null,                   -- the reel's id in its link
  views bigint not null default 0 check (views >= 0),
  views_at timestamptz,                      -- when views were last updated
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,                                 -- for the team
  created_at timestamptz not null default now()
);
create unique index if not exists reel_entries_shortcode_key on public.reel_entries (shortcode);

alter table public.reel_entries enable row level security;
revoke all on public.reel_entries from anon;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'reel_entries: admins only') then
    create policy "reel_entries: admins only" on public.reel_entries for all to authenticated
      using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- What the public leaderboard can see: approved reels, no emails
create or replace view public.reel_leaderboard as
  select id, handle, reel_url, views, views_at,
         rank() over (order by views desc) as rank
  from public.reel_entries
  where status = 'approved';
grant select on public.reel_leaderboard to anon, authenticated;

-- Public: submit a reel. Returns { ok } or { ok: false, reason }.
create or replace function public.submit_reel(p_handle text, p_url text, p_email text default null)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_handle text := lower(regexp_replace(trim(coalesce(p_handle, '')), '^@+', ''));
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_code text := substring(coalesce(p_url, '') from 'instagram\.com/(?:[A-Za-z0-9_.]+/)?(?:reel|reels|p|tv)/([A-Za-z0-9_-]+)');
begin
  if v_handle !~ '^[a-z0-9_.]{1,30}$' then
    return json_build_object('ok', false, 'reason', 'handle');
  end if;
  if v_code is null then
    return json_build_object('ok', false, 'reason', 'url');
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return json_build_object('ok', false, 'reason', 'email');
  end if;
  if exists (select 1 from public.reel_entries where shortcode = v_code) then
    return json_build_object('ok', false, 'reason', 'exists');
  end if;
  if (select count(*) from public.reel_entries where handle = v_handle) >= 5 then
    return json_build_object('ok', false, 'reason', 'too_many');
  end if;
  insert into public.reel_entries (handle, email, reel_url, shortcode)
  values (v_handle, v_email, 'https://www.instagram.com/reel/' || v_code || '/', v_code);
  return json_build_object('ok', true);
end $$;
revoke all on function public.submit_reel(text, text, text) from public;
grant execute on function public.submit_reel(text, text, text) to anon, authenticated;

-- Live updates in the admin panel
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'reel_entries') then
    alter publication supabase_realtime add table public.reel_entries;
  end if;
end $$;
