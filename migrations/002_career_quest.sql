-- ============================================================
-- Migration 002 — Career Quest
--
-- Replaces the two-track field/platform model with one badge count and a
-- separate count of League trials, and records how many challenges were
-- cleared first try.
--
-- Run once in Dashboard -> SQL Editor, on a project that already has 001.
-- A fresh project should run schema.sql instead, which includes all of this.
--
-- No RLS policy changes. The policies key off user_id, which nothing here
-- touches — which is the point of writing them that way.
-- ============================================================

-- Existing rows first, or the new constraints reject them.
--
-- `field_badges` counted career-route encounters in the two-route version. The
-- League and its trials did not exist then, so there is no honest value to
-- carry across and the column is zeroed rather than reinterpreted. Reusing the
-- storage is fine; reusing the meaning would put trials on the leaderboard
-- that nobody played.
--
-- `platform_badges` does carry across: both models count badges, and the old
-- maximum of 6 is inside the new maximum of 7.
-- Guarded so the whole migration is safe to re-run: on a project where it has
-- already been applied these columns are gone, and an unguarded statement would
-- fail with "column does not exist" rather than doing nothing.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'scores' and column_name = 'field_badges') then
    update scores set field_badges = 0 where field_badges <> 0;
    alter table scores rename column field_badges to trials;
  end if;

  if exists (select 1 from information_schema.columns
             where table_name = 'scores' and column_name = 'platform_badges') then
    alter table scores rename column platform_badges to badges;
  end if;
end $$;

-- Constraints are dropped and recreated rather than altered: Postgres has no
-- ALTER CONSTRAINT for a check.
alter table scores drop constraint if exists scores_platform_badges_check;
alter table scores drop constraint if exists scores_badges_check;
alter table scores add constraint scores_badges_check
  check (badges >= 0 and badges <= 7);

alter table scores drop constraint if exists scores_field_badges_check;
alter table scores drop constraint if exists scores_trials_check;
alter table scores add constraint scores_trials_check
  check (trials >= 0 and trials <= 4);

-- How many of the 11 challenges (7 gyms + 4 trials) were cleared without a
-- wrong answer. A wrong answer costs points but never blocks, so without this
-- every finisher would sit at 7/7 and the leaderboard would have nothing to
-- compare.
alter table scores add column if not exists first_try int not null default 0;
alter table scores drop constraint if exists scores_first_try_check;
alter table scores add constraint scores_first_try_check
  check (first_try >= 0 and first_try <= 11);

-- The score ceiling is unchanged: 11 challenges at 100 each is still 1100.
alter table scores drop constraint if exists scores_score_check;
alter table scores add constraint scores_score_check
  check (score >= 0 and score <= 1100);

-- The view selects columns by name, so it has to be rebuilt for the rename.
-- security_invoker keeps the caller's RLS in force rather than the view
-- owner's — without it, a view is a common way to tunnel through your own
-- policies.
drop view if exists leaderboard;
create view leaderboard
with (security_invoker = true) as
  select
    s.id,
    s.score,
    s.badges,
    s.trials,
    s.first_try,
    s.completed_at,
    p.display_name
  from scores s
  join profiles p on p.id = s.user_id
  order by s.score desc, s.first_try desc, s.completed_at asc;
