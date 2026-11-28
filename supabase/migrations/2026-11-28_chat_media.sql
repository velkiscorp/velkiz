-- Photos, videos and voice messages in chats.
-- Files live in a private "chat-media" bucket, in a folder per match. Nobody
-- can open them directly: the app loads them through the API, which checks
-- that you're in that chat. Safe to run more than once.

alter table public.messages add column if not exists media_path text;     -- chat-media/<matchId>/<file>
alter table public.messages add column if not exists media_type text;     -- e.g. image/jpeg, video/mp4, audio/mp4
alter table public.messages add column if not exists media_duration real; -- seconds, for video and voice

alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'screenshot', 'call', 'image', 'video', 'audio'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-media', 'chat-media', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;
