-- Keep posts, assets, and per-account preferences isolated by Instagram account.
alter table posts add column if not exists instagram_user_id text;
create index if not exists idx_posts_instagram_user_created
  on posts (instagram_user_id, created_at desc);

alter table assets add column if not exists instagram_user_id text;
create index if not exists idx_assets_instagram_user_created
  on assets (instagram_user_id, created_at desc);

alter table account_snapshots add column if not exists instagram_user_id text;
alter table account_snapshots drop constraint if exists account_snapshots_pkey;
create unique index if not exists idx_account_snapshots_user_taken
  on account_snapshots (instagram_user_id, taken_at);
