// Rendering.
//
// The world fills the whole viewport. Rather than fixing a resolution and
// letterboxing it, we fix how big a tile should *feel* under a thumb (~48 CSS
// px) and derive the canvas resolution from that, clamped so the player never
// sees fewer than ~9 tiles (world vanishes) or more than ~18 (character becomes
// an ant). Everything textual lives in the DOM on top, so type scales
// independently of the pixel art.

import { TS } from './painter.js';
import { tile, bakeTiles } from './tiles.js';
import { chr, bakeCharacters } from './sprites.js';
import { grid, MAP_W, MAP_H } from './map.js';

export const state = {
  scale: 3,
  W: 0,
  H: 0,
  viewW: 0,   // visible world pixels
  viewH: 0
};

let canvas = null;
let ctx = null;
let mapCanvas = null;

export const camera = { x: 0, y: 0 };

export function init(el) {
  canvas = el;
  ctx = canvas.getContext('2d');
  bakeTiles();
  bakeCharacters();
  bakeMap();
  layout();
}

// The whole world painted once into an offscreen canvas: a frame then costs one
// drawImage instead of ~600.
export function bakeMap() {
  mapCanvas = document.createElement('canvas');
  mapCanvas.width = MAP_W * TS;
  mapCanvas.height = MAP_H * TS;
  const g = mapCanvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) g.drawImage(tile(grid[y][x]), x * TS, y * TS);
  }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

export function layout() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // How many CSS pixels one tile gets. The ceiling wins over the floor: on very
  // tall screens we'd rather show a long strip of big tiles than shrink the
  // sprites to nothing.
  const upper = Math.min(w / 9, h / 10);
  const lower = Math.max(w / 18, h / 17);
  let tileCss = 48;
  if (tileCss < lower) tileCss = lower;
  if (tileCss > upper) tileCss = upper;
  tileCss = Math.max(tileCss, 18);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.scale = clamp(Math.round(tileCss * dpr / TS), 2, 4);

  let W = Math.round(w / tileCss * TS * state.scale);
  let H = Math.round(h / tileCss * TS * state.scale);

  // Fill ceiling, so a big screen on a modest GPU stays smooth.
  const MAX_PX = 1400 * 1400;
  if (W * H > MAX_PX) {
    const k = Math.sqrt(MAX_PX / (W * H));
    W = Math.round(W * k);
    H = Math.round(H * k);
  }

  state.W = canvas.width = Math.max(160, W);
  state.H = canvas.height = Math.max(120, H);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.imageSmoothingEnabled = false;

  state.viewW = state.W / state.scale;
  state.viewH = state.H / state.scale;
}

// Camera follows the player and clamps to the map, except where the map is
// smaller than the view — then it centres, so there's never a black margin on
// one side only.
export function updateCamera(px, py) {
  const mapW = MAP_W * TS;
  const mapH = MAP_H * TS;
  const wantX = px + TS / 2 - state.viewW / 2;
  const wantY = py + TS / 2 - state.viewH / 2;
  camera.x = state.viewW >= mapW ? (mapW - state.viewW) / 2 : clamp(wantX, 0, mapW - state.viewW);
  camera.y = state.viewH >= mapH ? (mapH - state.viewH) / 2 : clamp(wantY, 0, mapH - state.viewH);
}

function drawWorld(cx, cy) {
  const mapW = MAP_W * TS;
  const mapH = MAP_H * TS;
  const sx = Math.max(0, cx);
  const sy = Math.max(0, cy);
  const ex = Math.min(mapW, cx + state.viewW);
  const ey = Math.min(mapH, cy + state.viewH);
  if (ex <= sx || ey <= sy) return;
  ctx.drawImage(
    mapCanvas,
    sx, sy, ex - sx, ey - sy,
    Math.round((sx - cx) * state.scale), Math.round((sy - cy) * state.scale),
    Math.round((ex - sx) * state.scale), Math.round((ey - sy) * state.scale)
  );
}

// A soft ellipse under each character. Cheap, but it's what stops sprites
// looking like stickers pasted on the grass.
function drawShadow(px, py, cx, cy) {
  const s = state.scale;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(
    (px + TS / 2 - cx) * s, (py + TS - 2 - cy) * s,
    5 * s * 0.8, 2 * s * 0.8, 0, 0, Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
}

// `entities` is [{ char, dir, frame, px, py }]. Sorted by foot position so
// whoever stands lower overlaps whoever stands higher.
export function draw(entities, { marks = [], time = 0 } = {}) {
  const cx = Math.round(camera.x);
  const cy = Math.round(camera.y);
  const s = state.scale;

  ctx.fillStyle = '#0d1410';
  ctx.fillRect(0, 0, state.W, state.H);
  drawWorld(cx, cy);

  const sorted = [...entities].sort((a, b) => a.py - b.py);
  for (const e of sorted) {
    drawShadow(e.px, e.py, cx, cy);
    ctx.drawImage(
      chr(e.char, e.dir, e.frame),
      Math.round((e.px - cx) * s), Math.round((e.py - cy) * s),
      TS * s, TS * s
    );
  }

  drawMarks(marks, cx, cy, time);
}

// A bobbing ▾ over anything you can interact with. Two players of the game this
// borrows from reported walking the whole map without realising there was an
// interact button at all — the marker is what prevents that.
function drawMarks(marks, cx, cy, time) {
  if (!marks.length) return;
  const s = state.scale;
  const size = Math.max(5, Math.round(3.2 * s));
  const bob = Math.sin(time / 320) * s;

  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#182818';
  ctx.lineWidth = Math.max(2, s * 0.7);
  ctx.fillStyle = '#f4f4e0';
  for (const m of marks) {
    const sx = (m.x * TS + TS / 2 - cx) * s;
    const sy = (m.y * TS - cy) * s - size + bob;
    if (sx < -size || sx > state.W + size || sy < -size || sy > state.H + size) continue;
    ctx.beginPath();
    ctx.moveTo(sx - size, sy - size);
    ctx.lineTo(sx + size, sy - size);
    ctx.lineTo(sx, sy + size * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// Called when the palette mode flips; art must be re-baked in the new mode.
export function rebakeArt() {
  bakeTiles();
  bakeCharacters();
  bakeMap();
}
