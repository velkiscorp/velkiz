-- Photo upload limits: only images, at most 10 MB each.
-- Storage refuses anything else, even if someone calls it directly with
-- their own token instead of going through the app.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'photos';

-- Check: should show 10485760 and the list above
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'photos';
