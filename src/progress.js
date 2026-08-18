// Run state: badges, League trials, score, and what's been seen.
//
// Persisted after every change, so an interrupted run on a phone (a call, a
// locked screen, a closed tab) survives.

import {
  BADGE_ORDER, TRIAL_ORDER, NPC_CONTENT,
  SCORE_FIRST_TRY, SCORE_AFTER_RETRY
} from './content.js';

// v3: the two-track field/platform model is gone, replaced by one badge list.
const KEY = 'sbq_progress_v3';

export const REGION2_REQUIREMENT = 3;   // badges to open RebelMouse
export const LEAGUE_REQUIREMENT = 7;    // badges to open the Supabase League

const blank = () => ({
  badges: [],
  trials: [],
  score: 0,
  // How many challenges were cleared without a wrong answer. Shown on the
  // leaderboard, because with retries free everyone finishes at 7/7 and the
  // board needs something to actually compare.
  firstTry: 0,
  seen: {},
  region2Open: false,
  leagueOpen: false
});

export let run = blank();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      run = { ...blank(), ...JSON.parse(raw) };
      // Drop anything that isn't a real id — a stale save from an older build
      // shouldn't be able to push a count past its maximum.
      run.badges = (run.badges || []).filter(id => BADGE_ORDER.includes(id));
      run.trials = (run.trials || []).filter(id => TRIAL_ORDER.includes(id));
    }
  } catch {
    run = blank();
  }
  return run;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(run));
  } catch {
    // Private mode, or storage full. Losing the save is survivable; crashing
    // mid-conversation is not.
  }
}

export function reset() {
  run = blank();
  save();
}

export const hasBadge = id => run.badges.includes(id);
export const hasTrial = id => run.trials.includes(id);
export const badgeCount = () => run.badges.length;
export const trialCount = () => run.trials.length;
export const allBadges = () => run.badges.length >= BADGE_ORDER.length;
export const allTrials = () => run.trials.length >= TRIAL_ORDER.length;

// `firstTry` is whether they got it without a wrong answer. A wrong answer
// costs points, never progress — the gym still hands over the badge.
export function award(id, firstTry) {
  if (hasBadge(id)) return { badge: false };

  run.badges.push(id);
  run.score += firstTry ? SCORE_FIRST_TRY : SCORE_AFTER_RETRY;
  if (firstTry) run.firstTry++;

  const region2JustOpened = !run.region2Open && run.badges.length >= REGION2_REQUIREMENT;
  if (region2JustOpened) run.region2Open = true;

  const leagueJustOpened = !run.leagueOpen && run.badges.length >= LEAGUE_REQUIREMENT;
  if (leagueJustOpened) run.leagueOpen = true;

  save();
  return { badge: true, region2JustOpened, leagueJustOpened };
}

export function awardTrial(id, firstTry) {
  if (hasTrial(id)) return { trial: false };
  run.trials.push(id);
  run.score += firstTry ? SCORE_FIRST_TRY : SCORE_AFTER_RETRY;
  if (firstTry) run.firstTry++;
  save();
  return { trial: true };
}

export function markSeen(id) {
  run.seen[id] = true;
  save();
}

export const hasSeen = id => !!run.seen[id];

// The next unearned badge, in order. Drives the objective chip.
export function nextTarget() {
  return BADGE_ORDER.find(id => !hasBadge(id)) || null;
}

export const badgeLabels = () => run.badges.map(id => NPC_CONTENT[id].badge);
