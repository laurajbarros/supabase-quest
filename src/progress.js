// Run state: badges, score, and what's been seen.
//
// Persisted to localStorage after every change, so an interrupted run on a
// phone (a call, a locked screen, a closed tab) survives.

import { NPC_ORDER, NPC_CONTENT } from './content.js';

const KEY = 'sbq_progress_v1';
export const GATE_REQUIREMENT = 5;   // badges needed to open the Multigres site

const blank = () => ({ badges: [], score: 0, seen: {}, gateOpen: false });

export let run = blank();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      run = { ...blank(), ...parsed };
      // Drop anything that isn't a real badge id — a stale save from an older
      // build shouldn't be able to push the count past six.
      run.badges = (run.badges || []).filter(id => NPC_ORDER.includes(id));
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

export function hasBadge(id) { return run.badges.includes(id); }
export function badgeCount() { return run.badges.length; }
export function isComplete() { return run.badges.length >= NPC_ORDER.length; }

export function award(id, correct) {
  if (hasBadge(id)) return { badge: false, gateJustOpened: false };
  run.badges.push(id);
  run.score += correct ? 100 : 50;

  const gateJustOpened = !run.gateOpen && run.badges.length >= GATE_REQUIREMENT;
  if (gateJustOpened) run.gateOpen = true;

  save();
  return { badge: true, gateJustOpened };
}

export function markSeen(id) {
  run.seen[id] = true;
  save();
}

export function hasSeen(id) { return !!run.seen[id]; }

// The next unvisited stop, in narrative order. Multigres is skipped until its
// gate is open — pointing at a locked fence is a worse hint than none.
export function nextTarget() {
  return NPC_ORDER.find(id => {
    if (hasBadge(id)) return false;
    if (id === 'multigres' && !run.gateOpen) return false;
    return true;
  }) || null;
}

export function badgeLabels() {
  return run.badges.map(id => NPC_CONTENT[id].badge);
}
