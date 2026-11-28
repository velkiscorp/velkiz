-- A tiny, blurry preview (about 32 px wide) of each photo or video, so a
-- view-once message can show a blurred hint of what's inside before it's
-- opened. Cleared when a view-once message is opened. Safe to run more than once.

alter table public.messages add column if not exists media_preview text; -- data:image/jpeg;base64,...
