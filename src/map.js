// The overworld, built procedurally from a handful of shape helpers.
//
// Building it in code rather than typing a 30x20 character grid means a
// building is one call with a roof ridge, walls, windows and a door in the
// right places — and moving one is changing two numbers.

import { SOLID, kindOf } from './tiles.js';

export const MAP_W = 30;
export const MAP_H = 20;

function mkGrid(w, h, fillName) {
  return Array.from({ length: h }, () => Array(w).fill(fillName));
}

function fill(g, x, y, w, h, name) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (g[j] && g[j][i] !== undefined) g[j][i] = name;
    }
  }
}

const set = (g, x, y, name) => { if (g[y] && g[y][x] !== undefined) g[y][x] = name; };

// Two rows of roof, then walls with windows, and a door in the bottom row.
function building(g, { x, y, w, h, roofTop, roofBottom, door, doorX }) {
  for (let i = 0; i < w; i++) {
    set(g, x + i, y, roofTop);
    set(g, x + i, y + 1, roofBottom);
  }
  for (let j = y + 2; j < y + h; j++) {
    for (let i = 0; i < w; i++) {
      const gx = x + i;
      if (j === y + h - 1 && gx === doorX) { set(g, gx, j, door); continue; }
      const edge = i === 0 || i === w - 1;
      set(g, gx, j, (!edge && i % 3 === 2 && j < y + h - 1) ? 'window' : 'wall');
    }
  }
}

function build() {
  const g = mkGrid(MAP_W, MAP_H, 'grass');

  // Tree border — the edge of the world, not an invisible wall.
  fill(g, 0, 0, MAP_W, 1, 'tree');
  fill(g, 0, MAP_H - 1, MAP_W, 1, 'tree');
  fill(g, 0, 0, 1, MAP_H, 'tree');
  fill(g, MAP_W - 1, 0, 1, MAP_H, 'tree');

  // Lake, west side.
  fill(g, 1, 3, 3, 5, 'water');

  // Paths. One spine down the middle, one crossbar, and spurs to each site.
  fill(g, 6, 5, 1, 7, 'path');    // lab -> crossbar
  fill(g, 20, 5, 1, 7, 'path');   // gatehouse -> crossbar
  fill(g, 6, 8, 15, 1, 'path');   // upper crossbar
  fill(g, 3, 11, 21, 1, 'path');  // lower crossbar
  fill(g, 3, 12, 1, 6, 'path');   // down to the club
  fill(g, 4, 17, 5, 1, 'path');   // along to the club door

  // Postgres' lab. Brand-green roof: it should read as the important building.
  building(g, { x: 4, y: 1, w: 6, h: 4, roofTop: 'roofTop', roofBottom: 'roofBottom', door: 'doorLab', doorX: 6 });

  // The gatehouse Rowena stands in.
  building(g, { x: 17, y: 1, w: 6, h: 4, roofTop: 'roofTopAlt', roofBottom: 'roofBottomAlt', door: 'door', doorX: 20 });

  // Supavisor's club.
  building(g, { x: 5, y: 13, w: 6, h: 4, roofTop: 'roofTopDark', roofBottom: 'roofBottomDark', door: 'door', doorX: 8 });

  // The service_role key on its pedestal, off the path by the water.
  set(g, 4, 10, 'pedestal');

  // Reggie's rack, beside the upper crossbar.
  set(g, 13, 6, 'server');
  set(g, 14, 6, 'server');

  // The Multigres site: hoarding along the west and north edges of the corner,
  // sealed by the tree border on the other two sides. One gate, on the path.
  fill(g, 24, 6, 1, 13, 'fenceWork');
  fill(g, 24, 6, 5, 1, 'fenceWork');
  set(g, GATE.x, GATE.y, 'fenceWork');

  // Scenery.
  [[2, 9], [2, 12], [8, 10], [11, 13], [16, 14], [21, 15], [12, 3], [26, 3], [9, 6]]
    .forEach(([x, y]) => set(g, x, y, 'tree'));
  [[2, 10], [15, 13], [22, 9], [10, 4]].forEach(([x, y]) => set(g, x, y, 'bush'));
  [[2, 16], [5, 10], [18, 13], [22, 17], [11, 9]].forEach(([x, y]) => set(g, x, y, 'flowers'));
  [[8, 12], [17, 9], [26, 16]].forEach(([x, y]) => set(g, x, y, 'grassAlt'));

  // Plaza in front of the gatehouse.
  fill(g, 19, 5, 3, 1, 'plaza');

  set(g, END_SIGN.x, END_SIGN.y, 'sign');

  return g;
}

// The one hoarding panel that comes down once five badges are earned.
export const GATE = { x: 24, y: 11 };

// Interactable scenery that isn't a character.
export const END_SIGN = { x: 15, y: 12 };

export const PLAYER_START = { x: 6, y: 9 };

// Where everyone stands. Dialogue and quizzes arrive with content.js; this file
// only owns position and appearance.
export const NPCS = [
  { id: 'postgres',   char: 'postgres',   x: 7,  y: 5,  dir: 'down',  name: 'Professor Pöstgres' },
  { id: 'rowena',     char: 'rowena',     x: 20, y: 4,  dir: 'down',  name: 'Rowena' },
  { id: 'servicekey', char: 'servicekey', x: 4,  y: 10, dir: 'down',  name: 'service_role' },
  { id: 'realtime',   char: 'realtime',   x: 13, y: 7,  dir: 'down',  name: 'Reggie Realtime' },
  { id: 'supavisor',  char: 'supavisor',  x: 8,  y: 17, dir: 'down',  name: 'Supavisor' },
  { id: 'multigres',  char: 'multigres',  x: 26, y: 11, dir: 'left',  name: 'Multigres' },
  { id: 'hidden',     char: 'hidden',     x: 2,  y: 17, dir: 'right', name: '???' }
];

export const grid = build();

export let collision = [];

export function rebuildCollision({ gateOpen = false } = {}) {
  if (gateOpen) grid[GATE.y][GATE.x] = 'gateOpen';
  collision = grid.map((row, y) => row.map((name, x) => {
    if (gateOpen && x === GATE.x && y === GATE.y) return false;
    return SOLID.has(name);
  }));
  for (const npc of NPCS) collision[npc.y][npc.x] = true;
  return collision;
}

export function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'tree';
  return grid[y][x];
}

export function isSolid(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  return collision[y][x];
}

export function npcAt(x, y) {
  return NPCS.find(n => n.x === x && n.y === y) || null;
}

// A hand-placed map can silently wall something off. Flood-fill from the start
// and assert that every NPC can be stood next to — a broken map should fail
// loudly at load, not be discovered by a player who can't finish.
export function reachabilityReport({ gateOpen = false } = {}) {
  rebuildCollision({ gateOpen });
  const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  const queue = [[PLAYER_START.x, PLAYER_START.y]];
  seen[PLAYER_START.y][PLAYER_START.x] = true;

  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      if (seen[ny][nx] || isSolid(nx, ny)) continue;
      seen[ny][nx] = true;
      queue.push([nx, ny]);
    }
  }

  const adjacentReachable = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]]
    .some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < MAP_W && ny < MAP_H && seen[ny][nx];
    });

  const unreachable = [
    ...NPCS.filter(n => !adjacentReachable(n.x, n.y)).map(n => n.id),
    ...(adjacentReachable(END_SIGN.x, END_SIGN.y) ? [] : ['end-sign'])
  ];
  return { seen, unreachable };
}

rebuildCollision();

// Gated content is meant to be unreachable until it opens, so check the closed
// map without Multigres and the open map with it.
{
  const closed = reachabilityReport({ gateOpen: false });
  const stillClosed = closed.unreachable.filter(id => id !== 'multigres');
  if (stillClosed.length) {
    throw new Error(`Map: unreachable before the gate opens: ${stillClosed.join(', ')}`);
  }
  if (!closed.unreachable.includes('multigres')) {
    throw new Error('Map: Multigres is reachable before the gate opens — the hoarding leaks');
  }
  const open = reachabilityReport({ gateOpen: true });
  if (open.unreachable.length) {
    throw new Error(`Map: unreachable after the gate opens: ${open.unreachable.join(', ')}`);
  }
  // Reset to the closed state for the actual game.
  grid[GATE.y][GATE.x] = 'fenceWork';
  rebuildCollision({ gateOpen: false });
}

export { kindOf };
