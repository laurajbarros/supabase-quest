// The world, built procedurally from a handful of shape helpers.
//
//   rows  0..20   REGION 1 — The Beginning. A small town, coffee, three gyms.
//   row      21   the road out, opened by three badges
//   rows 22..44   REGION 2 — RebelMouse. An office floor, four gyms.
//   row      44   the League door, opened by all seven badges
//   rows 45..64   REGION 3 — The Supabase League. A linear hall, four trials.
//
// One grid rather than separate maps with warps: the camera, collision and
// renderer already handle an arbitrary grid, so stacking costs nothing.

import { SOLID, kindOf } from './tiles.js';

export const MAP_W = 30;
export const MAP_H = 66;

const GATE_ROW = 21;
const OFFICE = 22;         // Region 2 occupies rows 22..44
const LEAGUE_ROW = 44;     // the office's back wall, with the League door in it
const HALL = 45;           // Region 3 occupies rows 45..64

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
export const LEAGUE_DOOR = { x: 15, y: LEAGUE_ROW };
export const HALL_END = { x: 15, y: 63 };

export const PLAYER_START = { x: 15, y: 19 };

function build() {
  const g = mkGrid(MAP_W, MAP_H, 'grass');

  fill(g, 0, 0, MAP_W, 1, 'tree');
  fill(g, 0, MAP_H - 1, MAP_W, 1, 'tree');
  fill(g, 0, 0, 1, MAP_H, 'tree');
  fill(g, MAP_W - 1, 0, 1, MAP_H, 'tree');

  buildTown(g);
  buildGate(g);
  buildOffice(g);
  buildHall(g);
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

// ---------------------------------------------------------------- Region 2
//
// An open-plan floor. The four gyms are meeting rooms — same pink roof and
// badge plate as the town gyms, because the point of that silhouette is that
// it means the same thing everywhere.
function buildOffice(g) {
  fill(g, 1, OFFICE, MAP_W - 2, LEAGUE_ROW - OFFICE + 1, 'wall');
  fill(g, 2, OFFICE + 1, MAP_W - 4, LEAGUE_ROW - OFFICE - 1, 'floor');

  // The way in from the town, and a carpeted spine down the floor.
  set(g, 15, OFFICE, 'floor');
  fill(g, 14, OFFICE + 1, 3, LEAGUE_ROW - OFFICE - 1, 'carpet');
  fill(g, 3, OFFICE + 9, MAP_W - 6, 2, 'carpet');

  // Meeting rooms, two near the entrance and two at the back.
  gym(g, { x: 2,  y: OFFICE + 2,  w: 6, h: 4, doorX: 4 });
  gym(g, { x: 22, y: OFFICE + 2,  w: 6, h: 4, doorX: 24 });
  gym(g, { x: 2,  y: OFFICE + 13, w: 6, h: 4, doorX: 4 });
  gym(g, { x: 22, y: OFFICE + 13, w: 6, h: 4, doorX: 24 });

  // Desks, so the floor reads as somewhere people work.
  [[9, 25], [10, 25], [19, 25], [20, 25],
   [9, 29], [10, 29], [19, 29], [20, 29],
   [9, 38], [10, 38], [19, 38], [20, 38]]
    .forEach(([x, y]) => set(g, x, y, 'workstation'));
  [[6, 27], [24, 27], [6, 40], [24, 40]].forEach(([x, y]) => set(g, x, y, 'plant'));
  set(g, 20, 34, 'coffeeMachine');

  // The League door sits in the back wall. Shut until all seven badges.
  set(g, LEAGUE_DOOR.x, LEAGUE_DOOR.y, 'doorLocked');
}

// ---------------------------------------------------------------- Region 3
//
// A hall, not a map. Your document is explicit that the League has no
// exploration, so the four trials sit in sequence down one corridor. The
// flavour NPCs are spaced between them so there is still walking to do
// between twenty-odd lines of dialogue.
function buildHall(g) {
  fill(g, 1, HALL, MAP_W - 2, MAP_H - 1 - HALL, 'wall');
  fill(g, 12, HALL, 7, MAP_H - 2 - HALL, 'floor');
  fill(g, 14, HALL, 3, MAP_H - 2 - HALL, 'plaza');

  // Trial alcoves, alternating sides, marked in Supabase green rather than gym
  // pink: these are trials, and they hand out no badges.
  for (const [x, y] of [[10, 48], [17, 52], [10, 56], [17, 60]]) {
    fill(g, x, y - 1, 3, 1, 'roofTop');
    fill(g, x, y, 3, 1, 'roofBottom');
  }
  [[11, 62], [18, 62], [11, 46], [18, 46]].forEach(([x, y]) => set(g, x, y, 'plant'));
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
  { id: 'rival1', char: 'rival',  x: 17, y: 20, dir: 'left',  name: 'Rival' },

  // ---- Region 2: RebelMouse
  { id: 'listening', char: 'featureRequest', x: 4,  y: OFFICE + 5,  dir: 'down', name: 'The Feature Request' },
  { id: 'order',     char: 'inbox',          x: 24, y: OFFICE + 5,  dir: 'down', name: 'The Inbox' },
  { id: 'architect', char: 'dejaVu',         x: 4,  y: OFFICE + 16, dir: 'down', name: 'D\u00e9j\u00e0 Vu' },
  { id: 'ai',        char: 'industry',       x: 24, y: OFFICE + 16, dir: 'down', name: 'The Industry' },

  { id: 'hoodie',        char: 'hoodie',        x: 8,  y: 26, dir: 'right', name: 'Engineer in a Hoodie' },
  { id: 'salesRep',      char: 'salesRep',      x: 21, y: 26, dir: 'left',  name: 'Sales Rep' },
  { id: 'coffeeMachine', char: 'coffeeDrinker', x: 20, y: 35, dir: 'up',    name: 'At the Coffee Machine' },
  { id: 'onACall',       char: 'onACall',       x: 9,  y: 39, dir: 'right', name: 'Person on a Call' },

  { id: 'rival2', char: 'rival', x: 17, y: 24, dir: 'left', name: 'Rival' },

  // ---- Region 3: the Supabase League
  { id: 'rival3',    char: 'rival',      x: 17, y: 46, dir: 'left',  name: 'Rival' },
  { id: 'colleague', char: 'colleague',  x: 13, y: 47, dir: 'right', name: 'Colleague' },
  { id: 'learn',     char: 'leagueOne',  x: 13, y: 49, dir: 'right', name: 'Learn the Platform' },
  { id: 'huddle',    char: 'huddle',     x: 17, y: 50, dir: 'left',  name: 'Someone in a Huddle' },
  { id: 'discovery', char: 'leagueTwo',  x: 17, y: 53, dir: 'left',  name: 'The Discovery Call' },
  { id: 'growth',    char: 'growth',     x: 13, y: 54, dir: 'right', name: 'Growth Teammate' },
  { id: 'pov',       char: 'leagueThree', x: 13, y: 57, dir: 'right', name: 'The Proof of Value' },
  { id: 'whiteboard', char: 'whiteboard', x: 17, y: 58, dir: 'left', name: 'By the Whiteboard' },
  { id: 'advisor',   char: 'leagueFour', x: 17, y: 61, dir: 'left',  name: 'Trusted Advisor' },
  { id: 'hallOfFame', char: 'mentor',    x: 15, y: 63, dir: 'up',    name: 'The Mentor' }
];

export const GYM_IDS = ['determination', 'entrepreneur', 'bridge',
                        'listening', 'order', 'architect', 'ai'];

export const grid = build();

export let collision = [];

export function rebuildCollision({ region2Open = false, leagueOpen = false } = {}) {
  if (region2Open) grid[ROUTE_GATE.y][ROUTE_GATE.x] = 'gateOpen';
  if (leagueOpen) grid[LEAGUE_DOOR.y][LEAGUE_DOOR.x] = 'door';

  collision = grid.map((row, y) => row.map((name, x) => {
    if (region2Open && x === ROUTE_GATE.x && y === ROUTE_GATE.y) return false;
    if (leagueOpen && x === LEAGUE_DOOR.x && y === LEAGUE_DOOR.y) return false;
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
  for (const [name, s] of [['town-sign', TOWN_SIGN], ['bus-stop', BUS_STOP], ['hall-end', HALL_END]]) {
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

  const region1Ids = NPCS.filter(n => n.y < GATE_ROW).map(n => n.id);
  const region2Ids = NPCS.filter(n => n.y > GATE_ROW && n.y < LEAGUE_ROW).map(n => n.id);
  const region3Ids = NPCS.filter(n => n.y > LEAGUE_ROW).map(n => n.id);

  const closed = reachabilityReport({});
  must(closed, region1Ids.concat(['town-sign', 'bus-stop']), 'region 1');
  const leaked = region2Ids.filter(id => closed.has(id));
  if (leaked.length) throw new Error(`Map: RebelMouse reachable before three badges — ${leaked.join(', ')}`);

  const region2 = reachabilityReport({ region2Open: true });
  must(region2, region2Ids, 'region 2');
  const early = region3Ids.filter(id => region2.has(id));
  if (early.length) throw new Error(`Map: the League is open before seven badges — ${early.join(', ')}`);

  const all = reachabilityReport({ region2Open: true, leagueOpen: true });
  must(all, region3Ids.concat(['hall-end']), 'league open');

  // Reset to the closed state for the actual game.
  grid[ROUTE_GATE.y][ROUTE_GATE.x] = 'routeBlock';
  grid[LEAGUE_DOOR.y][LEAGUE_DOOR.x] = 'doorLocked';
  rebuildCollision({});
}

export { kindOf };
