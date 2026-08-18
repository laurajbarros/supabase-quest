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
  // The boundary between Route 1 and Route 2: amber, so the two halves of the
  // game are told apart at a glance.
  routeGate(p) {
    p.rect(0, 0, TS, TS, C.amberDark);
    p.rect(0, 3, TS, 10, C.amber);
    for (let x = 0; x < TS; x += 4) p.vline(x, 3, 10, C.amberDark);
    p.hline(0, 3, TS, C.amberLight).hline(0, 12, TS, C.amberDark);
  },
  // A door that stays shut until enough badges are earned.
  doorLocked(p) {
    p.rect(0, 0, TS, TS, C.wall);
    p.rect(4, 3, 8, 13, C.trunk).rect(5, 4, 6, 5, '#6b3f1c');
    p.rect(6, 9, 4, 4, C.metalDark);   // padlock plate
    p.set(7, 10, C.gold).set(8, 10, C.gold);
  },
  pedestal(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.rect(3, 9, 10, 6, C.metal).rect(4, 8, 8, 2, C.metalLight);
    p.rect(2, 14, 12, 2, C.metalDark);
  },
  // ---- gyms ---------------------------------------------------------------
  //
  // A gym has to be identifiable at a glance from across the map, or the whole
  // loop breaks: the player never learns that badges live in a particular kind
  // of building. So gyms get a roof colour used nowhere else, plus a badge
  // plate over the door and a banner beside it.
  gymRoofTop(p)    { roof(p, C.gymRoof, true); },
  gymRoofBottom(p) { roof(p, C.gymRoof, false); },

  gymDoor(p) {
    p.rect(0, 0, TS, TS, C.wall);
    // Badge plate above the frame — the mark the player learns to look for.
    p.rect(4, 0, 8, 4, C.gymRoof);
    p.circle(8, 2, 2, C.gold);
    p.set(8, 2, C.ink);
    p.rect(4, 4, 8, 12, C.trunk);
    p.rect(5, 5, 6, 5, C.trunkLight);
    p.set(10, 12, C.gold);
  },

  gymBanner(p) {
    p.rect(0, 0, TS, TS, C.wall);
    p.rect(3, 0, 10, 13, C.gymRoof);
    p.hline(3, 0, 10, shade(C.gymRoof, 1.2));
    p.circle(8, 5, 3, C.gold);
    p.circle(8, 5, 1, C.ink);
    // Pennant tail.
    for (let i = 0; i < 5; i++) p.hline(3 + i, 13 + (i % 2), 10 - i * 2, C.gymRoof);
  },

  // ---- Region 1: the town -------------------------------------------------
  // Coffee. The horizon of the first region, and where the second gym is.
  coffee(p) {
    p.rect(0, 0, TS, TS, C.grassDark);
    for (const [cx, cy] of [[4, 5], [11, 4], [7, 11], [13, 12]]) {
      p.circle(cx, cy, 3, C.leafMid);
      p.circle(cx - 1, cy - 1, 1, C.leafLight);
      p.set(cx + 1, cy + 1, C.danger);   // cherries
      p.set(cx - 2, cy + 1, C.danger);
    }
  },
  floor(p) {
    p.rect(0, 0, TS, TS, '#e0d8c8');
    p.hline(0, 0, TS, '#c8c0b0').vline(0, 0, TS, '#c8c0b0');
  },
  // The road out of the region, shut until the badges are in.
  routeBlock(p) {
    p.rect(0, 0, TS, TS, C.amberDark);
    p.rect(0, 3, TS, 10, C.amber);
    for (let x = 0; x < TS; x += 4) p.vline(x, 3, 10, C.amberDark);
    p.hline(0, 3, TS, C.amberLight).hline(0, 12, TS, C.amberDark);
  },
  crate(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.rect(1, 3, 14, 12, C.trunkLight);
    p.rect(2, 4, 12, 10, '#c9a06a');
    p.hline(2, 8, 12, C.trunk);
    p.vline(8, 4, 10, C.trunk);
    p.hline(1, 3, 14, C.trunk).hline(1, 14, 14, C.trunk);
  },
  desk(p) {
    p.rect(0, 0, TS, TS, '#e0d8c8');
    p.rect(1, 4, 14, 8, C.trunkLight);
    p.rect(1, 4, 14, 2, '#c9a06a');
    p.rect(3, 6, 6, 4, C.paper);      // papers
    p.rect(10, 6, 4, 4, C.night);     // a screen
    p.rect(11, 7, 2, 2, C.brand);
    p.rect(2, 12, 2, 4, C.trunk).rect(12, 12, 2, 4, C.trunk);
  },
  // The machines in the Snowflake Factory: each one built for one client.
  machine(p) {
    p.rect(0, 0, TS, TS, '#e0d8c8');
    p.rect(2, 3, 12, 11, C.metal);
    p.rect(3, 4, 10, 4, C.metalDark);
    p.set(5, 6, C.danger).set(8, 6, C.gold).set(11, 6, C.brand);
    p.rect(4, 10, 8, 2, C.metalLight);
    p.rect(1, 14, 14, 2, C.metalDark);
  },
  shelf(p) {
    p.rect(0, 0, TS, TS, C.trunk);
    p.rect(1, 1, 14, 14, '#8a5a2a');
    for (let y = 2; y < 15; y += 4) {
      p.hline(1, y + 2, 14, C.trunk);
      for (let x = 2; x < 14; x += 2) {
        p.rect(x, y, 1, 2, [C.danger, C.water, C.gold, C.brand][(x + y) % 4]);
      }
    }
  },
  // Signposts at the Backend Crossroads.
  signpost(p) {
    p.rect(0, 0, TS, TS, C.grass);
    p.rect(7, 6, 2, 9, C.trunk);
    p.rect(1, 2, 13, 4, '#e8d8a8').hline(1, 2, 13, '#b09858');
    p.hline(3, 4, 8, '#685838');
    p.rect(1, 7, 9, 3, '#e8d8a8').hline(1, 7, 9, '#b09858');
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
  'gymRoofTop', 'gymRoofBottom', 'gymDoor', 'gymBanner',
  'wall', 'window', 'door', 'doorLab', 'doorLocked',
  'routeGate', 'routeBlock', 'crate', 'desk', 'machine', 'shelf', 'signpost',
  'coffee'
]);

// Minimap categories. Sampling average sprite colour doesn't work — every tile
// starts with a background fill, so a tree painted over grass averages out to
// grass. Listing the exceptions is both simpler and correct.
const KIND = {
  grass: 'ground', grassAlt: 'ground', flowers: 'ground',
  path: 'road', plaza: 'road', gateOpen: 'road', floor: 'floor',
  water: 'water',
  tree: 'veg', bush: 'veg',
  door: 'door', doorLab: 'door', doorLocked: 'wall', gymDoor: 'door',
  coffee: 'veg'
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
