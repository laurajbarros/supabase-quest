// The world, built procedurally from a handful of shape helpers.
//
// Pass 1 covers Region 1 only:
//
//   rows  0..20   REGION 1 — The Beginning. A small town, coffee, three gyms.
//   row      21   the road out, opened by three badges
//   rows 22..25   a holding area until Region 2 is built
//
// Regions 2 and 3 extend this grid downward in later passes. One grid rather
// than separate maps with warps: the camera, collision and renderer already
// handle an arbitrary grid, so stacking costs nothing.

import { SOLID, kindOf } from './tiles.js';

export const MAP_W = 30;
export const MAP_H = 26;

const GATE_ROW = 21;

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
function building(g, { x, y, w, h, roofTop, roofBottom, door, doorX, banner }) {
  for (let i = 0; i < w; i++) {
    set(g, x + i, y, roofTop);
    set(g, x + i, y + 1, roofBottom);
  }
  for (let j = y + 2; j < y + h; j++) {
    for (let i = 0; i < w; i++) {
      const gx = x + i;
      if (j === y + h - 1 && gx === doorX) { set(g, gx, j, door); continue; }
      if (j === y + h - 1 && banner && gx === doorX + 1) { set(g, gx, j, 'gymBanner'); continue; }
      const edge = i === 0 || i === w - 1;
      set(g, gx, j, (!edge && i % 3 === 2 && j < y + h - 1) ? 'window' : 'wall');
    }
  }
}

// A gym is a building with a roof colour used nowhere else, a badge plate over
// the door and a banner beside it. If a player can't tell a gym from a house at
// a glance, the whole badge loop breaks.
function gym(g, opts) {
  building(g, {
    ...opts,
    roofTop: 'gymRoofTop',
    roofBottom: 'gymRoofBottom',
    door: 'gymDoor',
    banner: true
  });
}

// ---------------------------------------------------------------- landmarks

export const ROUTE_GATE = { x: 15, y: GATE_ROW };
export const TOWN_SIGN = { x: 16, y: 18 };
export const BUS_STOP = { x: 13, y: 7 };
export const NEXT_SIGN = { x: 16, y: 23 };

export const PLAYER_START = { x: 15, y: 19 };

function build() {
  const g = mkGrid(MAP_W, MAP_H, 'grass');

  fill(g, 0, 0, MAP_W, 1, 'tree');
  fill(g, 0, MAP_H - 1, MAP_W, 1, 'tree');
  fill(g, 0, 0, 1, MAP_H, 'tree');
  fill(g, MAP_W - 1, 0, 1, MAP_H, 'tree');

  buildTown(g);
  buildGate(g);
  buildHolding(g);
  return g;
}

function buildTown(g) {
  // Coffee on the horizon, north-west. It's the second gym's reason to exist.
  fill(g, 1, 1, 9, 6, 'coffee');

  // Roads. One spine down the middle, one crossbar linking the two side gyms.
  fill(g, 15, 6, 1, 15, 'path');
  fill(g, 4, 12, 21, 1, 'path');
  fill(g, 4, 12, 1, 1, 'path');

  // GYM 1 — The Admissions Gym. North, at the top of the spine.
  gym(g, { x: 12, y: 2, w: 7, h: 4, doorX: 15 });

  // GYM 2 — The Coffee Farm Gym. West, against the fields.
  gym(g, { x: 2, y: 8, w: 6, h: 4, doorX: 4 });

  // GYM 3 — The Career Switch Gym. East.
  gym(g, { x: 21, y: 8, w: 6, h: 4, doorX: 24 });

  // Ordinary houses, so the gym roofs have something to be unlike.
  building(g, { x: 20, y: 2, w: 5, h: 4, roofTop: 'roofTopAlt', roofBottom: 'roofBottomAlt', door: 'door', doorX: 22 });
  building(g, { x: 7, y: 15, w: 5, h: 4, roofTop: 'roofTopDark', roofBottom: 'roofBottomDark', door: 'door', doorX: 9 });
  building(g, { x: 19, y: 15, w: 5, h: 4, roofTop: 'roofTopAlt', roofBottom: 'roofBottomAlt', door: 'door', doorX: 21 });

  set(g, BUS_STOP.x, BUS_STOP.y, 'sign');
  set(g, TOWN_SIGN.x, TOWN_SIGN.y, 'sign');

  // Scenery.
  [[11, 9], [12, 14], [26, 14], [2, 14], [27, 6], [10, 11], [18, 9]]
    .forEach(([x, y]) => set(g, x, y, 'tree'));
  [[13, 10], [20, 13], [5, 18]].forEach(([x, y]) => set(g, x, y, 'bush'));
  [[17, 13], [9, 13], [25, 17], [3, 16]].forEach(([x, y]) => set(g, x, y, 'flowers'));
  [[14, 16], [22, 11]].forEach(([x, y]) => set(g, x, y, 'grassAlt'));
  fill(g, 13, 19, 5, 1, 'plaza');
}

// The road out. One panel opens; the rest never does.
function buildGate(g) {
  fill(g, 1, GATE_ROW, MAP_W - 2, 1, 'routeBlock');
  set(g, ROUTE_GATE.x, ROUTE_GATE.y, 'routeBlock');
}

// Everything past the gate until Region 2 exists.
function buildHolding(g) {
  fill(g, 15, GATE_ROW + 1, 1, 3, 'path');
  set(g, NEXT_SIGN.x, NEXT_SIGN.y, 'sign');
}

// ---------------------------------------------------------------- NPCs
//
// Gym leaders stand in their doorway — there are no interiors, and a leader in
// the door is unmistakably "the person you came here for".

export const NPCS = [
  // Gyms
  { id: 'determination', char: 'curve',         x: 15, y: 5,  dir: 'down', name: 'The Curve' },
  { id: 'entrepreneur',  char: 'redNumber',     x: 4,  y: 11, dir: 'down', name: 'The Red Number' },
  { id: 'bridge',        char: 'learningCurve', x: 24, y: 11, dir: 'down', name: 'The Learning Curve' },

  // Flavour
  { id: 'kid',        char: 'kid',        x: 14, y: 7,  dir: 'right', name: 'Kid' },
  { id: 'farmWorker', char: 'farmWorker', x: 7,  y: 7,  dir: 'down',  name: 'Farm Worker' },
  { id: 'oldMan',     char: 'oldMan',     x: 6,  y: 13, dir: 'up',    name: 'Old Man' },
  { id: 'girlLaptop', char: 'girlLaptop', x: 22, y: 13, dir: 'up',    name: 'Girl with a Laptop' },

  // The Mentor, beside where you wake up. The Rival, at the town entrance.
  { id: 'mentor', char: 'mentor', x: 14, y: 19, dir: 'right', name: 'The Mentor' },
  { id: 'rival1', char: 'rival',  x: 17, y: 20, dir: 'left',  name: 'Rival' }
];

export const GYM_IDS = ['determination', 'entrepreneur', 'bridge'];

export const grid = build();

export let collision = [];

export function rebuildCollision({ region2Open = false } = {}) {
  if (region2Open) grid[ROUTE_GATE.y][ROUTE_GATE.x] = 'gateOpen';

  collision = grid.map((row, y) => row.map((name, x) => {
    if (region2Open && x === ROUTE_GATE.x && y === ROUTE_GATE.y) return false;
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
// and assert that everything can be stood next to at the right moment — a
// broken map should fail loudly at load, not be found by a player who can't
// finish.
export function reachabilityReport(gates = {}) {
  rebuildCollision(gates);
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

  const adjacent = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx >= 0 && ny >= 0 && nx < MAP_W && ny < MAP_H && seen[ny][nx];
  });

  const reachable = new Set();
  for (const n of NPCS) if (adjacent(n.x, n.y)) reachable.add(n.id);
  for (const [name, s] of [['town-sign', TOWN_SIGN], ['bus-stop', BUS_STOP], ['next-sign', NEXT_SIGN]]) {
    if (adjacent(s.x, s.y)) reachable.add(name);
  }
  return reachable;
}

rebuildCollision();

{
  const must = (set, ids, stage) => {
    const missing = ids.filter(id => !set.has(id));
    if (missing.length) throw new Error(`Map (${stage}): unreachable — ${missing.join(', ')}`);
  };

  const closed = reachabilityReport({});
  must(closed, NPCS.map(n => n.id).concat(['town-sign', 'bus-stop']), 'region 1');
  if (closed.has('next-sign')) {
    throw new Error('Map: the road out is open before three badges');
  }

  const open = reachabilityReport({ region2Open: true });
  must(open, ['next-sign'], 'gate open');

  // Reset to the closed state for the actual game.
  grid[ROUTE_GATE.y][ROUTE_GATE.x] = 'routeBlock';
  rebuildCollision({});
}

export { kindOf };
