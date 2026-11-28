-- View-once photos and videos. Photos and videos sent in a chat open once
-- for the other person and are then deleted, unless the sender turned on
-- "Keep in chat". Voice messages always stay. Safe to run more than once.

alter table public.messages add column if not exists view_once boolean not null default false;
alter table public.messages add column if not exists viewed_at timestamptz; -- when the other person opened it
