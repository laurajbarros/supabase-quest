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
  NPCS, GYM_IDS, ROUTE_GATE, TOWN_SIGN, BUS_STOP, NEXT_SIGN,
  npcAt, rebuildCollision, grid
} from './map.js';
import {
  NPC_CONTENT, BADGE_ORDER, MENTOR_BEATS,
  REGION1_CLEAR_BEATS, REGION2_LOCKED_BEATS, NEXT_BUILD_BEATS
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

// Gyms keep their marker until their badge is earned — they're the thing the
// player is actually looking for. Flavour NPCs lose theirs once spoken to, so
// a cleared area stops competing for attention.
function interactables() {
  const out = [];
  for (const n of NPCS) {
    const content = NPC_CONTENT[n.id];
    if (!content) continue;
    if (content.gym) {
      if (!progress.hasBadge(n.id)) out.push({ x: n.x, y: n.y });
    } else if (!progress.hasSeen(n.id)) {
      out.push({ x: n.x, y: n.y });
    }
  }
  out.push({ x: TOWN_SIGN.x, y: TOWN_SIGN.y }, { x: BUS_STOP.x, y: BUS_STOP.y });
  return out;
}

// ---------------------------------------------------------------- interaction

function targetInFront() {
  const f = facingTile();
  const npc = npcAt(f.x, f.y);
  if (npc) return { kind: 'npc', npc };

  if (f.x === TOWN_SIGN.x && f.y === TOWN_SIGN.y) {
    return { kind: 'sign', name: 'SIGN', beats: ['THE BEGINNING', 'Population: enough.'] };
  }
  if (f.x === BUS_STOP.x && f.y === BUS_STOP.y) {
    return { kind: 'sign', name: 'BUS STOP', beats: ['BUS STOP', 'Next bus: eventually.'] };
  }
  if (f.x === NEXT_SIGN.x && f.y === NEXT_SIGN.y) {
    return { kind: 'sign', name: 'SIGN', beats: NEXT_BUILD_BEATS };
  }
  if (f.x === ROUTE_GATE.x && f.y === ROUTE_GATE.y && !progress.run.region2Open) {
    return { kind: 'sign', name: 'ROAD', beats: REGION2_LOCKED_BEATS };
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

  // The Mentor repeats the briefing on demand — the player may have tapped
  // through it, and it's the only place the badge loop is stated outright.
  if (npc.id === 'mentor') {
    openTalk(MENTOR_BEATS, { name: content.name, speaker: 'mentor' });
    return;
  }

  // A cleared gym gets its closing line, so returning isn't a dead end.
  if (content.gym && progress.hasBadge(npc.id)) {
    openTalk([content.postWin], { name: content.name });
    return;
  }

  // Flavour: one line, no question, no badge.
  if (!content.quiz) {
    openTalk(content.beats, {
      name: content.name,
      speaker: content.rival ? 'rival' : 'npc',
      onDone: () => { progress.markSeen(npc.id); }
    });
    return;
  }

  openTalk(content.beats, {
    name: content.name,
    quiz: content.quiz,
    onDone: result => finishGym(npc, result)
  });
}

function openTalk(beats, opts = {}) {
  mode = 'dialog';
  // Scenes can rewrite the world between lines.
  dialogue.open(beats, {
    world: changes => {
      for (const [x, y, tile] of changes) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = tile;
      }
      rebuildCollision({ region2Open: progress.run.region2Open });
      render.bakeMap();
    },
    ...opts
  });
}

function finishGym(npc, { firstTry }) {
  const content = NPC_CONTENT[npc.id];
  const result = progress.award(npc.id, firstTry);
  if (!result.badge) return;

  sfx.badge();
  screens.toast(`${content.badge} BADGE · +${firstTry ? 100 : 50}`, 3000);
  updateHud();

  if (result.region2JustOpened) {
    rebuildCollision({ region2Open: true });
    render.bakeMap();
    setTimeout(() => {
      sfx.unlock();
      openTalk(REGION1_CLEAR_BEATS, {
        name: 'The Mentor',
        speaker: 'mentor',
        onDone: () => {
          screens.setObjective('The road south is open.');
          screens.toast('The road out of town is open.', 3200);
        }
      });
    }, 2400);
    return;
  }
  nudge();
}

function nudge() {
  const next = progress.nextTarget();
  const content = next && NPC_CONTENT[next];
  if (content && content.hint) screens.setObjective(`Next badge: ${content.hint}`);
  else screens.setObjective('');
}

// ---------------------------------------------------------------- HUD

function updateHud() {
  const dots = document.getElementById('badgeDots');
  const count = document.getElementById('badgeCount');
  const n = progress.badgeCount();
  if (dots) {
    dots.innerHTML = BADGE_ORDER
      .map(id => `<i class="${progress.hasBadge(id) ? 'on' : ''}"></i>`).join('');
  }
  if (count) count.textContent = `${n}/${BADGE_ORDER.length}`;
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
        progress.badgeCount(), progress.trialCount(), progress.run.firstTry
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
  rebuildCollision({ region2Open: progress.run.region2Open });
  render.bakeMap();
}

function startPlaying() {
  screens.hideTitle();
  mode = 'play';
  last = 0;
  accumulator = 0;
  refreshWorld();
  updateHud();

  // The Mentor's briefing plays once. It's the only place the loop is stated
  // outright — badges live in gyms, gyms are out there — so he also repeats it
  // on demand for anyone who tapped through.
  if (!progress.hasSeen('mentorIntro')) {
    progress.markSeen('mentorIntro');
    screens.setObjective('');
    openTalk(MENTOR_BEATS, { name: 'The Mentor', speaker: 'mentor', onDone: nudge });
    return;
  }
  nudge();
}

function startNewRun() {
  progress.reset();
  progress.markSeen('mentorIntro');
  resetPlayer();
  refreshWorld();
  updateHud();
  nudge();
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
      screens.showTitle(progress.badgeCount() > 0);
    }
  });
  landing.showLanding();

  requestAnimationFrame(frame);
}

start();
