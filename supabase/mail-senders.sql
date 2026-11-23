-- Email sender accounts for the spin codes (run once in Supabase → SQL Editor;
-- safe to re-run).
--
-- Gmail lets one account send ~500 emails a day. The admin panel's "Email
-- senders" tab adds more accounts (Gmail address + app password); every
-- email goes out from the first account that's still usable today, and an
-- account that hits Gmail's limit or fails to log in is marked and skipped
-- automatically.
--
-- App passwords live here, so the table has row-level security on and NO
-- policies: only the server (secret key, in /api) can read or write it. The
-- browser never sees a password; the admin panel talks to /api/spin-senders.

create table if not exists public.mail_senders (
  id bigint generated always as identity primary key,
  email text not null,
  app_password text,                             -- null = the built-in account from Vercel's SMTP_* settings
  host text not null default 'smtp.gmail.com',
  port int not null default 465,
  daily_limit int not null default 450 check (daily_limit > 0),
  sent_date date,                                -- the (India) day sent_count is for
  sent_count int not null default 0,
  status text not null default 'active' check (status in ('active', 'limit_reached', 'auth_failed', 'off')),
  status_note text,                              -- what Gmail said
  status_at timestamptz,
  last_used_at timestamptz,
  sort int not null default 0,                   -- lower goes first
  created_at timestamptz not null default now()
);
create unique index if not exists mail_senders_email_key on public.mail_senders (lower(email));

alter table public.mail_senders enable row level security;
revoke all on public.mail_senders from anon, authenticated;

-- Which account emailed each player
alter table public.players add column if not exists sent_by text;

-- Counts one sent email against an account's day (India time)
create or replace function public.note_mail_sent(p_id bigint)
returns void language sql security definer set search_path = public as $$
  update public.mail_senders set
    sent_count = case when sent_date = (now() at time zone 'Asia/Kolkata')::date then sent_count + 1 else 1 end,
    sent_date = (now() at time zone 'Asia/Kolkata')::date,
    last_used_at = now(),
    status = case when status = 'limit_reached' then 'active' else status end
  where id = p_id;
$$;
revoke all on function public.note_mail_sent(bigint) from public, anon, authenticated;
grant execute on function public.note_mail_sent(bigint) to service_role;
