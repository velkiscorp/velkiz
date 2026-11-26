-- Reports: people can report someone for harassment, fake profiles, minors, etc.
-- Apple requires a way to report abusive users in any app with user content.
-- Only the backend reads or writes this table (RLS on, no policies).
-- Review open reports with:
--   select * from public.reports where status = 'open' order by created_at;

create table if not exists public.reports (
  id uuid not null default gen_random_uuid() primary key,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in (
    'fake_profile', 'harassment', 'inappropriate_photos', 'underage',
    'spam_or_scam', 'hate_speech', 'threats_or_violence', 'other'
  )),
  details text check (char_length(details) <= 1000),
  match_id uuid references public.matches(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamp with time zone not null default now()
);

create index if not exists reports_reported_id_idx on public.reports (reported_id);
create index if not exists reports_status_idx on public.reports (status, created_at);

alter table public.reports enable row level security;
grant select, insert, update, delete on public.reports to service_role;
revoke all on public.reports from anon, authenticated;
