// Run state: two badge tracks, a score, a job title, and what's been seen.
//
// Persisted after every change, so an interrupted run on a phone (a call, a
// locked screen, a closed tab) survives.

import {
  FIELD_ORDER, PLATFORM_ORDER, NPC_CONTENT, TITLES, PROMOTIONS,
  SCORE_CORRECT, SCORE_WRONG_FIELD, SCORE_WRONG_PLATFORM
} from './content.js';

const KEY = 'sbq_progress_v2';

export const ROUTE_GATE_REQUIREMENT = 5;    // field badges to reach Route 2
export const CEILING_REQUIREMENT = 5;       // platform badges to open the hoarding
export const OFFICE_REQUIREMENT = 4;        // platform badges to open the closing room

const blank = () => ({
  field: [],
  platform: [],
  score: 0,
  title: TITLES.start,
  seen: {},
  routeOpen: false,
  gateOpen: false,
  officeOpen: false
});

export let run = blank();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      run = { ...blank(), ...JSON.parse(raw) };
      // Drop anything that isn't a real badge id — a stale save from an older
      // build shouldn't be able to push either count past its maximum.
      run.field = (run.field || []).filter(id => FIELD_ORDER.includes(id));
      run.platform = (run.platform || []).filter(id => PLATFORM_ORDER.includes(id));
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

export const hasBadge = id => run.field.includes(id) || run.platform.includes(id);
export const fieldCount = () => run.field.length;
export const platformCount = () => run.platform.length;
export const fieldComplete = () => run.field.length >= FIELD_ORDER.length;
export const platformComplete = () => run.platform.length >= PLATFORM_ORDER.length;
export const isComplete = () => fieldComplete() && platformComplete();

// Returns what changed, so the caller can stage the toasts and animations.
export function award(id, correct) {
  const content = NPC_CONTENT[id];
  if (!content || hasBadge(id)) return { badge: false };

  const isField = content.route === 1;
  (isField ? run.field : run.platform).push(id);

  const wrongValue = isField ? SCORE_WRONG_FIELD : SCORE_WRONG_PLATFORM;
  run.score += correct ? SCORE_CORRECT : wrongValue;

  // Titles only move on Route 1: the field is where the career happened.
  const promotion = PROMOTIONS[id] || null;
  if (promotion) run.title = promotion;

  const routeJustOpened = !run.routeOpen && run.field.length >= ROUTE_GATE_REQUIREMENT;
  if (routeJustOpened) run.routeOpen = true;

  const gateJustOpened = !run.gateOpen && run.platform.length >= CEILING_REQUIREMENT;
  if (gateJustOpened) run.gateOpen = true;

  const officeJustOpened = !run.officeOpen && run.platform.length >= OFFICE_REQUIREMENT;
  if (officeJustOpened) run.officeOpen = true;

  save();
  return { badge: true, isField, promotion, routeJustOpened, gateJustOpened, officeJustOpened };
}

export function setTitle(title) {
  if (run.title === title) return false;
  run.title = title;
  save();
  return true;
}

export function markSeen(id) {
  run.seen[id] = true;
  save();
}

export const hasSeen = id => !!run.seen[id];

// The next unvisited stop, in narrative order. Route 2 only starts suggesting
// once the gate is open, and the Ceiling stays quiet while it's still fenced —
// pointing at a locked gate is a worse hint than none.
export function nextTarget() {
  const field = FIELD_ORDER.find(id => !hasBadge(id));
  if (field) return field;
  if (!run.routeOpen) return null;
  return PLATFORM_ORDER.find(id => {
    if (hasBadge(id)) return false;
    if (id === 'ceiling' && !run.gateOpen) return false;
    return true;
  }) || null;
}

export const badgeLabels = () =>
  [...run.field, ...run.platform].map(id => NPC_CONTENT[id].badge);
