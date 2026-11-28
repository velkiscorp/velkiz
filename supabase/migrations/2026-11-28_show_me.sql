-- Who each person chose to see in Discover Filters ("Show me").
-- null = follow their gender and orientation (the default).
-- Discover is two-way: you only show up for people who want to see your
-- gender. Without this, two straight men who both picked "everyone" still
-- never saw each other, because the check only knew their orientation.
-- Safe to run more than once.
alter table public.profiles add column if not exists show_me text[];
