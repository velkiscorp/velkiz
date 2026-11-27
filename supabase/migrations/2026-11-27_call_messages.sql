-- Voice and video calls leave a short line in the chat, like
-- "Video call · 3:12" or "Missed voice call". kind 'call' marks those lines.
-- Safe to run more than once.
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('text', 'screenshot', 'call'));
