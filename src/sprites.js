// Character art. One parameterised generator produces the whole cast in four
// directions and three walk frames — adding an NPC costs a few colours, not a
// new sprite sheet.

import { Painter, TS, shade } from './painter.js';
import { C, SKIN, HAIR } from './palette.js';

export const DIRS = ['down', 'up', 'left', 'right'];

// Leg positions per frame: [leftLeg, rightLeg] as [xStart, xEnd].
const LEG_FRAMES = [
  [[4, 6], [9, 11]],   // standing
  [[3, 5], [10, 12]],  // stride open
  [[5, 7], [8, 10]]    // stride crossed
];

const EYE = '#202028';

function drawHuman(p, o, dir, legs) {
  const skin = o.skin || SKIN.mid;
  const hair = o.hair || HAIR.brown;
  const shirt = o.shirt || C.brand;
  const pants = o.pants || '#3a4a5a';
  const shoes = o.shoes || '#282828';

  if (dir === 'down' || dir === 'up') {
    p.rect(4, 1, 8, 1, hair).rect(3, 2, 10, 2, hair);
    if (dir === 'down') {
      p.set(3, 4, hair).set(12, 4, hair).set(3, 5, hair).set(12, 5, hair);
      p.rect(4, 4, 8, 3, skin);
      p.set(5, 5, EYE).set(6, 5, EYE).set(9, 5, EYE).set(10, 5, EYE);
      if (o.glasses) {
        // A bridge across both eyes; enough to read as spectacles at 16px.
        p.set(4, 5, o.glasses).set(7, 5, o.glasses).set(8, 5, o.glasses).set(11, 5, o.glasses);
      }
      if (o.beard) p.rect(5, 6, 6, 1, o.beard);
    } else {
      p.rect(3, 4, 10, 3, hair);
    }
    p.rect(6, 7, 4, 1, skin);            // neck
    p.rect(3, 8, 10, 3, shirt);          // torso
    p.rect(2, 8, 1, 2, shirt).rect(13, 8, 1, 2, shirt); // arms
    p.set(2, 10, skin).set(13, 10, skin);               // hands
    if (o.coat) {
      // Open coat: shoulders and two front panels, torso colour showing between.
      p.hline(3, 8, 10, o.coat);
      p.rect(3, 9, 2, 2, o.coat).rect(11, 9, 2, 2, o.coat);
    }
    if (o.badge && dir === 'down') p.set(5, 9, o.badge);
  } else {
    // Profile. Face forward-left, hair covering the back of the head.
    p.rect(5, 1, 7, 1, hair).rect(4, 2, 9, 2, hair);
    p.rect(8, 4, 5, 3, hair);
    p.rect(4, 4, 4, 3, skin);
    p.set(5, 5, EYE);
    if (o.glasses) p.set(4, 5, o.glasses).set(6, 5, o.glasses);
    p.rect(6, 7, 4, 1, skin);
    p.rect(4, 8, 9, 3, shirt);
    p.rect(3, 8, 1, 2, shirt).rect(13, 8, 1, 2, shirt);
    p.set(3, 10, skin).set(13, 10, skin);
    if (o.coat) p.rect(9, 8, 4, 3, o.coat);
  }

  if (o.hat) {
    // Sits over whatever hair was drawn, with a brim on the facing side.
    p.rect(3, 1, 10, 2, o.hat);
    p.rect(2, 3, 12, 1, shade(o.hat, 0.8));
    if (dir === 'down') p.rect(3, 4, 10, 1, shade(o.hat, 0.7));
  }

  const [a, b] = legs;
  for (const [x0, x1] of [a, b]) {
    p.rect(x0, 11, x1 - x0 + 1, 3, pants);
    p.rect(x0, 14, x1 - x0 + 1, 1, shoes);
  }
}

function makeHuman(o) {
  const frames = { down: [], up: [], left: [], right: [] };
  for (const dir of ['down', 'up', 'left']) {
    for (const legs of LEG_FRAMES) {
      const p = new Painter(TS, TS);
      drawHuman(p, o, dir, legs);
      frames[dir].push(p);
    }
  }
  frames.right = frames.left.map(p => p.mirrored());
  return frames;
}

// A floating key on a pedestal — the service_role key isn't a person, and it
// shouldn't walk or look friendly.
function makeKey() {
  const build = bob => {
    const p = new Painter(TS, TS);
    const y = 4 + bob;
    p.circle(6, y + 3, 3, C.gold);
    p.circle(6, y + 3, 1, C.night);
    p.rect(8, y + 2, 6, 2, C.gold);
    p.rect(12, y + 4, 2, 2, C.gold);
    p.rect(10, y + 4, 1, 2, C.gold);
    // A warning glint, so it reads as hazardous rather than collectible.
    p.set(13, y, C.danger).set(4, y + 6, C.danger);
    return p;
  };
  const frames = [build(0), build(-1), build(1)];
  return { down: frames, up: frames, left: frames, right: frames };
}

// Multigres: a half-built machine behind the hoarding.
function makeRig() {
  const build = blink => {
    const p = new Painter(TS, TS);
    p.rect(3, 3, 10, 9, C.metal);
    p.rect(4, 4, 8, 3, C.night);
    p.set(6, 5, blink ? C.brand : C.metalDark);
    p.set(9, 5, blink ? C.brand : C.metalDark);
    p.rect(4, 8, 8, 3, C.metalLight);
    for (let y = 8; y < 11; y++) p.set(11, y, y === 9 ? C.gold : C.metalDark);
    p.rect(2, 12, 12, 2, C.metalDark);
    p.rect(3, 14, 3, 2, C.night).rect(10, 14, 3, 2, C.night);
    p.rect(6, 0, 4, 3, C.gold);          // hard hat
    p.hline(5, 3, 6, C.goldDark);
    return p;
  };
  const frames = [build(true), build(false), build(true)];
  return { down: frames, up: frames, left: frames, right: frames };
}

// The cast. Colours do the characterisation: the professor is grey and
// bespectacled in a lab coat, the bouncer is broad and dark, Reggie is loud.
const CAST = {
  player:     () => makeHuman({ skin: SKIN.mid, hair: HAIR.brown, shirt: C.brand, pants: '#39405c', shoes: '#242424' }),
  postgres:   () => makeHuman({ skin: SKIN.light, hair: HAIR.grey, shirt: '#4a6fa5', pants: '#3c3c44', shoes: '#282828', coat: C.paper, glasses: C.ink, beard: HAIR.grey }),
  rowena:     () => makeHuman({ skin: SKIN.deep, hair: HAIR.black, shirt: '#2b3a4a', pants: '#20242c', shoes: '#181818', badge: C.gold }),
  servicekey: () => makeKey(),
  realtime:   () => makeHuman({ skin: SKIN.light, hair: '#c8501e', shirt: C.gold, pants: '#4a3a2a', shoes: '#8a3a1a' }),
  supavisor:  () => makeHuman({ skin: SKIN.darker, hair: HAIR.black, shirt: '#1e1e26', pants: '#1a1a20', shoes: '#101010', coat: '#2a2a34', glasses: '#101010' }),
  multigres:  () => makeRig(),
  hidden:     () => makeHuman({ skin: SKIN.mid, hair: HAIR.black, shirt: '#4a3a5a', pants: '#2e2438', shoes: '#1c1c1c', hat: '#3a2e48' })
};

let baked = null;

export function bakeCharacters() {
  baked = {};
  for (const [name, make] of Object.entries(CAST)) {
    const frames = make();
    baked[name] = {};
    for (const dir of DIRS) baked[name][dir] = frames[dir].map(p => p.bake());
  }
  return baked;
}

export function chr(name, dir = 'down', frame = 0) {
  if (!baked) throw new Error('bakeCharacters() must run before rendering');
  const c = baked[name];
  if (!c) throw new Error(`Unknown character '${name}'`);
  return c[dir][frame % 3];
}

export const CAST_NAMES = Object.keys(CAST);
