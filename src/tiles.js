// Tile art, drawn procedurally. Tiles are referenced by name, not by number,
// so a map row reads as something close to a picture in source.

import { Painter, TS, shade } from './painter.js';
import { C } from './palette.js';

export { TS };

const DEFS = {
  // ---- ground -------------------------------------------------------------
  grass(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.speckle(14, [C.grassDark], 3);
  },
  grassAlt(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.speckle(9, [C.grassDark, C.leafLight], 11);
  },
  flowers(p) {
    p.rect(0, 0, TS, TS, C.grass);
    [[4, 5, C.paper], [11, 10, C.gold], [7, 13, C.brandLight]].forEach(([x, y, col]) => {
      p.set(x, y, col).set(x - 1, y, col).set(x + 1, y, col).set(x, y - 1, col);
      p.set(x, y + 1, C.grassEdge);
    });
  },
  path(p) {
    p.rect(0, 0, TS, TS, C.sand);
    p.speckle(7, [C.sandDark], 5);
  },
  plaza(p) {
    p.rect(0, 0, TS, TS, C.stone);
    p.hline(0, 0, TS, C.stoneDark).vline(0, 0, TS, C.stoneDark);
    p.set(8, 8, shade(C.stone, 0.94));
  },
  water(p) {
    p.rect(0, 0, TS, TS, C.water);
    p.hline(2, 4, 4, C.waterLight).hline(9, 9, 5, C.waterLight).hline(4, 13, 3, C.waterLight);
  },

  // ---- vegetation ---------------------------------------------------------
  tree(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.rect(6, 11, 4, 4, C.trunk);
    p.circle(8, 6, 6, C.leaf).circle(6, 5, 4, C.leafMid).circle(10, 4, 3, C.leafLight);
  },
  bush(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.circle(5, 10, 4, C.leafMid).circle(11, 10, 4, C.leafMid).circle(8, 8, 4, C.leafLight);
  },

  // ---- structures ---------------------------------------------------------
  // Roofs come in a top row and a bottom row so a building has a ridge and an
  // eave rather than a flat slab.
  roofTop(p)    { roof(p, C.brand, true); },
  roofBottom(p) { roof(p, C.brand, false); },
  roofTopAlt(p)    { roof(p, C.water, true); },
  roofBottomAlt(p) { roof(p, C.water, false); },
  roofTopDark(p)    { roof(p, C.night, true); },
  roofBottomDark(p) { roof(p, C.night, false); },

  wall(p) {
    p.rect(0, 0, TS, TS, C.wall);
    p.hline(0, 0, TS, C.wallShade).hline(0, 15, TS, shade(C.wallShade, 0.92));
  },
  window(p) {
    p.rect(0, 0, TS, TS, C.wall);
    p.rect(3, 3, 10, 9, C.glass).rect(3, 3, 10, 2, C.glassLight);
    p.vline(7, 3, 9, C.wall).hline(0, 15, TS, shade(C.wallShade, 0.92));
  },
  door(p) {
    p.rect(0, 0, TS, TS, C.wall);
    p.rect(4, 3, 8, 13, C.trunk).rect(5, 4, 6, 5, C.trunkLight);
    p.set(10, 11, C.gold);
  },
  // The lab door — glass and brand green, so the Postgres building reads as the
  // important one on the map.
  doorLab(p) {
    p.rect(0, 0, TS, TS, C.wall);
    p.rect(3, 3, 10, 13, C.brandDark).rect(4, 4, 8, 8, C.glass);
    p.rect(4, 4, 8, 2, C.glassLight);
    p.set(10, 13, C.gold);
  },

  // ---- props --------------------------------------------------------------
  sign(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.rect(7, 9, 2, 6, C.trunk);
    p.rect(2, 1, 12, 8, '#e8d8a8').hline(2, 1, 12, '#b09858');
    p.hline(4, 4, 8, '#685838').hline(4, 6, 5, '#685838');
  },
  fence(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.rect(0, 6, TS, 3, C.trunkLight);
    p.rect(1, 3, 3, 11, '#c09050').rect(12, 3, 3, 11, '#c09050');
    p.hline(0, 6, TS, '#c09050');
  },
  // Construction hoarding around the Multigres site.
  fenceWork(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.rect(0, 2, TS, 12, C.gold);
    for (let i = -12; i < TS; i += 6) {
      for (let k = 0; k < 3; k++) {
        for (let y = 2; y < 14; y++) p.set(i + k + (y - 2), y, C.ink);
      }
    }
    p.hline(0, 2, TS, C.goldDark).hline(0, 13, TS, C.goldDark);
  },
  // The open gap left once the hoarding comes down.
  gateOpen(p) {
    p.rect(0, 0, TS, TS, C.sand);
    p.speckle(6, [C.sandDark], 9);
    p.vline(0, 0, TS, C.goldDark).vline(15, 0, TS, C.goldDark);
  },
  pedestal(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.rect(3, 9, 10, 6, C.metal).rect(4, 8, 8, 2, C.metalLight);
    p.rect(2, 14, 12, 2, C.metalDark);
  },
  server(p) {
    p.rect(0, 0, TS, TS, C.night);
    p.rect(2, 1, 12, 14, C.nightLight);
    for (let y = 3; y < 13; y += 3) {
      p.hline(3, y, 8, '#202026');
      p.set(12, y, C.brand);
      p.set(13, y, C.gold);
    }
  }
};

function roof(p, color, top) {
  p.rect(0, 0, TS, TS, color);
  if (top) {
    p.hline(0, 0, TS, shade(color, 1.18));
    p.hline(0, 1, TS, shade(color, 1.06));
    for (let x = 0; x < TS; x += 4) p.vline(x, 2, 14, shade(color, 0.8));
  } else {
    p.hline(0, 14, TS, shade(color, 0.75));
    p.hline(0, 15, TS, shade(color, 0.6));
    for (let x = 2; x < TS; x += 4) p.vline(x, 0, 13, shade(color, 0.85));
  }
}

// Tiles that block movement.
export const SOLID = new Set([
  'water', 'tree', 'bush', 'sign', 'fence', 'fenceWork', 'server', 'pedestal',
  'roofTop', 'roofBottom', 'roofTopAlt', 'roofBottomAlt', 'roofTopDark', 'roofBottomDark',
  'wall', 'window', 'door', 'doorLab'
]);

// Minimap categories. Sampling average sprite colour doesn't work — every tile
// starts with a background fill, so a tree painted over grass averages out to
// grass. Listing the exceptions is both simpler and correct.
const KIND = {
  grass: 'ground', grassAlt: 'ground', flowers: 'ground',
  path: 'road', plaza: 'road', gateOpen: 'road',
  water: 'water',
  tree: 'veg', bush: 'veg',
  door: 'door', doorLab: 'door'
};

export function kindOf(name) {
  return KIND[name] || (SOLID.has(name) ? 'wall' : 'floor');
}

export const TILE_NAMES = Object.keys(DEFS);

let baked = null;

// Baked once at startup (and again when the palette mode flips), so a frame
// costs one drawImage for the whole world instead of one per tile.
export function bakeTiles() {
  baked = {};
  for (const [name, fn] of Object.entries(DEFS)) {
    const p = new Painter(TS, TS);
    fn(p);
    baked[name] = p.bake();
  }
  return baked;
}

export function tile(name) {
  if (!baked) throw new Error('bakeTiles() must run before rendering');
  const t = baked[name];
  if (!t) throw new Error(`Unknown tile '${name}'`);
  return t;
}
