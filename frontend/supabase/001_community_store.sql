-- Help Nearby — community store tables
-- Run this once in the Supabase SQL editor before first deploy.
--
-- Schema: each table stores records as JSONB blobs keyed by id.
-- Filtering/sorting happens in application code after fetching,
-- which is appropriate for demo-scale traffic (<10k rows).
--
-- Security: Row Level Security is disabled here because the service
-- role key (server-side only, never in client bundles) is used for
-- all reads/writes. Public submissions go through API routes that
-- enforce rate limiting, moderation, and pending-by-default rules.

create table if not exists community_tips (
  id   text primary key,
  record jsonb not null
);

create table if not exists resource_reports (
  id   text primary key,
  record jsonb not null
);

create table if not exists community_opportunities (
  id   text primary key,
  record jsonb not null
);

create table if not exists local_updates (
  id   text primary key,
  record jsonb not null
);

-- Disable RLS — access is controlled at the API route layer.
alter table community_tips         disable row level security;
alter table resource_reports       disable row level security;
alter table community_opportunities disable row level security;
alter table local_updates          disable row level security;
