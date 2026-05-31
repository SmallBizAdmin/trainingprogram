-- LiftLog Supabase schema
-- Run this in the Supabase SQL editor (Database → SQL Editor → New query).

create table if not exists app_state (
  id          text primary key,        -- matches VITE_SYNC_ID (default 'me')
  state       jsonb not null,           -- the whole app state blob
  updated_at  timestamptz default now()
);

-- Row Level Security.
-- NOTE: with the anon key and the permissive policy below, anyone who knows
-- your deployed URL + anon key (which ships in the client bundle) can read and
-- write this row. For a single-user personal tracker that's usually fine,
-- especially if you also set a non-guessable VITE_SYNC_ID. For real privacy,
-- add Supabase Auth and scope the policy to auth.uid() instead.

alter table app_state enable row level security;

drop policy if exists "anon full access" on app_state;
create policy "anon full access"
  on app_state
  for all
  to anon
  using (true)
  with check (true);
