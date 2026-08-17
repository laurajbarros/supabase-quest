// Grid movement. One press moves exactly one tile; the sprite tweens across the
// gap while input is locked. This — not free-floating movement — is what makes
// it feel like a Game Boy game.

import { TS } from './painter.js';
import { isSolid, PLAYER_START } from './map.js';
import { currentDirection, tick } from './input.js';
import { sfx } from './audio.js';

const STEP_FRAMES = 10;  // ~166ms per tile at 60fps
const TURN_FRAMES = 5;   // turning on the spot still costs a beat

export const DELTA = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export const player = {
  char: 'player',
  tx: PLAYER_START.x,
  ty: PLAYER_START.y,
  px: PLAYER_START.x * TS,
  py: PLAYER_START.y * TS,
  dir: 'down',
  frame: 0,
  moving: false
};

let fromX = player.px;
let fromY = player.py;
let progress = 0;
let turnCooldown = 0;
let stepCount = 0;

// The tile the player is facing — the interaction target.
export function facingTile() {
  const d = DELTA[player.dir];
  return { x: player.tx + d.x, y: player.ty + d.y };
}

function beginMove(dir) {
  const d = DELTA[dir];
  const nx = player.tx + d.x;
  const ny = player.ty + d.y;
  player.dir = dir;

  if (isSolid(nx, ny)) {
    turnCooldown = TURN_FRAMES;
    player.frame = 0;
    return;
  }

  fromX = player.px;
  fromY = player.py;
  player.tx = nx;
  player.ty = ny;
  player.moving = true;
  progress = 0;
  stepCount++;
  sfx.step();
}

export function resetPlayer() {
  player.tx = PLAYER_START.x;
  player.ty = PLAYER_START.y;
  player.px = PLAYER_START.x * TS;
  player.py = PLAYER_START.y * TS;
  player.dir = 'down';
  player.frame = 0;
  player.moving = false;
  progress = 0;
  turnCooldown = 0;
}

export function update(locked = false) {
  tick();

  if (player.moving) {
    progress++;
    const t = progress / STEP_FRAMES;
    player.px = fromX + (player.tx * TS - fromX) * t;
    player.py = fromY + (player.ty * TS - fromY) * t;
    // Alternate the two stride frames between steps so a run of steps reads as
    // a cycle rather than a twitch.
    player.frame = progress < STEP_FRAMES / 2 ? 1 + (stepCount % 2) : 0;

    if (progress >= STEP_FRAMES) {
      player.moving = false;
      player.px = player.tx * TS;
      player.py = player.ty * TS;
    }
    return;
  }

  player.frame = 0;
  if (turnCooldown > 0) { turnCooldown--; return; }
  if (locked) return;

  const dir = currentDirection();
  if (dir) beginMove(dir);
}
