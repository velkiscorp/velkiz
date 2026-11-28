-- Chats disappear 36 hours after both people have opened them, unless both
-- tap "Keep chat". When one disappears, the match, its messages and both
-- swipes are deleted, so the two can find each other in Discover again.
-- Safe to run more than once.
alter table public.matches add column if not exists user1_opened_at timestamp with time zone;
alter table public.matches add column if not exists user2_opened_at timestamp with time zone;
-- Set when both have opened the chat; null while waiting, or once kept
alter table public.matches add column if not exists expires_at timestamp with time zone;
alter table public.matches add column if not exists user1_keeps boolean not null default false;
alter table public.matches add column if not exists user2_keeps boolean not null default false;
-- When the "disappears soon" notification went out
alter table public.matches add column if not exists expiry_warned_at timestamp with time zone;

create index if not exists matches_expires_at_idx on public.matches (expires_at) where expires_at is not null;
