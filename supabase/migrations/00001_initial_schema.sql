-- M1: Initial schema for Instagram automation system
-- See CLAUDE.md section 7 for data model specification

create extension if not exists pgcrypto;

-- === Settings (singleton) ===
create table settings (
  id int primary key default 1 check (id = 1),
  owner uuid,
  paused boolean not null default false,
  require_approval boolean not null default true,
  live_publish_enabled boolean not null default false,
  timezone text not null default 'Asia/Kolkata',
  max_posts_per_day int not null default 2
);

-- === Niches ===
create table niches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  style jsonb not null default '{}',
  rules jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- === Posts ===
create table posts (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('manual','agent')),
  media_type text not null check (media_type in ('REELS','IMAGE','CAROUSEL')),
  status text not null default 'draft' check (status in
    ('draft','pending_approval','approved','publishing','posted','failed','rejected')),
  caption text not null default '',
  alt_text text,
  credit text,
  is_ai_generated boolean not null default false,
  media_paths text[] not null default '{}',
  audio jsonb,
  scheduled_at timestamptz,
  ig_container_id text,
  ig_media_id text,
  ig_permalink text,
  attempts int not null default 0,
  error text,
  niche_id uuid references niches(id),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_posts_status_scheduled on posts (status, scheduled_at);

-- === Runs ===
create table runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('agent_post','manual_ingest','publish','insights_sync')),
  mode text not null default 'assisted' check (mode in ('assisted','auto')),
  status text not null default 'queued' check (status in
    ('queued','running','waiting_user','done','failed','cancelled')),
  input jsonb not null default '{}',
  post_id uuid references posts(id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- === Run Steps ===
create table run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  key text not null check (key in
    ('niche','find_backgrounds','pick','edit','caption','music','publish')),
  status text not null default 'pending' check (status in
    ('pending','running','waiting_user','done','failed','skipped')),
  payload jsonb not null default '{}',
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  unique (run_id, key)
);

-- === Key-Value Store ===
create table kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- === Account Snapshots ===
create table account_snapshots (
  taken_at timestamptz primary key default now(),
  followers int,
  following int,
  media_count int,
  raw jsonb not null default '{}'
);

-- === Media Insights ===
create table media_insights (
  ig_media_id text not null,
  taken_at timestamptz not null default now(),
  media_product_type text,
  permalink text,
  caption text,
  posted_at timestamptz,
  metrics jsonb not null,
  primary key (ig_media_id, taken_at)
);

-- === Assets ===
create table assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('background','template','audio','upload')),
  provider text,
  provider_id text,
  storage_path text,
  credit text,
  license_url text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table settings enable row level security;
alter table niches enable row level security;
alter table posts enable row level security;
alter table runs enable row level security;
alter table run_steps enable row level security;
alter table kv enable row level security;
alter table account_snapshots enable row level security;
alter table media_insights enable row level security;
alter table assets enable row level security;

-- Owner-only policies for all tables except kv
create policy "owner_all_settings" on settings
  for all using (auth.uid() = (select owner from settings))
  with check (auth.uid() = (select owner from settings));

create policy "owner_all_niches" on niches
  for all using (auth.uid() = (select owner from settings))
  with check (auth.uid() = (select owner from settings));

create policy "owner_all_posts" on posts
  for all using (auth.uid() = (select owner from settings))
  with check (auth.uid() = (select owner from settings));

create policy "owner_all_runs" on runs
  for all using (auth.uid() = (select owner from settings))
  with check (auth.uid() = (select owner from settings));

create policy "owner_all_run_steps" on run_steps
  for all using (auth.uid() = (select owner from settings))
  with check (auth.uid() = (select owner from settings));

-- kv: NO policies (service role only, deny all via RLS)

create policy "owner_all_account_snapshots" on account_snapshots
  for all using (auth.uid() = (select owner from settings))
  with check (auth.uid() = (select owner from settings));

create policy "owner_all_media_insights" on media_insights
  for all using (auth.uid() = (select owner from settings))
  with check (auth.uid() = (select owner from settings));

create policy "owner_all_assets" on assets
  for all using (auth.uid() = (select owner from settings))
  with check (auth.uid() = (select owner from settings));

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table runs;
alter publication supabase_realtime add table run_steps;

-- ============================================================
-- STORAGE BUCKETS (created via Supabase dashboard or CLI)
-- Documenting the config here:
--   media-public: public read, service role writes, random UUID paths
--   library: private, owner-only read/write
-- ============================================================
