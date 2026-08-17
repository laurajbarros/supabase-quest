// All spoken content.
//
// Every beat is at most two short lines — roughly a dozen words. The dialogue
// box occupies the bottom third of the screen and the map stays visible above
// it, so long paragraphs would both overflow and break the pacing. Splitting
// aggressively is what makes it read like a Game Boy game rather than a
// slideshow of documentation.

export const SCORE_CORRECT = 100;
export const SCORE_WRONG = 50;

export const NPC_CONTENT = {
  postgres: {
    name: 'Prof. Pöstgres',
    badge: 'Postgres',
    beats: [
      'Ah, a new developer!',
      'Everyone starts here, whether they know it or not.',
      "I'm Postgres. Thirty-five years old.",
      'Somehow more popular than ever.',
      "I'm not a proprietary database pretending to be open.",
      "I'm the real thing. Standard SQL.",
      'You could pack up and leave any time.',
      'Nobody does. But you could.',
      "That's the point."
    ],
    quiz: {
      question: 'Why does portability matter if nobody leaves?',
      options: [
        { text: 'Because trust is what makes you stay', correct: true },
        { text: 'Because migrations are fun' },
        { text: "It doesn't, it's marketing" }
      ],
      // Shown after the answer, right or wrong. The teaching happens here.
      after: 'Exactly. The exit being open is why the door stays shut.'
    }
  },

  rowena: {
    name: 'Rowena',
    badge: 'RLS',
    beats: [
      'Halt.',
      'Who are you, and what are you allowed to see?',
      'Most apps put a bouncer at the door.',
      'An API server checking permissions.',
      'Here the rules live inside the database.',
      'Row Level Security.',
      'Every query. Every time.',
      "I don't check IDs at the entrance.",
      'I check them at every single row.'
    ],
    quiz: {
      question: 'Where does authorization live in a Supabase app?',
      options: [
        { text: 'In the database, as RLS policies', correct: true },
        { text: 'In the frontend' },
        { text: 'In a middleware server you have to build' }
      ],
      after: 'In the database. The rule travels with the data.'
    }
  },

  servicekey: {
    name: 'service_role',
    badge: 'Secrets',
    beats: [
      '⚠️ YOU FOUND: SERVICE_ROLE_KEY',
      'This key ignores Rowena entirely.',
      'Every table. Every row. No questions.',
      'It belongs on your server.',
      'NOT in your browser.',
      'Not in your public repo.',
      "Not in that AI-generated frontend you didn't read.",
      'Many learned this the hard way.',
      'Do not join them.'
    ],
    quiz: {
      question: 'Where should the service_role key live?',
      options: [
        { text: 'Server-side only', correct: true },
        { text: 'In your frontend env file' },
        { text: "In the README so you don't forget it" }
      ],
      after: 'Server-side only. It bypasses every policy you wrote.'
    }
  },

  realtime: {
    name: 'Reggie Realtime',
    badge: 'Realtime',
    beats: [
      'HEY.',
      'Your database can just — tell you when things change!',
      'No polling! No refresh button!',
      'Chat messages. Order status.',
      'Live notifications. Someone joining a room.',
      "Beautiful. This is what I'm for.",
      "What I'm NOT for:",
      'Your analytics firehose.',
      'Ten thousand events a second through my WAL',
      'and I will fall over dramatically.',
      "Send those elsewhere and we'll stay friends."
    ],
    quiz: {
      question: 'Which is a good fit for Realtime?',
      options: [
        { text: 'Live chat and order updates', correct: true },
        { text: 'High-volume analytics ingestion' },
        { text: 'Nightly batch reports' }
      ],
      after: 'Right. Low-volume, user-facing, needs to feel instant.'
    }
  },

  supavisor: {
    name: 'Supavisor',
    badge: 'Pooling',
    beats: [
      "Sorry, we're at capacity.",
      'Postgres gives every connection its own process.',
      'Fine when a few hundred stay all night.',
      'Not fine when ten thousand serverless functions',
      'each show up, order one drink, and leave.',
      "That's where I come in.",
      'I hold a few real connections and share them.',
      'Everyone gets served.',
      'Transaction mode. Prepared statements off.',
      "You're on the list."
    ],
    quiz: {
      question: 'Why do serverless functions need a pooler?',
      options: [
        { text: 'They open a new connection per cold start and exhaust the limit', correct: true },
        { text: "They're slower than normal servers" },
        { text: "Postgres doesn't support serverless" }
      ],
      after: 'Yes. Many short-lived clients, one small pool of real connections.'
    }
  },

  multigres: {
    name: 'Multigres',
    badge: 'Multigres',
    beats: [
      'You made it to the edge of the map.',
      'Outgrow one big Postgres machine,',
      'and your options get ugly.',
      'Shard it yourself. Or leave.',
      'Neither is fun.',
      "That's what I'm being built for.",
      'Horizontal scaling for Postgres.',
      'From the people who built Vitess for YouTube.',
      'Open source. Self-hostable. Still early.',
      "Come back later. I'll be bigger."
    ],
    quiz: {
      question: 'What problem is Multigres solving?',
      options: [
        { text: 'Horizontal scaling beyond a single Postgres instance', correct: true },
        { text: 'Making queries prettier' },
        { text: 'Replacing Postgres entirely' }
      ],
      after: 'Scaling out, without leaving Postgres behind.'
    }
  },

  // No badge, no points, no quiz. It exists to be found.
  hidden: {
    name: '???',
    secret: true,
    beats: [
      'Between us? Nothing here is magic.',
      'RLS policies on unindexed columns will crawl.',
      'Compute tops out at 16XL.',
      'Realtime has limits.',
      'Knowing where the walls are is the job.',
      "That's what I'd tell a customer, anyway."
    ]
  }
};

// The order badges appear in the HUD, and the order the nudges suggest.
export const NPC_ORDER = ['postgres', 'rowena', 'servicekey', 'realtime', 'supavisor', 'multigres'];

// One line pointing at whoever is still unvisited, shown after each badge.
export const NUDGES = {
  postgres:   'The lab is north-west. Someone old works there.',
  rowena:     'Someone is blocking a doorway to the north-east.',
  servicekey: 'Something is glowing on a pedestal by the water.',
  realtime:   'A rack of servers hums beside the upper path. Someone is shouting near it.',
  supavisor:  'There is a queue outside the dark building to the south.',
  multigres:  'The site at the eastern edge is open now. Go and see.'
};

export const END_SIGN_BEATS = [
  'Six stops. One database. Zero lock-in.',
  'Postgres for data. Auth for users.',
  'Realtime for live. Storage for files.',
  'Edge Functions for the rest.',
  'All open source. All yours to take with you.',
  'Now go build something in a weekend.',
  '— Laura'
];

// Shown when Multigres is still fenced off.
export const GATE_LOCKED_BEATS = [
  'UNDER CONSTRUCTION.',
  'The hoarding is locked. Five badges opens it.'
];
