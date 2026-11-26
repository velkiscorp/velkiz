-- Push notifications: each phone that allowed notifications, and what the
-- person wants to be notified about. Only the backend touches these.

create table if not exists public.device_tokens (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique check (char_length(token) <= 200),
  platform text not null default 'ios' check (platform in ('ios')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists device_tokens_user_id_idx on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;
grant select, insert, update, delete on public.device_tokens to service_role;
revoke all on public.device_tokens from anon, authenticated;

alter table public.profiles add column if not exists notify_matches boolean not null default true;
alter table public.profiles add column if not exists notify_messages boolean not null default true;
