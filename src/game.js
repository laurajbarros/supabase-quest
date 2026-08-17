// Main loop and glue.
//
// Fixed 60Hz timestep with a capped accumulator, so a dropped frame on a slow
// phone never turns into a spiral of catch-up updates.

import * as render from './render.js';
import * as input from './input.js';
import * as dialogue from './dialogue.js';
import * as screens from './screens.js';
import * as progress from './progress.js';
import { setMonochrome, isMonochrome, TS } from './painter.js';
import { player, update as updatePlayer, facingTile, resetPlayer } from './player.js';
import { NPCS, END_SIGN, GATE, npcAt, rebuildCollision } from './map.js';
import {
  NPC_CONTENT, NPC_ORDER, NUDGES, END_SIGN_BEATS, GATE_LOCKED_BEATS
} from './content.js';
import { sfx, isMuted, setMuted } from './audio.js';
import * as landing from './landing.js';
import * as db from './supabase.js';

const STEP_MS = 1000 / 60;
const MAX_CATCHUP = 5;

let accumulator = 0;
let last = 0;
let clock = 0;
let mode = 'title';   // title | play | dialog

// ---------------------------------------------------------------- rendering

function entities() {
  return [
    ...NPCS.map(n => ({ char: n.char, dir: n.dir, frame: 0, px: n.x * TS, py: n.y * TS })),
    { char: player.char, dir: player.dir, frame: player.frame, px: player.px, py: player.py }
  ];
}

// Everything you can walk up to and press A on. Derived from the same rule the
// interaction itself uses, so a marker can never promise something the game
// doesn't do. Anything already finished loses its marker.
function interactables() {
  const out = NPCS
    .filter(n => !progress.hasBadge(n.id))
    .map(n => ({ x: n.x, y: n.y }));
  out.push({ x: END_SIGN.x, y: END_SIGN.y });
  return out;
}

// ---------------------------------------------------------------- interaction

function targetInFront() {
  const f = facingTile();
  const npc = npcAt(f.x, f.y);
  if (npc) return { kind: 'npc', npc };
  if (f.x === END_SIGN.x && f.y === END_SIGN.y) return { kind: 'sign' };
  if (f.x === GATE.x && f.y === GATE.y && !progress.run.gateOpen) return { kind: 'gate' };
  return null;
}

function interact() {
  const target = targetInFront();
  if (!target) return;

  if (target.kind === 'sign') {
    openTalk(END_SIGN_BEATS, { name: 'SIGN', speaker: 'sign' });
    return;
  }
  if (target.kind === 'gate') {
    openTalk(GATE_LOCKED_BEATS, { name: 'NOTICE', speaker: 'sign' });
    return;
  }

  const npc = target.npc;
  const content = NPC_CONTENT[npc.id];

  // Multigres is behind the hoarding; you can't reach it before the gate opens,
  // so no locked branch is needed here.
  if (progress.hasBadge(npc.id)) {
    // Already certified — a short acknowledgement rather than the whole talk
    // again, which would be tedious on a replay.
    openTalk([`${content.badge} badge earned. Go on, then.`], { name: content.name });
    return;
  }

  openTalk(content.beats, {
    name: content.name,
    quiz: content.quiz || null,
    onDone: result => finishNpc(npc, result)
  });
}

function openTalk(beats, opts = {}) {
  mode = 'dialog';
  dialogue.open(beats, opts);
}

function finishNpc(npc, { correct }) {
  const content = NPC_CONTENT[npc.id];

  // The hidden NPC is a find, not a stop on the tour: no badge, no points.
  if (content.secret) {
    progress.markSeen(npc.id);
    screens.toast('You found something that isn\'t on the map.');
    updateHud();
    return;
  }

  const { badge, gateJustOpened } = progress.award(npc.id, correct);
  if (!badge) return;

  sfx.badge();
  screens.toast(`Badge earned: ${content.badge} · +${correct ? 100 : 50}`);
  updateHud();

  if (gateJustOpened) {
    rebuildCollision({ gateOpen: true });
    render.bakeMap();
    // Delayed so it doesn't collide with the badge toast.
    setTimeout(() => {
      sfx.unlock();
      screens.toast('The hoarding at the eastern edge comes down.');
    }, 2200);
  }

  if (progress.isComplete()) {
    setTimeout(showResults, 1400);
    return;
  }
  nudge();
}

function nudge() {
  const next = progress.nextTarget();
  if (!next) return;
  screens.setObjective(NUDGES[next]);
}

// ---------------------------------------------------------------- HUD

function updateHud() {
  const count = document.getElementById('hudCount');
  const fill = document.getElementById('hudBarFill');
  const badges = document.getElementById('hudBadges');
  const n = progress.badgeCount();

  if (count) count.textContent = `${n}/6`;
  if (fill) fill.style.width = `${(n / NPC_ORDER.length) * 100}%`;
  if (badges) {
    badges.innerHTML = NPC_ORDER
      .map(id => `<i class="${progress.hasBadge(id) ? 'on' : ''}" title="${NPC_CONTENT[id].badge}">★</i>`)
      .join('');
  }
}

let hintOn = false;

function updateHint() {
  const on = mode === 'play' && !!targetInFront();
  if (on === hintOn) return;
  hintOn = on;
  const btn = document.querySelector('[data-btn="a"]');
  if (btn) btn.classList.toggle('hint', on);
}

// ---------------------------------------------------------------- loop

function frame(now) {
  if (!last) last = now;
  const dt = now - last;
  last = now;
  clock += dt;

  if (mode !== 'title') {
    accumulator += dt;
    let steps = 0;
    while (accumulator >= STEP_MS && steps < MAX_CATCHUP) {
      updatePlayer(mode !== 'play');
      accumulator -= STEP_MS;
      steps++;
    }
    if (steps === MAX_CATCHUP) accumulator = 0;

    dialogue.update(dt);
    if (mode === 'dialog' && !dialogue.isOpen()) mode = 'play';

    updateHint();
    render.updateCamera(player.px, player.py);
    render.draw(entities(), { marks: mode === 'play' ? interactables() : [], time: clock });
  }

  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- input glue

// Directions serve two masters: walking, and moving between quiz options.
let lastDirLatch = null;

function pumpMenuInput() {
  if (!dialogue.isChoosing()) { lastDirLatch = null; return; }
  const up = input.held.up;
  const down = input.held.down;
  const dir = up ? 'up' : down ? 'down' : null;
  if (dir && dir !== lastDirLatch) dialogue.moveChoice(dir === 'down' ? 1 : -1);
  lastDirLatch = dir;
}

function onAction() {
  if (mode === 'title') { startPlaying(); return; }
  if (screens.isResultsVisible() || screens.isQuestLogOpen()) return;
  if (dialogue.isOpen()) { dialogue.action(); return; }
  interact();
}

// ---------------------------------------------------------------- lifecycle

function startPlaying() {
  screens.hideTitle();
  mode = 'play';
  last = 0;
  accumulator = 0;
  rebuildCollision({ gateOpen: progress.run.gateOpen });
  render.bakeMap();
  updateHud();
  nudge();
}

// A finished run: submit the score, offer a recommendation, and let them go
// back to the page. Everything server-side is optional — an offline or
// unconfigured build shows the same screen minus those blocks.
function showResults() {
  const session = landing.getSession();
  const signedIn = db.isConfigured() && session && landing.getProfile();

  screens.showResults({
    onPlayAgain: startNewRun,
    onHome: () => { mode = 'title'; landing.showLanding(); },

    save: signedIn ? async () => {
      const { error } = await db.submitScore(
        session.user.id, progress.run.score, progress.badgeCount()
      );
      if (error) return `Couldn't save: ${db.friendlyError(error)}`;
      landing.refreshPublic();
      return 'Saved to the leaderboard.';
    } : null,

    recommend: signedIn ? async text => {
      const { error } = await db.submitRecommendation(session.user.id, text);
      if (error) return `Couldn't send: ${db.friendlyError(error)}`;
      return 'Sent. It appears once approved.';
    } : null
  });
}

function startNewRun() {
  progress.reset();
  resetPlayer();
  rebuildCollision({ gateOpen: false });
  render.bakeMap();
  updateHud();
  screens.setObjective('Find the professor outside the lab.');
  mode = 'play';
}

function bindChrome() {
  document.getElementById('btnPalette').addEventListener('click', () => {
    setMonochrome(!isMonochrome());
    document.body.classList.toggle('mono', isMonochrome());
    document.getElementById('btnPalette').setAttribute('aria-pressed', String(isMonochrome()));
    render.rebakeArt();
  });

  document.getElementById('btnMenu').addEventListener('click', () => screens.toggleQuestLog());

  const mute = document.getElementById('btnMute');
  const paintMute = () => {
    mute.textContent = isMuted() ? '🔇' : '🔊';
    mute.setAttribute('aria-pressed', String(!isMuted()));
  };
  mute.addEventListener('click', () => { setMuted(!isMuted()); paintMute(); if (!isMuted()) sfx.select(); });
  paintMute();

  document.getElementById('titleScreen').addEventListener('click', () => {
    if (mode === 'title') startPlaying();
  });

  let resizeTimer = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render.layout(), 60);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  // Returning from a background tab produces a huge dt; drop it rather than
  // fast-forwarding the player across the map.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { last = 0; accumulator = 0; }
  });
}

export function start() {
  progress.load();
  render.init(document.getElementById('game'));
  input.init({ onAction, onDirection: pumpMenuInput });
  dialogue.init();
  screens.init();
  bindChrome();

  rebuildCollision({ gateOpen: progress.run.gateOpen });
  render.bakeMap();
  updateHud();

  // The landing page is the front door; the title screen sits behind it, shown
  // once they've chosen to play (and signed in, if Supabase is configured).
  landing.init({
    onStartGame: () => {
      mode = 'title';
      screens.showTitle(progress.badgeCount() > 0);
    }
  });
  landing.showLanding();

  requestAnimationFrame(frame);
}

start();
