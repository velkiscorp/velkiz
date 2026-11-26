-- Screenshot alerts: when someone screenshots a chat in the iPhone app, a
-- small "took a screenshot" line appears in that chat for both people.
-- kind is 'text' for normal messages and 'screenshot' for these lines.

alter table public.messages add column if not exists kind text not null default 'text';
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('text', 'screenshot'));
