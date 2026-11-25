-- Private photos: the bucket stops serving public links, and people can
-- upload only into a folder named after their own user id.
-- The backend reads photos with the service key, which skips these policies.

-- 1. Look first: these are the storage policies that exist now
select policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'storage' and tablename = 'objects';

-- 2. Make the photos bucket private
update storage.buckets set public = false where id = 'photos';

-- 3. Remove the old storage policies (public view, upload anywhere).
--    This drops every policy on storage.objects. Only run it if "photos"
--    is your only bucket (check with: select id from storage.buckets;)
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- 4. Logged-in users can upload, and delete, only in their own folder.
--    No select policy on purpose: nobody reads the bucket directly.
create policy "photos: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
