-- Discover filters: a "Hide my city" option, and faster lookups for the
-- new filters (looking for, height, distance, interests).

alter table public.profiles add column if not exists hide_city boolean not null default false;

create index if not exists profiles_looking_for_idx on public.profiles (looking_for);
create index if not exists profiles_height_idx on public.profiles (height_cm);
create index if not exists profiles_location_idx on public.profiles (location_lat, location_lng);
create index if not exists profiles_interests_idx on public.profiles using gin (interests);
