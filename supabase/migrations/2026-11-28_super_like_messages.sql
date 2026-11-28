-- A Super Like can carry one short message. The person sees it with the
-- Super Like, and if they like back it becomes the first message in the chat.
-- Safe to run more than once.
alter table public.swipes add column if not exists message text;
alter table public.swipes drop constraint if exists swipes_message_check;
alter table public.swipes add constraint swipes_message_check
  check (message is null or (direction = 'super' and char_length(message) <= 200));
