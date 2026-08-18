// All spoken content.
//
// Every beat is at most two short lines — roughly a dozen words. The dialogue
// box sits at the bottom and the map stays visible above it, so long
// paragraphs would both overflow and break the pacing.
//
// Three regions:
//   1  The Beginning     a small town. 3 gyms.
//   2  RebelMouse        an office floor. 4 gyms.
//   3  The Supabase League   4 trials, no badges. Future tense.

// ---------------------------------------------------------------- scoring

// A wrong answer never blocks — it costs points and returns to the question.
export const SCORE_FIRST_TRY = 100;
export const SCORE_AFTER_RETRY = 50;

// 7 gyms + 4 League trials, 100 each.
export const MAX_SCORE = 1100;

export const BADGE_ORDER = [
  'determination', 'entrepreneur', 'bridge',      // Region 1
  'listening', 'order', 'architect', 'ai'         // Region 2
];

export const TRIAL_ORDER = ['learn', 'discovery', 'pov', 'advisor'];

// ---------------------------------------------------------------- opening

export const MENTOR_BEATS = [
  'Hello there! Welcome to the world of CAREER!',
  'This world is inhabited by challenges.',
  'Some you choose. Most choose you.',
  'Your name is LAURA.',
  { pause: 600 },
  'Scattered across these lands are GYMS.',
  'Each one holds a challenge — and a BADGE.',
  'Find them. Answer well.',
  'Collect all 7 BADGES and the League will open to you.',
  { pause: 400 },
  'Look for buildings with a badge over the door.',
  "That's where the challenges live.",
  'Tap the menu button anytime to see which badges you\'re missing.',
  'Your very own story is about to unfold. Let\'s go!'
];

// ---------------------------------------------------------------- gyms
//
// Each wrong option carries its own retort, so a wrong answer is answered
// specifically rather than with one shared line. The player is returned to the
// question immediately afterwards.

export const NPC_CONTENT = {
  // ============================================ REGION 1 — THE BEGINNING

  determination: {
    gym: true,
    region: 1,
    name: 'The Curve',
    badge: 'DETERMINATION',
    hint: 'The school, north of the bus stop.',
    beats: [
      'You want to study at the best university in Latin America.',
      "Problem: your high school didn't exactly prepare you for that."
    ],
    quiz: {
      question: 'What do you do?',
      options: [
        { text: 'Study. Then study more. Then study again.', correct: true },
        {
          text: 'Settle for an easier school and call it "being realistic"',
          retort: 'You settle. Somewhere, a version of you is disappointed. Try again.'
        },
        {
          text: 'Wait for the cutoff score to drop on its own',
          retort: 'The cutoff score did not move. It never does. Try again.'
        }
      ],
      win: 'You got in. DETERMINATION BADGE obtained!'
    },
    postWin: 'Still the hardest exam you ever took.'
  },

  entrepreneur: {
    gym: true,
    region: 1,
    name: 'The Red Number',
    badge: 'ENTREPRENEUR',
    hint: 'The co-op, out by the coffee fields.',
    beats: [
      "Your family's coffee farm is losing money.",
      'They need help. Actual help, not opinions.'
    ],
    quiz: {
      question: 'What do you do?',
      options: [
        {
          text: 'Optimize costs, get sustainability certified, and build an export company',
          correct: true
        },
        {
          text: 'Cut costs and wait for coffee prices to recover',
          retort: 'Leaner books, same ceiling. You cut your way to break-even and stopped. Try again.'
        },
        {
          text: 'Sell the farm and open a coffee shop in Brooklyn',
          retort: 'Great espresso. Farm still in the red. Try again.'
        }
      ],
      win: '9 containers to 6 countries in 2 years. Woman of Agribusiness of Brazil, 2018. ENTREPRENEUR BADGE obtained!'
    },
    postWin: 'Nine containers. Not bad.'
  },

  bridge: {
    gym: true,
    region: 1,
    name: 'The Learning Curve',
    badge: 'BRIDGE',
    hint: 'The house with the laptop in the window.',
    beats: [
      "You've always loved technology — you built a business with it.",
      'But you were the one using the tools.',
      'Now you want to be the one making them.',
      'No bootcamp. No AI. Just you and the documentation.'
    ],
    quiz: {
      question: 'What do you do?',
      options: [
        {
          text: 'Learn how to learn — then learn tech well enough to get hired',
          correct: true
        },
        {
          text: 'Buy 14 online courses and finish zero',
          retort: 'Your cart is full. Your skills are not. Try again.'
        },
        {
          text: 'Put "aspiring developer" in your bio and wait',
          retort: 'Nobody is coming. Try again.'
        }
      ],
      win: 'Four months from zero to your first full-time job — on a team at a German company. BRIDGE BADGE obtained!'
    },
    postWin: "Four months. People still don't believe it."
  },

  // ============================================ FLAVOUR — REGION 1
  //
  // One line, no question, no badge. They exist so the world isn't empty, and
  // so finding a gym feels like finding something.

  kid: {
    region: 1,
    name: 'Kid',
    beats: [
      "My cousin says you can't get into a top school from here.",
      'My cousin also failed geometry twice.'
    ]
  },

  farmWorker: {
    region: 1,
    name: 'Farm Worker',
    beats: [
      "The buyer's coming Thursday.",
      'Do we have a story about the sustainability certification yet?'
    ]
  },

  oldMan: {
    region: 1,
    name: 'Old Man',
    beats: [
      'Coffee\'s simple. You grow it, you sell it, you lose money.',
      "That's the whole business."
    ]
  },

  girlLaptop: {
    region: 1,
    name: 'Girl with a Laptop',
    beats: [
      "I've been on the same tutorial for six months.",
      "It's very good though."
    ]
  },

  rival1: {
    region: 1,
    name: 'Rival',
    rival: true,
    beats: [
      'Still collecting badges?',
      'I optimized my LinkedIn instead.'
    ]
  }
};

// ---------------------------------------------------------------- signage

export const REGION2_LOCKED_BEATS = [
  'ROUTE CLOSED',
  'Three badges open the road to REBELMOUSE.'
];

// Shown by the Mentor once Region 1 is cleared.
export const REGION1_CLEAR_BEATS = [
  { card: 'CONGRATULATIONS!' },
  'You cleared THE BEGINNING — 3 of 7 badges.',
  { pause: 500 },
  'You learned the hardest lesson early:',
  'nobody hands you the qualification. You build it.',
  { pause: 400 },
  'Next region: REBELMOUSE.',
  'Four more gyms. The problems get bigger.',
  'So do you.'
];

// Placeholder past the gate until Region 2 is built.
export const NEXT_BUILD_BEATS = [
  'REBELMOUSE',
  'This region arrives in the next build.',
  'Thanks for testing.'
];
