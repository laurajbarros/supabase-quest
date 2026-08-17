// All spoken content.
//
// Every beat is at most two short lines — roughly a dozen words. The dialogue
// box occupies the bottom of the screen and the map stays visible above it, so
// long paragraphs would both overflow and break the pacing.
//
// Two routes:
//   Route 1, the field    — Laura's own career. Judgment calls, not facts.
//   Route 2, the platform — customers with problems. Factual answers.

export const SCORE_CORRECT = 100;
export const SCORE_WRONG_FIELD = 50;      // Route 1: judgment, softer landing
export const SCORE_WRONG_PLATFORM = 25;   // Route 2: there is a right answer

// 5 field encounters + 6 platform encounters, 100 each.
export const MAX_SCORE = 1100;

// ---------------------------------------------------------------- titles

export const TITLES = {
  start:      'Full-stack Engineer',
  snowflake:  'Solution Architect',
  imports:    'Director of Solution Architecture',
  crossroads: 'General Manager',
  // The "(pending)" is the joke and the point. Leave it.
  route2:     'Customer Solution Architect (pending)'
};

// Which encounters trigger a promotion. The two that don't are deliberate:
// not every good call comes with a title.
export const PROMOTIONS = {
  snowflake: TITLES.snowflake,
  imports: TITLES.imports,
  crossroads: TITLES.crossroads
};

// ---------------------------------------------------------------- Route 1

export const NPC_CONTENT = {
  snowflake: {
    name: 'Foreman',
    badge: 'Snowflakes',
    route: 1,
    beats: [
      'Every client gets a custom build here.',
      'None of them reusable.',
      'None of them quite right, either.',
      'The engineers build exactly what\'s asked.',
      'Nobody asks what\'s actually wrong.'
    ],
    quiz: {
      question: 'What\'s the real problem?',
      options: [
        { text: 'Nobody technical is in the customer conversation', correct: true },
        { text: 'The engineers aren\'t skilled enough' },
        { text: 'Clients don\'t know what they want' }
      ]
    },
    reveal: [
      'That\'s what I thought too.',
      'So I went to my boss and asked to fix it.',
      'He said prove it.',
      'I did.',
      'Understand the pain, not the request.',
      'Then build it modular enough for the next client.'
    ]
  },

  journals: {
    name: 'Ad Ops',
    badge: 'Journals',
    route: 1,
    beats: [
      'This ad was sold for the immunology journal.',
      'It can only run in the immunology journal.',
      'Even though forty other articles mention vaccines.',
      'Rules are rules.'
    ],
    quiz: {
      question: 'What\'s the opportunity?',
      options: [
        { text: 'Map the content taxonomy across all journals with AI', correct: true },
        { text: 'Sell more ads in immunology' },
        { text: 'Merge the journals' }
      ]
    },
    reveal: [
      'Our ad ops team flagged it first.',
      'They thought it was small.',
      'We mapped taxonomy across the whole portfolio',
      'and crossed it with Google Ads.',
      'The client reported around 22% revenue growth',
      'in the first category alone.'
    ]
  },

  search: {
    name: 'Librarian',
    badge: 'Search',
    route: 1,
    beats: [
      'You asked about Greece.',
      'Here\'s Cyprus. Here\'s Turkey.',
      'They\'re... similar?',
      'The AI is very confident about this.'
    ],
    quiz: {
      question: 'What went wrong?',
      options: [
        { text: 'Semantic similarity is a recommendation signal, not a retrieval signal', correct: true },
        { text: 'The model needs more training' },
        { text: 'Search is just hard' }
      ]
    },
    reveal: [
      'Real client. Political news outlet.',
      'Someone on my team built it and it half-worked.',
      'We split it —',
      'Elasticsearch for the literal query,',
      'AI on top for related suggestions.',
      'The interface was never the issue.'
    ]
  },

  imports: {
    name: 'Migrations',
    badge: 'Imports',
    route: 1,
    beats: [
      'Every migration is different.',
      'CSV. JSON. Some CMS nobody\'s heard of.',
      'Fifty hours if we\'re lucky.',
      'Three hundred if we\'re not.',
      'And we start from zero every time.'
    ],
    quiz: {
      question: 'Where do you start?',
      options: [
        { text: 'Normalize every source into one format first', correct: true },
        { text: 'Hire more people' },
        { text: 'Tell clients to clean their own data' }
      ]
    },
    reveal: [
      'We didn\'t rebuild it. We chipped at it.',
      'Scripts for the common transformations first.',
      'Then a normalization layer with error detection.',
      'Then more, over about a year.',
      'Fifty to three hundred hours',
      'became twenty to a hundred.'
    ]
  },

  crossroads: {
    name: 'The Crossroads',
    badge: 'Crossroads',
    route: 1,
    beats: [
      'Three roads.',
      'Build your own on raw Postgres.',
      'Self-host.',
      'Or hosted.',
      'Your product generates an app per user.',
      'Choose.'
    ],
    quiz: {
      question: 'Which road?',
      options: [
        { text: 'Hosted — self-hosting means building a control plane', correct: true },
        { text: 'Raw Postgres, maximum control' },
        { text: 'Self-host, cheapest' }
      ]
    },
    reveal: [
      'That was my call to make.',
      'Self-hosted Supabase is a single project.',
      'No orgs. No management API.',
      'We\'d have become an infrastructure company',
      'instead of a product one.'
    ]
  },

  hiddenField: {
    name: '???',
    route: 1,
    secret: true,
    beats: [
      'Want the unflattering one?',
      'At the AI product I ran,',
      'we tested ideas by building them.',
      'Expensive way to learn.',
      'Now I\'d get technical people in front of customers first',
      'and test with the smallest thing that works.',
      'Not the product.'
    ]
  },

  // ---------------------------------------------------------------- Route 2
  //
  // Three beats each: the ask, the real problem, beyond the ask. The third is
  // load-bearing — it's the only part that says anything about how she works.

  leak: {
    name: 'Founder',
    badge: 'RLS',
    route: 2,
    beats: [
      'We launched last week.',
      'Users can see each other\'s data.',
      'Our frontend checks permissions, I swear.',
      'Someone opened devtools.',
      'Can you fix the API?'
    ],
    quiz: {
      question: 'What do you tell them?',
      options: [
        { text: 'The API isn\'t the problem — authorization has to live in the database', correct: true },
        { text: 'Add rate limiting to the API' },
        { text: 'Move the permission checks to a middleware layer' }
      ]
    },
    reveal: [
      'The frontend can\'t be trusted. It\'s the frontend.',
      'RLS. Policies in the database.',
      'Every query, every time.',
      'Also — check where your service_role key is.',
      'That one bypasses everything.'
    ],
    beyond: [
      'They asked me to fix a launch.',
      'I wrote them a pre-launch checklist instead.',
      'Then asked if it could go in the docs.',
      'This conversation shouldn\'t need a person in it.'
    ]
  },

  migration: {
    name: 'Enterprise Architect',
    badge: 'Scoping',
    route: 2,
    beats: [
      'We\'re moving off Firebase.',
      'Two million users.',
      'Auth, storage, all of it.',
      'We want it live in six weeks.',
      'Can you commit to that?'
    ],
    quiz: {
      question: 'How do you scope it?',
      options: [
        { text: 'Migrate one workload first, with 2-3 measurable success criteria', correct: true },
        { text: 'Commit to the six weeks and add engineers' },
        { text: 'Tell them six weeks is impossible' }
      ]
    },
    reveal: [
      'A proof-of-value isn\'t a small version of everything.',
      'It\'s one workload, done properly.',
      'Pick the one that hurts most.',
      'Define success in numbers.',
      'Then we both know if it worked.'
    ],
    beyond: [
      'They wanted a timeline.',
      'I gave them a rollback plan too.',
      'Nobody asks for that.',
      'It\'s what makes them say yes.'
    ]
  },

  dashboard: {
    name: 'Engineer',
    badge: 'Performance',
    route: 2,
    beats: [
      'Everything was fine at ten thousand rows.',
      'We\'re at two million now.',
      'The dashboard takes eleven seconds.',
      'We\'re ready to buy bigger compute.',
      'How much do we need?'
    ],
    quiz: {
      question: 'What do you do first?',
      options: [
        { text: 'Run EXPLAIN ANALYZE before anyone buys anything', correct: true },
        { text: 'Recommend the next compute tier up' },
        { text: 'Add caching in front of the queries' }
      ]
    },
    reveal: [
      'Sequential scan on two million rows.',
      'Your RLS policy filters an unindexed column.',
      'The policy runs on every row it touches.',
      'Index it.',
      'Eleven seconds became forty milliseconds.'
    ],
    beyond: [
      'They asked what to buy.',
      'I told them not to buy anything.',
      'That\'s the answer that makes them trust the next one.'
    ]
  },

  invoice: {
    name: 'CFO',
    badge: 'Cost',
    route: 2,
    beats: [
      'This month cost four times last month.',
      'Traffic only doubled.',
      'What are we paying for?',
      'Should we be worried about scaling?'
    ],
    quiz: {
      question: 'Where do you look?',
      options: [
        { text: 'Egress — they\'re serving media straight from Storage with no CDN', correct: true },
        { text: 'Their compute tier is too high' },
        { text: 'Too many database connections' }
      ]
    },
    reveal: [
      'Storage is fine. Serving video from it isn\'t.',
      'Every view is egress.',
      'Put a CDN in front.',
      'Then let\'s talk about what next year looks like.'
    ],
    beyond: [
      'They asked about one invoice.',
      'I built them a usage model for twelve months.',
      'Then shared it with the Growth team.',
      'A customer who can predict their bill renews.'
    ]
  },

  firehose: {
    name: 'PM',
    badge: 'Realtime',
    route: 2,
    beats: [
      'Realtime keeps falling over.',
      'It\'s fine in staging.',
      'In production it dies.',
      'Half the team says it\'s a bug.',
      'The other half says we\'re using it wrong.'
    ],
    quiz: {
      question: 'Who\'s right?',
      options: [
        { text: 'Both — it works as designed, but analytics ingestion is the wrong workload', correct: true },
        { text: 'It\'s a bug, escalate to support' },
        { text: 'They need a higher tier' }
      ]
    },
    reveal: [
      'Realtime is WAL-based.',
      'Ten thousand events a second will drown it.',
      'It\'s for chat, orders, notifications.',
      'Moderate volume. User-facing.',
      'Route the firehose somewhere built for it.'
    ],
    beyond: [
      'They wanted their argument settled.',
      'While I was in there I found three workloads',
      'they were running elsewhere for no reason.',
      'Two came over that quarter.'
    ]
  },

  ceiling: {
    name: 'CTO',
    badge: 'The Ceiling',
    route: 2,
    beats: [
      'We\'re on 16XL.',
      'Sixty-four cores. It\'s the biggest one.',
      'We double every six months.',
      'So what happens next year?',
      'And don\'t sell me something.'
    ],
    quiz: {
      question: 'What do you say?',
      options: [
        { text: 'Tell them the truth about the wall, and what\'s being built for it', correct: true },
        { text: 'Reassure them the platform scales indefinitely' },
        { text: 'Suggest they shard the application themselves' }
      ]
    },
    reveal: [
      'That\'s the top tier. No managed sharding yet.',
      'Multigres is being built for exactly this.',
      'Open source. Self-hostable. Still early.',
      'Here\'s what I can promise and what I can\'t.'
    ],
    beyond: [
      'They asked for a roadmap.',
      'I took their timeline back to Product',
      'and made sure their name was on it.',
      'Being the customer\'s champion inside the company',
      'is most of the job.'
    ]
  },

  // ---------------------------------------------------------------- closing
  closing: {
    name: 'Laura',
    route: 3,
    beats: [
      'Six years finding the same problem.',
      'Someone technical has to be in the room',
      'when the customer says what\'s wrong.',
      'I kept inventing that job.',
      'You already have it.',
      'And you probably noticed —',
      'every one of those, I did more than was asked.',
      'That\'s not a pitch. It\'s just how I work.',
      '— Laura'
    ]
  }
};

// Order badges appear in the HUD, and the order nudges suggest.
export const FIELD_ORDER = ['snowflake', 'journals', 'search', 'imports', 'crossroads'];
export const PLATFORM_ORDER = ['leak', 'migration', 'dashboard', 'invoice', 'firehose', 'ceiling'];

export const NUDGES = {
  snowflake:  'A workshop to the west. The foreman looks tired.',
  journals:   'A library to the east, selling ads room by room.',
  search:     'Further east, a librarian handing out the wrong books.',
  imports:    'South-west: carts of tangled data, and nobody happy.',
  crossroads: 'Three signposted roads, at the bottom of the field.',

  leak:       'A founder outside a shop. The lights are on at 3am.',
  migration:  'An enterprise architect with a very large binder.',
  dashboard:  'An engineer south of here, watching a loading spinner.',
  invoice:    'A CFO by the water, holding a bill.',
  firehose:   'Two engineers arguing, a PM stuck between them.',
  ceiling:    'The site at the eastern edge is open. A CTO is waiting.'
};

// The opening. Plays once, on a fresh run, with Laura standing still on the
// map — the world is visible behind her, so it reads as her talking to you
// rather than as a splash screen.
//
// Cut from ~28 beats to 11. Everything the original established survives: who
// she is, the joke that admits what this is, that it's about her rather than
// about Supabase, what the player actually does, and where it's going. What
// went was repetition — three beats saying "you'll meet people who know the
// story" when one does it. On a phone, every beat is a tap, and the opening
// is where a stranger decides whether to keep going.
export const INTRO_BEATS = [
  "Hi. I'm Laura.",
  'And yes, I built a game to apply for a job.',
  { pause: 700 },
  "This isn't really a game about Supabase.",
  "It's a game about how I got here.",
  { pause: 500 },
  "You'll walk a few chapters of my career.",
  'Some of them happened. Some are about to.',
  'Talk to people. Make the call they had to make.',
  'There are no Pokéballs.',
  'There are, however, badges.',
  'Let me see if I can make it to Supabase.'
];

export const SPAWN_SIGN_BEATS = [
  'This is where I worked.',
  'Six years of it.',
  'Every room here was a real problem.',
  'See if you\'d have called it the same way.'
];

// Shown on approaching the route gate once the field is done.
export const BRIDGE_BEATS = [
  'That was the last call I made there.',
  'And it\'s the one that got me here.',
  'Because once we picked it, I used it.',
  'And I kept thinking —',
  'this is the problem I\'ve been solving for six years.',
  'Just with better tools.'
];

export const END_SIGN_BEATS = [
  'Six stops. One database. Zero lock-in.',
  'Postgres for data. Auth for users.',
  'Realtime for live. Storage for files.',
  'Edge Functions for the rest.',
  'All open source. All yours to take with you.',
  'Now go build something in a weekend.',
  '— Laura'
];

export const ROUTE_LOCKED_BEATS = [
  '→ ROUTE 2: THE WORK I WANT',
  'The gate opens on five field badges.'
];

export const GATE_LOCKED_BEATS = [
  'UNDER CONSTRUCTION.',
  'The hoarding is locked. Five platform badges opens it.'
];

export const OFFICE_LOCKED_BEATS = [
  'The door is shut.',
  'Four platform badges opens it.'
];
