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
import {
  NPCS, END_SIGN, SPAWN_SIGN, GATE, ROUTE_GATE, OFFICE_DOOR, npcAt, rebuildCollision, grid
} from './map.js';
import {
  NPC_CONTENT, FIELD_ORDER, PLATFORM_ORDER, NUDGES, TITLES,
  END_SIGN_BEATS, SPAWN_SIGN_BEATS, BRIDGE_BEATS, INTRO_BEATS,
  GATE_LOCKED_BEATS, ROUTE_LOCKED_BEATS, OFFICE_LOCKED_BEATS
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
// interaction uses, so a marker can never promise something the game doesn't
// do. Anything already finished loses its marker.
function interactables() {
  const out = NPCS
    .filter(n => !progress.hasBadge(n.id) && !(n.id === 'closing' && !progress.run.officeOpen))
    .map(n => ({ x: n.x, y: n.y }));
  out.push({ x: END_SIGN.x, y: END_SIGN.y }, { x: SPAWN_SIGN.x, y: SPAWN_SIGN.y });
  return out;
}

// ---------------------------------------------------------------- interaction

function targetInFront() {
  const f = facingTile();
  const npc = npcAt(f.x, f.y);
  if (npc) return { kind: 'npc', npc };
  if (f.x === END_SIGN.x && f.y === END_SIGN.y) return { kind: 'sign', beats: END_SIGN_BEATS, name: 'SIGN' };
  if (f.x === SPAWN_SIGN.x && f.y === SPAWN_SIGN.y) return { kind: 'sign', beats: SPAWN_SIGN_BEATS, name: 'SIGN' };
  if (f.x === ROUTE_GATE.x && f.y === ROUTE_GATE.y && !progress.run.routeOpen) {
    return { kind: 'sign', beats: ROUTE_LOCKED_BEATS, name: 'GATE' };
  }
  if (f.x === GATE.x && f.y === GATE.y && !progress.run.gateOpen) {
    return { kind: 'sign', beats: GATE_LOCKED_BEATS, name: 'NOTICE' };
  }
  if (f.x === OFFICE_DOOR.x && f.y === OFFICE_DOOR.y && !progress.run.officeOpen) {
    return { kind: 'sign', beats: OFFICE_LOCKED_BEATS, name: 'DOOR' };
  }
  return null;
}

function interact() {
  const target = targetInFront();
  if (!target) return;

  if (target.kind === 'sign') {
    openTalk(target.beats, { name: target.name, speaker: 'sign' });
    return;
  }

  const npc = target.npc;
  const content = NPC_CONTENT[npc.id];
  if (!content) return;

  if (progress.hasBadge(npc.id)) {
    openTalk([`${content.badge} — done. Go on, then.`], { name: content.name });
    return;
  }

  // No quiz: the hidden NPC and the closing room are told, not tested.
  if (!content.quiz) {
    openTalk(content.beats, {
      name: content.name,
      onDone: () => finishNpc(npc, { correct: false })
    });
    return;
  }

  const isField = content.route === 1;
  openTalk(content.beats, {
    name: content.name,
    quiz: {
      ...content.quiz,
      // Route 1 asks for judgment, so a wrong answer is met with "that's what
      // most people try" and the story of what happened when we did. Route 2
      // asks about facts, so it gets the fact. Both then hear the reveal.
      resolve: (correct, answer) => {
        const opening = correct
          ? ['✅ That\'s the call.']
          : isField
            ? ['That\'s what most people try.', 'Here\'s what happened when we did.']
            : [`Not quite — ${answer}.`];
        return [...opening, ...(content.reveal || []), ...(content.beyond || [])];
      }
    },
    onDone: result => finishNpc(npc, result)
  });
}

function openTalk(beats, opts = {}) {
  mode = 'dialog';
  // Scenes can rewrite the world between lines — a pile of crates disappearing
  // as the tooling that removed it is described.
  dialogue.open(beats, {
    world: changes => {
      for (const [x, y, tile] of changes) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = tile;
      }
      const { routeOpen, gateOpen, officeOpen } = progress.run;
      rebuildCollision({ routeOpen, gateOpen, officeOpen });
      render.bakeMap();
    },
    ...opts
  });
}

function finishNpc(npc, { correct }) {
  const content = NPC_CONTENT[npc.id];

  // The hidden NPC is a find, not a stop on the tour: no badge, no points.
  if (content.secret) {
    progress.markSeen(npc.id);
    screens.toast('You found something that isn\'t on the map.');
    return;
  }

  // The closing room ends the run.
  if (npc.id === 'closing') {
    progress.markSeen(npc.id);
    setTimeout(showResults, 600);
    return;
  }

  const result = progress.award(npc.id, correct);
  if (!result.badge) return;

  sfx.badge();
  const points = correct ? 100 : (result.isField ? 50 : 25);
  screens.toast(`Badge earned: ${content.badge} · +${points}`);
  updateHud();

  if (result.promotion) {
    setTimeout(() => {
      sfx.unlock();
      flashPromotion();
      screens.toast(`PROMOTED — ${result.promotion}`, 3200);
    }, 1800);
  }

  applyGates(result);

  if (progress.isComplete() && progress.hasSeen('closing')) {
    setTimeout(showResults, 1400);
    return;
  }
  nudge();
}

// Rebuild collision and re-bake the map whenever a gate opens, and say so.
function applyGates(result) {
  const { routeOpen, gateOpen, officeOpen } = progress.run;
  if (!result.routeJustOpened && !result.gateJustOpened && !result.officeJustOpened) return;

  rebuildCollision({ routeOpen, gateOpen, officeOpen });
  render.bakeMap();

  const delay = result.promotion ? 3600 : 2200;
  setTimeout(() => {
    sfx.unlock();
    if (result.routeJustOpened) {
      // The bridge beat: the reason Route 1 leads to Route 2 at all.
      openTalk(BRIDGE_BEATS, {
        name: 'Laura',
        onDone: () => {
          progress.setTitle(TITLES.route2);
          flashPromotion();
          updateHud();
          screens.toast('The gate south is open. → ROUTE 2', 3200);
          nudge();
        }
      });
    } else if (result.gateJustOpened) {
      screens.toast('The hoarding at the eastern edge comes down.');
    } else if (result.officeJustOpened) {
      screens.toast('A door opened past Route 2.');
    }
  }, delay);
}

function nudge() {
  const next = progress.nextTarget();
  if (next && NUDGES[next]) screens.setObjective(NUDGES[next]);
  else if (progress.run.officeOpen && !progress.hasSeen('closing')) {
    screens.setObjective('There is a room past Route 2. Someone is waiting.');
  }
}

// ---------------------------------------------------------------- HUD

function paintDots(el, count, total) {
  el.innerHTML = Array.from({ length: total },
    (_, i) => `<i class="${i < count ? 'on' : ''}"></i>`).join('');
}

function updateHud() {
  document.getElementById('hudTitle').textContent = progress.run.title;
  paintDots(document.getElementById('fieldDots'), progress.fieldCount(), FIELD_ORDER.length);
  paintDots(document.getElementById('platformDots'), progress.platformCount(), PLATFORM_ORDER.length);
  document.getElementById('fieldCount').textContent = `${progress.fieldCount()}/${FIELD_ORDER.length}`;
  document.getElementById('platformCount').textContent = `${progress.platformCount()}/${PLATFORM_ORDER.length}`;
}

function flashPromotion() {
  const el = document.getElementById('hudJob');
  updateHud();
  el.classList.remove('promoted');
  void el.offsetWidth;   // restart the animation
  el.classList.add('promoted');
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

let lastDirLatch = null;

function pumpMenuInput() {
  if (!dialogue.isChoosing()) { lastDirLatch = null; return; }
  const dir = input.held.up ? 'up' : input.held.down ? 'down' : null;
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

function showResults() {
  const session = landing.getSession();
  const signedIn = db.isConfigured() && session && landing.getProfile();

  screens.showResults({
    onPlayAgain: startNewRun,
    onHome: () => { mode = 'title'; landing.showLanding(); },

    save: signedIn ? async () => {
      const { error } = await db.submitScore(
        session.user.id, progress.run.score,
        progress.platformCount(), progress.fieldCount()
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

function refreshWorld() {
  const { routeOpen, gateOpen, officeOpen } = progress.run;
  rebuildCollision({ routeOpen, gateOpen, officeOpen });
  render.bakeMap();
}

function startPlaying() {
  screens.hideTitle();
  mode = 'play';
  last = 0;
  accumulator = 0;
  refreshWorld();
  updateHud();

  // The opening plays once. It's the introduction to a person, not a tutorial
  // to sit through on every visit, and progress already survives a reload.
  //
  // The objective chip waits until she's finished: pointing at the first stop
  // while she's still explaining what the game is answers a question the
  // player hasn't been given yet.
  if (!progress.hasSeen('intro')) {
    progress.markSeen('intro');
    screens.setObjective('');
    openTalk(INTRO_BEATS, { name: 'LAURA', speaker: 'laura', onDone: nudge });
    return;
  }
  nudge();
}

function startNewRun() {
  progress.reset();
  progress.markSeen('intro');   // replaying doesn't mean sitting through it again
  resetPlayer();
  refreshWorld();
  updateHud();
  screens.setObjective('Read the sign, then find the workshop.');
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

  refreshWorld();
  updateHud();

  landing.init({
    onStartGame: () => {
      mode = 'title';
      screens.showTitle(progress.fieldCount() + progress.platformCount() > 0);
    }
  });
  landing.showLanding();

  requestAnimationFrame(frame);
}

start();
