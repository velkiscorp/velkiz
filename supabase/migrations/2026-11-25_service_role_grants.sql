-- Table permissions for the backend.
-- New Supabase projects no longer give the API roles access to tables
-- automatically, so the backend (service key) got "permission denied".
-- Only the backend's service role gets access. The public keys (anon,
-- authenticated) get none, which matches how the app works: all data goes
-- through the backend.

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;

revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
