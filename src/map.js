// The world, built procedurally from a handful of shape helpers.
//
// Two zones in one grid, stacked vertically:
//
//   rows  0..20   ROUTE 1 — The Field. Laura's own career.
//   row      21   the route gate, opened by five field badges
//   rows 22..41   ROUTE 2 — The Work I Want. Customers with problems.
//   rows 42..47   the closing room, opened by four platform badges
//
// One grid rather than separate maps with warps: the camera, collision and
// renderer already handle an arbitrary grid, so stacking costs nothing and
// keeps the two routes feeling like one continuous walk.

import { SOLID, kindOf } from './tiles.js';

export const MAP_W = 30;
export const MAP_H = 48;

// Row offsets for each zone.
const R2 = 22;   // Route 2 occupies rows 22..41 — the original 20-row map
const OFFICE = 42;

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

// ---------------------------------------------------------------- gates

// The panel of route gate that opens once five field badges are earned.
export const ROUTE_GATE = { x: 15, y: 21 };
// The Multigres hoarding, opened by five platform badges.
export const GATE = { x: 24, y: R2 + 11 };
// The closing room door, opened by four platform badges.
export const OFFICE_DOOR = { x: 15, y: OFFICE };

export const SPAWN_SIGN = { x: 16, y: 3 };
export const END_SIGN = { x: 15, y: R2 + 12 };

export const PLAYER_START = { x: 15, y: 3 };

function build() {
  const g = mkGrid(MAP_W, MAP_H, 'grass');

  // Tree border — the edge of the world, not an invisible wall.
  fill(g, 0, 0, MAP_W, 1, 'tree');
  fill(g, 0, MAP_H - 1, MAP_W, 1, 'tree');
  fill(g, 0, 0, 1, MAP_H, 'tree');
  fill(g, MAP_W - 1, 0, 1, MAP_H, 'tree');

  buildRoute1(g);
  buildRouteGate(g);
  buildRoute2(g);
  buildOffice(g);

  return g;
}

// ---------------------------------------------------------------- Route 1

function buildRoute1(g) {
  // Spine: one path down the middle, spurs west and east to each workplace.
  fill(g, 15, 2, 1, 19, 'path');
  fill(g, 6, 8, 10, 1, 'path');    // west to the Snowflake Factory
  fill(g, 15, 8, 8, 1, 'path');    // east to the Locked Journals
  fill(g, 15, 12, 9, 1, 'path');   // east to the Search That Lies
  fill(g, 6, 15, 10, 1, 'path');   // west to the Import Mines

  // 1.1 The Snowflake Factory — a workshop of one-off machines.
  building(g, { x: 3, y: 3, w: 7, h: 4, roofTop: 'roofTopDark', roofBottom: 'roofBottomDark', door: 'door', doorX: 6 });
  [[3, 9], [4, 10], [8, 10], [9, 9]].forEach(([x, y]) => set(g, x, y, 'machine'));
  [[2, 7], [10, 7]].forEach(([x, y]) => set(g, x, y, 'crate'));

  // 1.2 The Locked Journals — a library where each room sells its own ads.
  building(g, { x: 20, y: 3, w: 7, h: 4, roofTop: 'roofTopAlt', roofBottom: 'roofBottomAlt', door: 'door', doorX: 23 });
  [[20, 9], [21, 9], [25, 9], [26, 9]].forEach(([x, y]) => set(g, x, y, 'shelf'));

  // 1.3 The Search That Lies — a confident librarian, further along.
  [[24, 11], [25, 11], [26, 11]].forEach(([x, y]) => set(g, x, y, 'shelf'));
  set(g, 26, 13, 'shelf');

  // 1.4 The Import Mines — carts of tangled data.
  [[3, 14], [4, 16], [8, 16], [9, 14], [2, 17], [5, 17]].forEach(([x, y]) => set(g, x, y, 'crate'));

  // 1.5 The Backend Crossroads — three signposted roads, at the gate.
  set(g, 13, 18, 'signpost');
  set(g, 17, 18, 'signpost');
  set(g, 17, 20, 'signpost');

  // Scenery, and the sign that opens the game.
  set(g, SPAWN_SIGN.x, SPAWN_SIGN.y, 'sign');
  [[11, 5], [12, 11], [19, 15], [22, 17], [7, 12], [27, 6], [2, 12]]
    .forEach(([x, y]) => set(g, x, y, 'tree'));
  [[10, 13], [20, 19], [4, 5]].forEach(([x, y]) => set(g, x, y, 'bush'));
  [[12, 16], [24, 18], [3, 19]].forEach(([x, y]) => set(g, x, y, 'flowers'));
}

// The wall between the two routes. One panel opens; the rest never does.
function buildRouteGate(g) {
  fill(g, 1, 21, MAP_W - 2, 1, 'routeGate');
  set(g, ROUTE_GATE.x, ROUTE_GATE.y, 'routeGate');
}

// ---------------------------------------------------------------- Route 2

// The original overworld, offset down the grid. Layout unchanged — it works.
function buildRoute2(g) {
  const y = n => R2 + n;

  // Its own borders, top and bottom. The bottom one matters: the Ceiling's
  // hoarding used to be sealed by the edge of the world, and with the closing
  // room added below, the corner would otherwise leak out underneath it.
  fill(g, 1, y(0), MAP_W - 2, 1, 'tree');
  fill(g, 1, y(19), MAP_W - 2, 1, 'tree');
  set(g, 15, y(0), 'path');
  fill(g, 15, y(0), 1, 9, 'path');   // down to the upper crossbar

  fill(g, 6, y(5), 1, 7, 'path');
  fill(g, 20, y(5), 1, 7, 'path');
  fill(g, 6, y(8), 15, 1, 'path');
  fill(g, 3, y(11), 21, 1, 'path');
  fill(g, 3, y(12), 1, 6, 'path');
  fill(g, 4, y(17), 5, 1, 'path');

  building(g, { x: 4, y: y(1), w: 6, h: 4, roofTop: 'roofTop', roofBottom: 'roofBottom', door: 'doorLab', doorX: 6 });
  building(g, { x: 17, y: y(1), w: 6, h: 4, roofTop: 'roofTopAlt', roofBottom: 'roofBottomAlt', door: 'door', doorX: 20 });
  building(g, { x: 5, y: y(13), w: 6, h: 4, roofTop: 'roofTopDark', roofBottom: 'roofBottomDark', door: 'door', doorX: 8 });

  set(g, 4, y(10), 'pedestal');
  set(g, 13, y(6), 'server');
  set(g, 14, y(6), 'server');

  // The Ceiling: hoarding along the west and north edges of the corner.
  fill(g, 24, y(6), 1, 13, 'fenceWork');
  fill(g, 24, y(6), 5, 1, 'fenceWork');
  set(g, GATE.x, GATE.y, 'fenceWork');

  [[2, 9], [2, 12], [8, 10], [11, 13], [16, 14], [21, 15], [12, 3], [26, 3], [9, 6]]
    .forEach(([x, n]) => set(g, x, y(n), 'tree'));
  [[2, 10], [15, 13], [22, 9], [10, 4]].forEach(([x, n]) => set(g, x, y(n), 'bush'));
  [[2, 16], [5, 10], [18, 13], [22, 17], [11, 9]].forEach(([x, n]) => set(g, x, y(n), 'flowers'));
  [[8, 12], [17, 9], [26, 16]].forEach(([x, n]) => set(g, x, y(n), 'grassAlt'));

  fill(g, 19, y(5), 3, 1, 'plaza');
  set(g, END_SIGN.x, END_SIGN.y, 'sign');

  fill(g, 1, y(3), 3, 5, 'water');

  // The way down to the closing room, through Route 2's bottom border.
  fill(g, 15, y(18), 1, 2, 'path');
}

// ---------------------------------------------------------------- closing

// A walled courtyard, one desk, one person. Nothing else — the room is meant to
// leave a reader curious, not to answer everything.
function buildOffice(g) {
  // Rows 42..46 — row 47 is the tree border at the edge of the world.
  fill(g, 1, OFFICE, MAP_W - 2, 5, 'wall');
  fill(g, 2, OFFICE + 1, MAP_W - 4, 3, 'floor');
  set(g, OFFICE_DOOR.x, OFFICE_DOOR.y, 'doorLocked');
  set(g, 14, OFFICE + 2, 'desk');
}

// ---------------------------------------------------------------- NPCs

// Route 1 — the field. Five encounters, plus a hidden one.
// Route 2 — the platform. Six customers.
export const NPCS = [
  // Route 1
  { id: 'snowflake',  route: 1, char: 'foreman',   x: 6,  y: 9,  dir: 'down',  name: 'Foreman' },
  { id: 'journals',   route: 1, char: 'adops',     x: 23, y: 8,  dir: 'down',  name: 'Ad Ops' },
  { id: 'search',     route: 1, char: 'librarian', x: 24, y: 12, dir: 'down',  name: 'Librarian' },
  { id: 'imports',    route: 1, char: 'miner',     x: 6,  y: 16, dir: 'up',    name: 'Migrations' },
  { id: 'crossroads', route: 1, char: 'crossroads', x: 16, y: 19, dir: 'left', name: 'The Crossroads' },
  { id: 'hiddenField', route: 1, char: 'hidden',   x: 2,  y: 19, dir: 'right', name: '???', secret: true },

  // Route 2
  { id: 'migration',  route: 2, char: 'architect', x: 7,  y: R2 + 5,  dir: 'down', name: 'Enterprise Architect' },
  { id: 'leak',       route: 2, char: 'founder',   x: 20, y: R2 + 4,  dir: 'down', name: 'Founder' },
  { id: 'invoice',    route: 2, char: 'cfo',       x: 4,  y: R2 + 10, dir: 'down', name: 'CFO' },
  { id: 'firehose',   route: 2, char: 'pm',        x: 13, y: R2 + 7,  dir: 'down', name: 'PM' },
  { id: 'dashboard',  route: 2, char: 'engineer',  x: 8,  y: R2 + 17, dir: 'down', name: 'Engineer' },
  { id: 'ceiling',    route: 2, char: 'cto',       x: 26, y: R2 + 11, dir: 'left', name: 'CTO' },

  // The closing room
  { id: 'closing',    route: 3, char: 'laura',     x: 15, y: OFFICE + 2, dir: 'up', name: 'Laura' }
];

export const FIELD_IDS = NPCS.filter(n => n.route === 1 && !n.secret).map(n => n.id);
export const PLATFORM_IDS = NPCS.filter(n => n.route === 2).map(n => n.id);

export const grid = build();

export let collision = [];

export function rebuildCollision({ routeOpen = false, gateOpen = false, officeOpen = false } = {}) {
  if (routeOpen) grid[ROUTE_GATE.y][ROUTE_GATE.x] = 'gateOpen';
  if (gateOpen) grid[GATE.y][GATE.x] = 'gateOpen';
  if (officeOpen) grid[OFFICE_DOOR.y][OFFICE_DOOR.x] = 'door';

  collision = grid.map((row, y) => row.map((name, x) => {
    if (routeOpen && x === ROUTE_GATE.x && y === ROUTE_GATE.y) return false;
    if (gateOpen && x === GATE.x && y === GATE.y) return false;
    if (officeOpen && x === OFFICE_DOOR.x && y === OFFICE_DOOR.y) return false;
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
  if (adjacent(END_SIGN.x, END_SIGN.y)) reachable.add('end-sign');
  if (adjacent(SPAWN_SIGN.x, SPAWN_SIGN.y)) reachable.add('spawn-sign');
  return reachable;
}

rebuildCollision();

// Gated content is meant to be unreachable until it opens, so each stage is
// checked: what must be reachable now, and what must not be yet.
{
  const must = (set, ids, stage) => {
    const missing = ids.filter(id => !set.has(id));
    if (missing.length) throw new Error(`Map (${stage}): unreachable — ${missing.join(', ')}`);
  };
  const mustNot = (set, ids, stage) => {
    const leaked = ids.filter(id => set.has(id));
    if (leaked.length) throw new Error(`Map (${stage}): reachable too early — ${leaked.join(', ')}`);
  };

  const closed = reachabilityReport({});
  must(closed, [...FIELD_IDS, 'hiddenField', 'spawn-sign'], 'route 1');
  mustNot(closed, [...PLATFORM_IDS, 'closing', 'end-sign'], 'route 1');

  const route = reachabilityReport({ routeOpen: true });
  must(route, PLATFORM_IDS.filter(id => id !== 'ceiling'), 'route 2');
  must(route, ['end-sign'], 'route 2');
  mustNot(route, ['ceiling', 'closing'], 'route 2');

  const open = reachabilityReport({ routeOpen: true, gateOpen: true, officeOpen: true });
  must(open, NPCS.map(n => n.id).concat(['end-sign', 'spawn-sign']), 'fully open');

  // Reset to the closed state for the actual game.
  grid[ROUTE_GATE.y][ROUTE_GATE.x] = 'routeGate';
  grid[GATE.y][GATE.x] = 'fenceWork';
  grid[OFFICE_DOOR.y][OFFICE_DOOR.x] = 'doorLocked';
  rebuildCollision({});
}

export { kindOf };
