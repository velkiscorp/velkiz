-- Replying to a specific message. If the original is unsent, the reply
-- stays and just loses its quote. Safe to run more than once.
alter table public.messages add column if not exists reply_to_id uuid;
alter table public.messages drop constraint if exists messages_reply_to_id_fkey;
alter table public.messages add constraint messages_reply_to_id_fkey
  foreign key (reply_to_id) references public.messages(id) on delete set null;
