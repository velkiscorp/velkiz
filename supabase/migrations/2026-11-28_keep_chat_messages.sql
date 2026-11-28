-- Keep-chat invites show up as lines in the chat ("They want to keep this
-- chat", "You both kept this chat", ...). They're messages of kind 'keep'
-- whose content says what happened: requested, cancelled, declined or kept.
-- Safe to run more than once.

alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'screenshot', 'call', 'image', 'video', 'audio', 'keep'));
