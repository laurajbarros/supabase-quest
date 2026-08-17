-- ============================================================
-- Supabase Quest — schema
-- Run once in Dashboard -> SQL Editor.
--
-- The RLS policies are the part of this project worth reading closely. The
-- rules live in the database, not in a middleware layer the client could be
-- talked out of using.
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) <= 30),
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  -- The score is submitted by the client and is therefore forgeable; this
  -- constraint caps the blast radius. See the README for why that tradeoff
  -- was made deliberately. The ceiling is 1100 rather than this build's
  -- reachable 600 because the deployed database was migrated for a two-route
  -- version that has since been reverted; leaving room costs nothing, and
  -- narrowing it would break the live table.
  score int not null check (score >= 0 and score <= 1100),
  -- platform_badges is what this build writes — six encounters, 100 each.
  -- field_badges is left over from the two-route version and stays 0.
  platform_badges int not null default 0 check (platform_badges >= 0 and platform_badges <= 6),
  field_badges int not null default 0 check (field_badges >= 0 and field_badges <= 5),
  completed_at timestamptz default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  message text not null check (char_length(message) <= 200),
  approved boolean not null default false,
  created_at timestamptz default now()
);

-- Leaderboard reads are "top N by score, oldest first on a tie", so the index
-- matches that ordering exactly and the query never sorts.
create index if not exists scores_score_desc_idx on scores (score desc, completed_at asc);
create index if not exists scores_user_id_idx on scores (user_id);
-- Partial index: the public wall only ever reads approved rows.
create index if not exists recommendations_approved_idx on recommendations (approved) where approved = true;

-- ============================================================
-- Row Level Security
--
-- Every policy wraps auth.uid() as (select auth.uid()). Postgres treats the
-- subquery as a stable initplan and evaluates it once per statement instead of
-- once per row — the difference is visible on a table of any size.
-- ============================================================

alter table profiles enable row level security;
alter table scores enable row level security;
alter table recommendations enable row level security;

drop policy if exists "profiles public read" on profiles;
create policy "profiles public read" on profiles
  for select using (true);

drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles
  for insert with check ((select auth.uid()) = id);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update using ((select auth.uid()) = id);

drop policy if exists "scores public read" on scores;
create policy "scores public read" on scores
  for select using (true);

drop policy if exists "insert own scores" on scores;
create policy "insert own scores" on scores
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "approved recs public" on recommendations;
create policy "approved recs public" on recommendations
  for select using (approved = true);

drop policy if exists "read own recs" on recommendations;
create policy "read own recs" on recommendations
  for select using ((select auth.uid()) = user_id);

drop policy if exists "insert own recs" on recommendations;
create policy "insert own recs" on recommendations
  for insert with check ((select auth.uid()) = user_id);

-- No update policy on recommendations, deliberately. Approval happens in the
-- dashboard; there is no code path that can flip `approved` from the browser,
-- because there is no policy that would let one exist.

-- ============================================================
-- Leaderboard view.
--
-- The board needs a display name per score, which means a join. Doing it in the
-- client costs two round trips and leaks the shape of the query into the app.
-- security_invoker keeps the caller's RLS in force rather than the view
-- owner's, so this is not a way around the policies above.
-- ============================================================
drop view if exists leaderboard;
create view leaderboard
with (security_invoker = true) as
  select
    s.id,
    s.score,
    s.platform_badges,
    s.field_badges,
    s.completed_at,
    p.display_name
  from scores s
  join profiles p on p.id = s.user_id
  order by s.score desc, s.completed_at asc;
