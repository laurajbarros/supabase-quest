-- ============================================================
-- Migration 001 — two routes
--
-- Splits the single badge count into two tracks, and raises the score cap from
-- 600 to 1100 (5 field encounters + 6 platform encounters, 100 each).
--
-- Run once in Dashboard -> SQL Editor, on a project that already has the
-- original schema. A fresh project should run schema.sql instead, which already
-- includes all of this.
--
-- No RLS policy changes needed: the policies key off user_id, not off any
-- column being touched here.
-- ============================================================

alter table scores rename column badges to platform_badges;

alter table scores add column if not exists field_badges int not null default 0;

-- Constraints are dropped and recreated rather than altered — Postgres has no
-- ALTER CONSTRAINT for a check.
alter table scores drop constraint if exists scores_score_check;
alter table scores add constraint scores_score_check
  check (score >= 0 and score <= 1100);

alter table scores drop constraint if exists scores_badges_check;
alter table scores drop constraint if exists scores_platform_badges_check;
alter table scores add constraint scores_platform_badges_check
  check (platform_badges >= 0 and platform_badges <= 6);

alter table scores drop constraint if exists scores_field_badges_check;
alter table scores add constraint scores_field_badges_check
  check (field_badges >= 0 and field_badges <= 5);

-- The leaderboard view selects columns by name, so it has to be rebuilt for the
-- rename. security_invoker keeps the caller's RLS in force rather than the view
-- owner's — without it, a view is a common way to tunnel through your own
-- policies.
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
