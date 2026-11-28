-- Velvet database schema: a full snapshot of the live database (2026-11-24).
-- Running this on an empty Supabase project rebuilds every table, rule,
-- index and security setting the app needs. It already includes everything
-- in supabase/migrations/ up to that date.
--
-- How access works: RLS is on for every table and there are NO policies on
-- purpose, so the app's public keys can't read or write anything directly.
-- All data goes through the backend, which uses the service key.
--
-- When you change the database: add a new dated file in supabase/migrations/
-- and update this file to match, so it always shows the current state.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  username text,
  bio text,
  age integer,                       -- kept for older accounts; worked out from date_of_birth
  date_of_birth date,                -- set once, 18+ checked on the server
  show_age boolean default true,
  height_cm smallint check (height_cm is null or height_cm between 120 and 230),
  is_couple boolean not null default false,
  hide_city boolean not null default false, -- others see distance, not the city name
  notify_matches boolean not null default true,  -- push for new matches
  notify_messages boolean not null default true, -- push for new messages
  -- looking_for: long_term | short_term | casual | online | friends | open
  gender text,
  orientation text,
  show_me text[], -- genders picked in Discover Filters; null = follow orientation
  looking_for text,
  interests text[],
  photos jsonb default '[]'::jsonb,  -- [{ url, is_nsfw }], url names a file in the private photos bucket
  photo_url text,
  location_lat double precision,     -- rounded to ~1 km, never exact
  location_lng double precision,
  country text,
  city text,
  prompt1 text,
  prompt2 text,
  prompt3 text,
  is_active boolean default true,
  onboarding_complete boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()  -- also used as "last seen"
);

create table public.swipes (
  id uuid not null default uuid_generate_v4(),
  swiper_id uuid not null,
  target_id uuid not null,
  direction text not null,
  created_at timestamp with time zone default now()
);

create table public.matches (
  id uuid not null default uuid_generate_v4(),
  user1_id uuid not null,
  user2_id uuid not null,
  status text default 'matched'::text,
  matched_at timestamp with time zone default now()
);

create table public.messages (
  id uuid not null default uuid_generate_v4(),
  match_id uuid not null,
  sender_id uuid not null,
  content text not null,
  is_filtered boolean default false,
  kind text not null default 'text', -- 'text', 'screenshot' for a screenshot alert, or 'call' for a call line
  reply_to_id uuid, -- the message this one replies to, if any
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table public.blocked_users (
  id uuid not null default gen_random_uuid(),
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamp with time zone not null default now()
);

-- Phones that allowed push notifications
create table public.device_tokens (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  token text not null,
  platform text not null default 'ios',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Reports of abusive users. Review with: select * from reports where status = 'open'
create table public.reports (
  id uuid not null default gen_random_uuid(),
  reporter_id uuid not null,
  reported_id uuid not null,
  reason text not null,
  details text,
  match_id uuid,
  status text not null default 'open',
  created_at timestamp with time zone not null default now()
);

-- ---------------------------------------------------------- primary keys

alter table public.profiles add constraint profiles_pkey primary key (id);
alter table public.swipes add constraint swipes_pkey primary key (id);
alter table public.matches add constraint matches_pkey primary key (id);
alter table public.messages add constraint messages_pkey primary key (id);
alter table public.blocked_users add constraint blocked_users_pkey primary key (id);
alter table public.reports add constraint reports_pkey primary key (id);
alter table public.device_tokens add constraint device_tokens_pkey primary key (id);

-- -------------------------------------------------------------- rules

-- profiles: one per login, usernames unique ignoring case
alter table public.profiles add constraint profiles_user_id_key unique (user_id);
alter table public.profiles add constraint profiles_username_key unique (username);
create unique index profiles_username_lower_key on public.profiles using btree (lower(username));

-- swipes: one per person per target
alter table public.swipes add constraint swipes_direction_check check (direction = any (array['left'::text, 'right'::text, 'super'::text]));
alter table public.swipes add constraint swipes_swiper_id_target_id_key unique (swiper_id, target_id);

-- matches: one per pair, whichever order the two people are stored in
alter table public.matches add constraint matches_status_check check (status = any (array['matched'::text, 'unmatched'::text]));
alter table public.matches add constraint matches_user1_id_user2_id_key unique (user1_id, user2_id);
create unique index matches_one_per_pair on public.matches using btree (least(user1_id, user2_id), greatest(user1_id, user2_id));

-- blocks: one per pair and direction
alter table public.blocked_users add constraint blocked_users_blocker_id_blocked_id_key unique (blocker_id, blocked_id);

-- messages: a normal message or a screenshot alert
alter table public.messages add constraint messages_kind_check check (kind = any (array['text', 'screenshot', 'call']));

-- device tokens: one row per phone
alter table public.device_tokens add constraint device_tokens_token_key unique (token);
alter table public.device_tokens add constraint device_tokens_token_check check (char_length(token) <= 200);
alter table public.device_tokens add constraint device_tokens_platform_check check (platform = any (array['ios']));

-- reports: a known reason, a short note, a review status
alter table public.reports add constraint reports_reason_check check (reason = any (array['fake_profile', 'harassment', 'inappropriate_photos', 'underage', 'spam_or_scam', 'hate_speech', 'threats_or_violence', 'other']));
alter table public.reports add constraint reports_details_check check (char_length(details) <= 1000);
alter table public.reports add constraint reports_status_check check (status = any (array['open', 'reviewed', 'actioned', 'dismissed']));

-- --------------------------------------------- links (deleting a login cascades)

alter table public.profiles add constraint profiles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.swipes add constraint swipes_swiper_id_fkey foreign key (swiper_id) references auth.users(id) on delete cascade;
alter table public.swipes add constraint swipes_target_id_fkey foreign key (target_id) references auth.users(id) on delete cascade;
alter table public.matches add constraint matches_user1_id_fkey foreign key (user1_id) references auth.users(id) on delete cascade;
alter table public.matches add constraint matches_user2_id_fkey foreign key (user2_id) references auth.users(id) on delete cascade;
alter table public.messages add constraint messages_match_id_fkey foreign key (match_id) references public.matches(id) on delete cascade;
alter table public.messages add constraint messages_sender_id_fkey foreign key (sender_id) references auth.users(id) on delete cascade;
alter table public.messages add constraint messages_reply_to_id_fkey foreign key (reply_to_id) references public.messages(id) on delete set null;
alter table public.blocked_users add constraint blocked_users_blocker_id_fkey foreign key (blocker_id) references auth.users(id) on delete cascade;
alter table public.blocked_users add constraint blocked_users_blocked_id_fkey foreign key (blocked_id) references auth.users(id) on delete cascade;
alter table public.device_tokens add constraint device_tokens_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.reports add constraint reports_reporter_id_fkey foreign key (reporter_id) references auth.users(id) on delete cascade;
alter table public.reports add constraint reports_reported_id_fkey foreign key (reported_id) references auth.users(id) on delete cascade;
alter table public.reports add constraint reports_match_id_fkey foreign key (match_id) references public.matches(id) on delete set null;

-- ------------------------------------------------------- lookup indexes

create index swipes_swiper_id_idx on public.swipes using btree (swiper_id);
create index swipes_target_id_idx on public.swipes using btree (target_id);
create index matches_user1_id_idx on public.matches using btree (user1_id);
create index matches_user2_id_idx on public.matches using btree (user2_id);
create index messages_match_id_idx on public.messages using btree (match_id);
create index messages_sender_id_idx on public.messages using btree (sender_id);
create index profiles_looking_for_idx on public.profiles (looking_for);
create index profiles_height_idx on public.profiles (height_cm);
create index profiles_location_idx on public.profiles (location_lat, location_lng);
create index profiles_interests_idx on public.profiles using gin (interests);
create index device_tokens_user_id_idx on public.device_tokens (user_id);
create index reports_reported_id_idx on public.reports (reported_id);
create index reports_status_idx on public.reports (status, created_at);

-- ------------------------------------- row level security (no policies on purpose)

alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocked_users enable row level security;
alter table public.reports enable row level security;
alter table public.device_tokens enable row level security;

-- ------------------------------------------- table permissions (backend only)

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;

revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- ------------------------------------------------------------- storage

-- Private photos bucket. Logged-in users may upload and delete only inside a
-- folder named after their own user id. Nobody reads it directly: the
-- backend serves photos through /api/photos after checking who's asking.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "photos: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- --------------------------------------------------------- super likes
-- (same as migrations/2026-11-26_super_likes.sql)


-- How many bought Super Likes each person has left, and when they last used
-- their free one
create table if not exists public.super_like_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  purchased integer not null default 0 check (purchased >= 0),
  free_used_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Every purchase Apple confirmed (through RevenueCat). The transaction id is
-- unique, so the same purchase can never be counted twice.
create table if not exists public.super_like_purchases (
  transaction_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  quantity integer not null check (quantity > 0),
  store text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists super_like_purchases_user on public.super_like_purchases (user_id);

alter table public.super_like_balances enable row level security;
alter table public.super_like_purchases enable row level security;
revoke all on public.super_like_balances, public.super_like_purchases from anon, authenticated;
grant select, insert, update, delete on public.super_like_balances, public.super_like_purchases to service_role;

-- Use one Super Like: the free one if it's available, otherwise a bought one.
-- Returns 'free', 'purchased', or null when there are none left. Locks the
-- row, so two taps at once can't spend the same Super Like twice.
create or replace function public.use_super_like(p_user uuid)
returns text language plpgsql as $$
declare
  b public.super_like_balances;
begin
  insert into public.super_like_balances (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into b from public.super_like_balances where user_id = p_user for update;

  if b.free_used_at is null or b.free_used_at <= now() - interval '24 hours' then
    update public.super_like_balances set free_used_at = now(), updated_at = now() where user_id = p_user;
    return 'free';
  end if;

  if b.purchased > 0 then
    update public.super_like_balances set purchased = purchased - 1, updated_at = now() where user_id = p_user;
    return 'purchased';
  end if;

  return null;
end $$;

-- Give back a Super Like that was taken but not used (the swipe failed)
create or replace function public.refund_super_like(p_user uuid, p_kind text)
returns void language plpgsql as $$
begin
  if p_kind = 'free' then
    update public.super_like_balances set free_used_at = null, updated_at = now() where user_id = p_user;
  elsif p_kind = 'purchased' then
    update public.super_like_balances set purchased = purchased + 1, updated_at = now() where user_id = p_user;
  end if;
end $$;

-- Add a purchase once. Returns true if it was new, false if already counted.
create or replace function public.add_super_like_purchase(
  p_transaction text, p_user uuid, p_product text, p_quantity integer, p_store text
) returns boolean language plpgsql as $$
begin
  insert into public.super_like_purchases (transaction_id, user_id, product_id, quantity, store)
  values (p_transaction, p_user, p_product, p_quantity, p_store)
  on conflict (transaction_id) do nothing;
  if not found then return false; end if;

  insert into public.super_like_balances (user_id, purchased) values (p_user, p_quantity)
  on conflict (user_id) do update
    set purchased = public.super_like_balances.purchased + excluded.purchased, updated_at = now();
  return true;
end $$;

-- Apple refunded a purchase: take back what's left of it (never below zero).
-- Returns true if it was found and not already refunded.
create or replace function public.refund_super_like_purchase(p_transaction text)
returns boolean language plpgsql as $$
declare
  p public.super_like_purchases;
begin
  update public.super_like_purchases set refunded_at = now()
  where transaction_id = p_transaction and refunded_at is null
  returning * into p;
  if p is null then return false; end if;

  update public.super_like_balances
  set purchased = greatest(purchased - p.quantity, 0), updated_at = now()
  where user_id = p.user_id;
  return true;
end $$;

-- Only the backend may call these
revoke all on function public.use_super_like(uuid) from public, anon, authenticated;
revoke all on function public.refund_super_like(uuid, text) from public, anon, authenticated;
revoke all on function public.add_super_like_purchase(text, uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.refund_super_like_purchase(text) from public, anon, authenticated;
grant execute on function public.use_super_like(uuid) to service_role;
grant execute on function public.refund_super_like(uuid, text) to service_role;
grant execute on function public.add_super_like_purchase(text, uuid, text, integer, text) to service_role;
grant execute on function public.refund_super_like_purchase(text) to service_role;
