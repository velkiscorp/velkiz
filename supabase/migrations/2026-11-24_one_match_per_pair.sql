-- One match per pair of people, whichever order they're stored in.
-- Run all of it at once. If anything fails, Supabase undoes the whole run.

-- 1. Look first: pairs that already have more than one match
select least(user1_id, user2_id) as person_a,
       greatest(user1_id, user2_id) as person_b,
       count(*) as matches
from public.matches
group by 1, 2
having count(*) > 1;

-- 2. For each pair keep one match (an active one first, then the oldest),
--    move any messages from the extra ones onto it, then delete the extras
create temp table match_dupes on commit drop as
select id, keep_id from (
  select id,
         first_value(id) over (
           partition by least(user1_id, user2_id), greatest(user1_id, user2_id)
           order by (status = 'matched') desc, matched_at asc nulls last, id
         ) as keep_id
  from public.matches
) ranked
where id <> keep_id;

update public.messages m
set match_id = d.keep_id
from match_dupes d
where m.match_id = d.id;

delete from public.matches where id in (select id from match_dupes);

-- 3. The rule: the database refuses a second match for the same pair
create unique index if not exists matches_one_per_pair
  on public.matches (least(user1_id, user2_id), greatest(user1_id, user2_id));
