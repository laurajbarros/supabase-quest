-- ============================================================
-- Migration 003 — recommendations are public on submit
--
-- Run once in Dashboard -> SQL Editor.
--
-- Removes the approval step: notes appear on the landing page as soon as they
-- are written, rather than waiting to be flipped in the dashboard.
--
-- The tradeoff is real and worth stating. Anyone who can sign in can now
-- publish 200 characters to a page attached to a job application, with no
-- review. The `approved` column is kept rather than dropped so moderation is
-- one statement away:
--
--   drop policy "recs public read" on recommendations;
--   create policy "approved recs public" on recommendations
--     for select using (approved = true);
--
-- Still absent, deliberately: any update policy. Nobody can edit or retract a
-- note from the browser, including its author.
-- ============================================================

drop policy if exists "approved recs public" on recommendations;
drop policy if exists "read own recs" on recommendations;
drop policy if exists "recs public read" on recommendations;

create policy "recs public read" on recommendations
  for select using (true);

-- New notes are visible immediately; existing ones stop being hidden.
alter table recommendations alter column approved set default true;
update recommendations set approved = true where approved = false;

-- The partial index only covered approved rows and the wall now reads all of
-- them, ordered by recency.
drop index if exists recommendations_approved_idx;
create index if not exists recommendations_created_idx
  on recommendations (created_at desc);
