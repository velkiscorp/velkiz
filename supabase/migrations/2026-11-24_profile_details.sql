-- Profile details: height, a "couple" tag, new "looking for" options,
-- and "casual" moves out of interests into "looking for".

-- 1. New columns
alter table public.profiles add column if not exists height_cm smallint
  check (height_cm is null or height_cm between 120 and 230);
alter table public.profiles add column if not exists is_couple boolean not null default false;

-- 2. "Dating" becomes "Long-term" (the closest new option)
update public.profiles set looking_for = 'long_term' where looking_for = 'dating';

-- 3. Casual is now a "looking for" choice, so drop it from interests
update public.profiles
set interests = array_remove(array_remove(interests, 'Casual'), 'Casual Dating')
where interests && array['Casual', 'Casual Dating'];
