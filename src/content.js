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
  },
  // ============================================ REGION 2 — REBELMOUSE

  listening: {
    gym: true,
    region: 2,
    name: 'The Feature Request',
    badge: 'LISTENING',
    hint: 'First meeting room on the left.',
    beats: [
      'Engineering ships exactly what clients ask for.',
      'Clients keep coming back unhappy.',
      'Nobody can explain why.'
    ],
    quiz: {
      question: 'What do you do?',
      options: [
        {
          text: 'Pitch your boss a new function that digs into what clients actually need',
          correct: true
        },
        {
          text: 'Ship the requests faster — maybe volume fixes it',
          retort: "Now they're unhappy sooner. Try again."
        },
        {
          text: 'Blame the clients for not writing better tickets',
          retort: 'Technically correct. Commercially fatal. Try again.'
        }
      ],
      win: 'Your boss says yes. You create the Solutions Architecture team. LISTENING BADGE obtained!'
    },
    postWin: "A team that didn't exist until someone asked for it."
  },

  order: {
    gym: true,
    region: 2,
    name: 'The Inbox',
    badge: 'ORDER',
    hint: 'First meeting room on the right.',
    beats: [
      'Support is chaos. Clients message whoever they can find.',
      "Sales, engineers, someone's personal LinkedIn.",
      'At 2 AM.'
    ],
    quiz: {
      question: 'What do you do?',
      options: [
        {
          text: 'Restructure the team so requests reach the right people, with quality',
          correct: true
        },
        {
          text: 'Tell everyone to "just be more responsive"',
          retort: 'Everyone is now responsive and nobody is accountable. Try again.'
        },
        {
          text: 'Add a chatbot and hope for the best',
          retort: 'The bot said "I understand your frustration" 400 times. Try again.'
        }
      ],
      win: "Order restored. You're promoted to Director of Technical Support. ORDER BADGE obtained!"
    },
    postWin: 'Nobody DMs the sales team on Sundays anymore.'
  },

  architect: {
    gym: true,
    region: 2,
    name: 'D\u00e9j\u00e0 Vu',
    badge: 'ARCHITECT',
    hint: 'Back of the floor, on the left.',
    beats: [
      "You're back — now as Director of Solutions Architecture,",
      'leading the team you built.',
      'And you notice something.',
      'Every client has a "unique" problem.',
      'They are the same seven problems wearing different hats.'
    ],
    quiz: {
      question: 'What do you do?',
      options: [
        {
          text: 'Build modular, agnostic solutions that work for architects and clients alike',
          correct: true
        },
        {
          text: 'Keep building one-off custom work for every account',
          retort: 'Your team is now 100% maintenance and 0% progress. Try again.'
        },
        {
          text: 'Write a very long internal doc about it and move on',
          retort: 'The doc has 3 views. Two are yours. Try again.'
        }
      ],
      win: 'Solve once, reuse everywhere. ARCHITECT BADGE obtained!'
    },
    postWin: 'Same seven problems. Now they have answers.'
  },

  ai: {
    gym: true,
    region: 2,
    name: 'The Industry',
    badge: 'AI',
    hint: 'Back of the floor, on the right.',
    beats: [
      'The industry is shifting fast.',
      'The company needs new products.',
      'Everyone can see it.',
      'Nobody wants to say it out loud.'
    ],
    quiz: {
      question: 'What do you do?',
      options: [
        {
          text: 'Take the proposal straight to the CEO and offer to lead it',
          correct: true
        },
        {
          text: 'Wait for leadership to figure it out',
          retort: "They're waiting for someone too. That someone was you. Try again."
        },
        {
          text: 'Optimize the existing product 3% harder',
          retort: 'Excellent margins on a shrinking market. Try again.'
        }
      ],
      win: 'You become General Manager of AI products. AI BADGE obtained!'
    },
    postWin: 'Someone had to say it out loud.'
  },

  // ============================================ FLAVOUR — REGION 2

  hoodie: {
    region: 2,
    name: 'Engineer in a Hoodie',
    beats: [
      'Ticket says build a dropdown.',
      "I've built four.",
      'They keep opening new tickets.'
    ]
  },

  salesRep: {
    region: 2,
    name: 'Sales Rep',
    beats: [
      'Have you seen support?',
      "A client just DM'd me on a Sunday.",
      'Just\u2026 anyone. Anyone at all.'
    ]
  },

  coffeeMachine: {
    region: 2,
    name: 'Someone at the Coffee Machine',
    beats: [
      'Third client this month with the exact same problem.',
      'Weird, right?',
      'Anyway.'
    ]
  },

  onACall: {
    region: 2,
    name: 'Person on a Call',
    beats: [
      "Everything's fine.",
      'Numbers are flat but flat is the new up.'
    ]
  },

  rival2: {
    region: 2,
    name: 'Rival',
    rival: true,
    beats: [
      'Four badges?',
      'I have three certifications and a newsletter.'
    ]
  },
  // ============================================ REGION 3 — THE SUPABASE LEAGUE
  //
  // Four trials, no badges. Future tense: nothing here has happened. The wrong
  // answers stop being jokes — this is judgment, and the tonal shift is what
  // makes the ending land.

  learn: {
    trial: true,
    region: 3,
    name: 'Learn the Platform',
    beats: [
      "You know architecture.",
      "You don't know Supabase — not the way you'd need to."
    ],
    quiz: {
      question: 'What would you do?',
      options: [
        {
          text: 'Study the docs and the competition, sit in on customer calls, and take smaller projects to learn by doing',
          correct: true
        },
        {
          text: 'Block off a few weeks to go through everything before touching anything client-facing',
          retort: "You'd know the product and not the customers. Half a map. Try again."
        },
        {
          text: 'Skip the ramp-up — general architecture experience transfers fine',
          retort: 'Confidence without context is just noise. Try again.'
        }
      ],
      win: 'You learn the platform and the customers at the same time. Onward.'
    },
    postWin: 'Half a map is worse than no map.'
  },

  discovery: {
    trial: true,
    region: 3,
    name: 'The Discovery Call',
    beats: [
      'First real call. An enterprise team is migrating off a managed Postgres provider.',
      'They open with: "Can Supabase handle 40,000 concurrent connections?"',
      'Growth is on the call too. They need a usage estimate by Friday.'
    ],
    quiz: {
      question: 'What would you do?',
      options: [
        {
          text: "Ask what's driving the number — traffic shape, workload, growth plan — then set honest expectations and define success",
          correct: true
        },
        {
          text: 'Say yes and move to the demo — the platform can handle it',
          retort: 'You won the call and lost the account six months later. Try again.'
        },
        {
          text: 'Give them the connection pooling docs and let them work it out',
          retort: "They didn't need a link. They needed a thinking partner. Try again."
        }
      ],
      win: 'Real requirements surface. Growth gets a number they can trust. Onward.'
    },
    postWin: 'The number was never the question.'
  },

  pov: {
    trial: true,
    region: 3,
    name: 'The Proof of Value',
    beats: [
      "They're interested. Now they want to see it work with their own data.",
      'Their team can spare about three weeks.',
      'Their CTO wants proof, not a tour.'
    ],
    quiz: {
      question: 'What would you do?',
      options: [
        {
          text: 'Scope it to the workload that decides the deal, agree timeline and success criteria up front, and stay close through the build',
          correct: true
        },
        {
          text: 'Show everything — Auth, Storage, Realtime, Edge Functions, Vector — so they see the full platform',
          retort: 'Week three. Nothing finished, everything demoed. Try again.'
        },
        {
          text: 'Hand them onboarding docs and a guide, then check in at the end',
          retort: 'Self-serve is a product strategy, not a POV strategy. Try again.'
        }
      ],
      win: 'They hit the criteria you agreed on together. They\u2019re comfortable moving forward. Onward.'
    },
    postWin: 'Narrow beats broad, every time.'
  },

  advisor: {
    trial: true,
    region: 3,
    name: 'Trusted Advisor',
    beats: [
      'Months in. Your accounts are live — this is their production data now.',
      'And you keep seeing the same query patterns choke the same way across four of them.',
      'Every account has a workaround. None of them should have needed one.'
    ],
    quiz: {
      question: 'What would you do?',
      options: [
        {
          text: 'Fix it per account, then take the pattern to Product and Engineering as platform feedback — and tell the customers what\u2019s coming',
          correct: true
        },
        {
          text: 'Document the workaround so every CSA can apply it',
          retort: 'You scaled the workaround, not the fix. Gym 6, remember? Try again.'
        },
        {
          text: 'Keep resolving them account by account — the customers are happy',
          retort: 'Happy today, blocked at the next order of magnitude. Try again.'
        }
      ],
      win: 'You advocate for the customer inside Supabase, and for the platform in front of the customer. That\u2019s the whole job. Onward.'
    },
    postWin: 'Same instinct as the Architect badge. Bigger room.'
  },

  // ============================================ FLAVOUR — REGION 3

  colleague: {
    region: 3,
    name: 'Colleague',
    beats: ['Docs are good. Customer calls are better.', 'Do both.']
  },

  huddle: {
    region: 3,
    name: 'Someone in a Huddle',
    beats: [
      'Customer asked for a number.',
      'What they meant was "will this break in March."'
    ]
  },

  growth: {
    region: 3,
    name: 'Growth Teammate',
    beats: [
      "Best POVs I've seen were narrow.",
      'Worst ones tried to be a product tour.'
    ]
  },

  whiteboard: {
    region: 3,
    name: 'By the Whiteboard',
    beats: [
      "If you hear it three times, it's not a bug report.",
      "It's a roadmap."
    ]
  },

  rival3: {
    region: 3,
    name: 'Rival',
    rival: true,
    beats: ['\u2026okay, that\u2019s actually a good career.']
  },

  // The Mentor at the end of the hall.
  hallOfFame: {
    region: 3,
    name: 'The Mentor',
    beats: []
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

export const LEAGUE_LOCKED_BEATS = [
  'THE SUPABASE LEAGUE',
  'All seven badges open this door.'
];

// The tonal pivot. Everything behind is real; everything ahead is not.
export const PRESENT_MOMENT_BEATS = [
  { card: 'ALL 7 BADGES' },
  'Stop for a second. Look at where you are.',
  { pause: 700 },
  'Everything you just played — that all really happened.',
  { pause: 500 },
  'This is the present moment.',
  "What comes next hasn't happened yet.",
  'It\u2019s the future Laura would like to happen.',
  { pause: 500 },
  'Ahead of you: the SUPABASE LEAGUE.',
  'No badges here — just four trials.',
  'Ready?'
];

export const LEAGUE_ENTRY_BEATS = [
  { card: 'THE SUPABASE LEAGUE' },
  'Four trials. No badges.',
  'None of this has happened yet.',
  'Answer as you would.'
];

export const TRIALS_UNFINISHED_BEATS = [
  'Four trials stand between you and the Hall of Fame.',
  'Finish them.'
];

export const HALL_OF_FAME_BEATS = [
  { card: 'HALL OF FAME' },
  'Laura entered the Hall of Fame.',
  { pause: 700 },
  'From a coffee farm in the red to AI products.',
  'Every badge was a problem nobody assigned her.',
  { pause: 500 },
  "The last region hasn't been played yet.",
  "She'd love the chance to play it at Supabase.",
  { pause: 400 },
  'Thank you for playing!'
];
