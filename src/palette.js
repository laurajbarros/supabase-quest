// The world's colour vocabulary.
//
// This is Game Boy *Color* / Pokémon Yellow, not the 1989 four-shade hardware:
// real greens, sand paths, painted roofs. The four-shade look is still one tap
// away — painter.js can remap every colour by luminance at bake time.

export const C = {
  // ground
  grass:      '#58a848',
  grassDark:  '#3d8038',
  grassEdge:  '#2f6828',
  sand:       '#d8c888',
  sandDark:   '#c0ac70',
  stone:      '#c8c0b0',
  stoneDark:  '#a89880',
  water:      '#3878c8',
  waterLight: '#60a0e0',

  // vegetation
  leaf:       '#206820',
  leafMid:    '#2f8828',
  leafLight:  '#48a038',
  trunk:      '#7a4a20',
  trunkLight: '#a87840',

  // structures
  wall:       '#e8dcc0',
  wallShade:  '#c0b090',
  glass:      '#58a8d8',
  glassLight: '#a8d8f0',
  metal:      '#98989b',
  metalDark:  '#68686c',
  metalLight: '#d0d0d4',

  // Supabase identity — used for roofs, signage and anything that should read
  // as "this is the product".
  brand:      '#3ecf8e',
  brandDark:  '#249b6b',
  brandLight: '#7ee2b8',

  // ink / accents
  ink:        '#182818',
  inkSoft:    '#2a3a2a',
  paper:      '#f8f8e8',
  gold:       '#f8d030',
  goldDark:   '#b88c08',
  danger:     '#d84838',
  dangerDark: '#a02818',
  night:      '#28282e',
  nightLight: '#38383f'
};

// Skin/hair/cloth tones for the character generator.
export const SKIN = {
  light:  '#f0c8a0',
  mid:    '#d8a878',
  deep:   '#9a6440',
  darker: '#6b422a'
};

export const HAIR = {
  black: '#201818',
  brown: '#6b4423',
  grey:  '#b8b0a8',
  white: '#e8e8e0'
};

// The four Game Boy shades, dark to light.
export const GB = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];

// Monochrome mode, authored rather than computed.
//
// Deriving this from luminance doesn't work: grass and sand differ by hue, not
// brightness, so an automatic mapping collapses the paths into the fields and
// the map turns into one flat green rectangle. Four shades is a tight budget,
// so it's spent deliberately — ground mid-dark, walkable surfaces lightest,
// vegetation and water darkest, buildings light with dark outlines.
// Colours produced at runtime by shade() aren't listed and fall back to
// luminance, which is fine for highlights and edges.
export const MONO = {
  [C.grass]: GB[1], [C.grassDark]: GB[0], [C.grassEdge]: GB[0],
  [C.sand]: GB[3], [C.sandDark]: GB[2],
  [C.stone]: GB[3], [C.stoneDark]: GB[2],
  // Darkest, not mid: grass is GB[1], and a lake the same shade as the field it
  // sits in stops being a lake.
  [C.water]: GB[0], [C.waterLight]: GB[2],

  [C.leaf]: GB[0], [C.leafMid]: GB[0], [C.leafLight]: GB[1],
  [C.trunk]: GB[0], [C.trunkLight]: GB[1],

  [C.wall]: GB[3], [C.wallShade]: GB[1],
  [C.glass]: GB[1], [C.glassLight]: GB[2],
  [C.metal]: GB[2], [C.metalDark]: GB[0], [C.metalLight]: GB[3],

  [C.brand]: GB[2], [C.brandDark]: GB[0], [C.brandLight]: GB[3],

  [C.ink]: GB[0], [C.inkSoft]: GB[0], [C.paper]: GB[3],
  [C.gold]: GB[3], [C.goldDark]: GB[1],
  [C.danger]: GB[1], [C.dangerDark]: GB[0],
  [C.night]: GB[0], [C.nightLight]: GB[1],

  [SKIN.light]: GB[3], [SKIN.mid]: GB[2], [SKIN.deep]: GB[1], [SKIN.darker]: GB[0],
  [HAIR.black]: GB[0], [HAIR.brown]: GB[0], [HAIR.grey]: GB[2], [HAIR.white]: GB[3]
};
