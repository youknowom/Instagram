-- Grant standard API roles permissions to query tables
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;

-- Insert default settings row if not exists
insert into settings (id, timezone, max_posts_per_day, require_approval, live_publish_enabled)
values (1, 'Asia/Kolkata', 2, true, false)
on conflict (id) do nothing;

