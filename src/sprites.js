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

  // Hair past the ears. Confined to rows 5-7, the band between the head and the
  // shoulders: the arms start at row 8, and hair drawn over them turns the
  // hands into smudges at this size.
  if (o.longHair) {
    if (dir === 'up' || dir === 'down') {
      p.rect(2, 5, 2, 3, hair);
      p.rect(12, 5, 2, 3, hair);
      if (dir === 'up') p.rect(4, 7, 8, 1, hair);   // falls down the back
    } else {
      p.rect(11, 5, 3, 3, hair);
    }
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

// The cast. Colours do the characterisation — one parameterised function, one
// entry per person.
const CAST = {
  // The player is Laura.
  player: () => makeHuman({
    skin: SKIN.mid, hair: '#3b2416', longHair: true,
    shirt: C.brand, pants: '#39405c', shoes: '#242424'
  }),

  // The Mentor. White hair, lab coat — the professor archetype, on purpose.
  mentor: () => makeHuman({
    skin: SKIN.light, hair: HAIR.white, shirt: '#4a6fa5', pants: '#3c3c44',
    shoes: '#282828', coat: C.paper, glasses: C.ink, beard: HAIR.white
  }),

  // The Rival. Same silhouette in every region so he's recognised instantly.
  rival: () => makeHuman({
    skin: SKIN.light, hair: '#c8501e', shirt: '#7a2f4a', pants: '#2c2c38',
    shoes: '#1a1a20', glasses: '#101010'
  }),

  // ---- Region 1 gym leaders ----------------------------------------------
  curve: () => makeHuman({
    skin: SKIN.deep, hair: HAIR.black, longHair: true,
    shirt: '#4a4a7a', pants: '#2e2e46', shoes: '#1c1c24', glasses: C.ink
  }),
  redNumber: () => makeHuman({
    skin: SKIN.mid, hair: HAIR.grey, shirt: '#8a4a2a', pants: '#4a3a2a',
    shoes: '#2a1e14', hat: '#c9a06a'
  }),
  learningCurve: () => makeHuman({
    skin: SKIN.light, hair: '#6b4423', shirt: '#2f7a5a', pants: '#33384a',
    shoes: '#242424'
  }),

  // ---- Region 1 flavour ---------------------------------------------------
  kid: () => makeHuman({
    skin: SKIN.mid, hair: HAIR.brown, shirt: '#d8b038', pants: '#3a5a8a', shoes: '#c04030'
  }),
  farmWorker: () => makeHuman({
    skin: SKIN.darker, hair: HAIR.black, shirt: '#6a8a4a', pants: '#4a4238',
    shoes: '#2e2820', hat: '#c9a06a'
  }),
  oldMan: () => makeHuman({
    skin: SKIN.light, hair: HAIR.white, shirt: '#8a8a7a', pants: '#4a4a44',
    shoes: '#2a2a24', beard: HAIR.white
  }),
  girlLaptop: () => makeHuman({
    skin: SKIN.deep, hair: HAIR.black, longHair: true,
    shirt: '#7a4a8a', pants: '#2e2438', shoes: '#1c1c1c', glasses: C.ink
  }),

  // ---- Region 2 gym leaders ----------------------------------------------
  featureRequest: () => makeHuman({
    skin: SKIN.light, hair: HAIR.brown, shirt: '#3a5a8a', pants: '#2e3a4a',
    shoes: '#1e2028', glasses: C.ink
  }),
  inbox: () => makeHuman({
    skin: SKIN.deep, hair: HAIR.black, longHair: true,
    shirt: '#8a3a4a', pants: '#3a2430', shoes: '#1c1418'
  }),
  dejaVu: () => makeHuman({
    skin: SKIN.mid, hair: HAIR.grey, shirt: '#4a7a6a', pants: '#2e4038',
    shoes: '#1a2420', glasses: C.ink
  }),
  industry: () => makeHuman({
    skin: SKIN.darker, hair: HAIR.black, shirt: '#2e2e3a', pants: '#22222c',
    shoes: '#121216', coat: '#3a3a4a'
  }),

  // ---- Region 2 flavour ---------------------------------------------------
  hoodie: () => makeHuman({
    skin: SKIN.light, hair: HAIR.brown, shirt: '#5a5a6a', pants: '#2c2c38',
    shoes: '#1a1a20', hat: '#5a5a6a'
  }),
  salesRep: () => makeHuman({
    skin: SKIN.mid, hair: '#6b4423', shirt: '#d8b038', pants: '#33384a', shoes: '#242424'
  }),
  coffeeDrinker: () => makeHuman({
    skin: SKIN.deep, hair: HAIR.black, shirt: '#6a8a9a', pants: '#3a4450', shoes: '#20242a'
  }),
  onACall: () => makeHuman({
    skin: SKIN.light, hair: HAIR.grey, longHair: true,
    shirt: '#7a6a9a', pants: '#33384a', shoes: '#242424'
  }),

  // ---- Region 3: the League. Brand green, so the trials read as a different
  // kind of challenge from the pink gyms.
  leagueOne: () => makeHuman({
    skin: SKIN.mid, hair: HAIR.black, shirt: C.brandDark, pants: '#24303a', shoes: '#161c22'
  }),
  leagueTwo: () => makeHuman({
    skin: SKIN.deep, hair: HAIR.black, longHair: true,
    shirt: C.brandDark, pants: '#24303a', shoes: '#161c22', glasses: C.ink
  }),
  leagueThree: () => makeHuman({
    skin: SKIN.light, hair: '#6b4423', shirt: C.brandDark, pants: '#24303a', shoes: '#161c22'
  }),
  leagueFour: () => makeHuman({
    skin: SKIN.darker, hair: HAIR.grey, shirt: C.brandDark, pants: '#24303a',
    shoes: '#161c22', coat: '#2f4a40'
  }),

  colleague: () => makeHuman({
    skin: SKIN.light, hair: HAIR.brown, shirt: '#4a6a8a', pants: '#2e3a4a', shoes: '#1e2028'
  }),
  huddle: () => makeHuman({
    skin: SKIN.deep, hair: HAIR.black, shirt: '#8a6a4a', pants: '#3a3028', shoes: '#201a14'
  }),
  growth: () => makeHuman({
    skin: SKIN.mid, hair: '#c8501e', longHair: true,
    shirt: '#d8b038', pants: '#33384a', shoes: '#242424'
  }),
  whiteboard: () => makeHuman({
    skin: SKIN.light, hair: HAIR.grey, shirt: '#6a6a7a', pants: '#33384a',
    shoes: '#242424', glasses: C.ink
  })
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
