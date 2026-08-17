// Painter — a tiny pixel-drawing surface.
//
// All art in this game is drawn procedurally at runtime; there are no image
// assets. Writing art as code (rect/circle/line calls) rather than as typed
// grids of characters means a whole cast of NPCs can come out of one
// parameterised function, and a tile can be recoloured by changing one string.

export const TS = 16; // tile size in world pixels

import { GB, MONO } from './palette.js';

let monochrome = false;

export function setMonochrome(on) { monochrome = !!on; }
export function isMonochrome() { return monochrome; }

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Named colours have an authored monochrome shade (see MONO in palette.js).
// Anything generated at runtime by shade() falls back to luminance, with cuts
// placed between the clusters our palette actually occupies rather than at even
// quarters.
const GB_CUTS = [0.30, 0.50, 0.72];

function toGB(hex) {
  const mapped = MONO[hex];
  if (mapped) return mapped;
  const l = luminance(hex);
  let i = 0;
  while (i < GB_CUTS.length && l >= GB_CUTS[i]) i++;
  return GB[i];
}

// Lighten (f > 1) or darken (f < 1) a hex colour. Cheap shading for roofs,
// edges and highlights without hand-picking every tone.
export function shade(hex, f) {
  const part = i => Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))
    .toString(16).padStart(2, '0');
  return '#' + part(1) + part(3) + part(5);
}

export class Painter {
  constructor(w = TS, h = TS) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null); // null = transparent
  }

  set(x, y, c) {
    x |= 0; y |= 0;
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
    return this;
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  hline(x, y, w, c) { return this.rect(x, y, w, 1, c); }
  vline(x, y, h, c) { return this.rect(x, y, 1, h, c); }

  circle(cx, cy, r, c) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      // The +r*0.5 fudge fills the rim; a strict r*r leaves pixel-art circles
      // looking notched at these sizes.
      if (x * x + y * y <= r * r + r * 0.5) this.set(cx + x, cy + y, c);
    }
    return this;
  }

  // Deterministic scatter, so a tile looks textured but identical every reload.
  speckle(n, colors, seed = 1) {
    for (let i = 0; i < n; i++) {
      const h = ((i + seed) * 73856093) ^ ((i * seed + 7) * 19349663);
      const x = Math.abs(h) % this.w;
      const y = Math.abs(h >> 8) % this.h;
      this.set(x, y, colors[Math.abs(h >> 16) % colors.length]);
    }
    return this;
  }

  mirrored() {
    const out = new Painter(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      out.px[y * this.w + (this.w - 1 - x)] = this.px[y * this.w + x];
    }
    return out;
  }

  bake() {
    const cv = document.createElement('canvas');
    cv.width = this.w;
    cv.height = this.h;
    const g = cv.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.px[y * this.w + x];
      if (!c) continue;
      g.fillStyle = monochrome ? toGB(c) : c;
      g.fillRect(x, y, 1, 1);
    }
    return cv;
  }
}
