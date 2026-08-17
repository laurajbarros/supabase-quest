// Dialogue box: DOM, not canvas.
//
// It occupies the bottom third and the map stays visible above it. Typewriter
// reveal at ~25ms/char; A (or a tap) completes the current beat instantly, and
// again to advance — never a single press that both finishes and skips, which
// is how players miss lines.

import { sfx } from './audio.js';

const CHAR_MS = 25;

let el = {};
// idle | typing | ready | choosing | paused | card
let state = 'idle';
let beats = [];
let index = 0;
let shown = 0;
let timer = 0;
let quiz = null;
let choice = 0;
let onFinish = null;
let onWorld = null;
let answeredCorrectly = false;
let pauseLeft = 0;

export function init() {
  el = {
    box: document.getElementById('dialogue'),
    name: document.getElementById('dlgName'),
    text: document.getElementById('dlgText'),
    choices: document.getElementById('dlgChoices'),
    next: document.getElementById('dlgNext')
  };
  // Tapping the box itself advances — the most obvious gesture on a phone.
  el.box.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    action();
  });
}

export function isOpen() { return state !== 'idle'; }
export function isChoosing() { return state === 'choosing'; }

// A beat is a string, or one of:
//   { pause: ms }        hold on an empty box, then continue
//   { card: 'TEXT' }     a full-width title card, waits for A
//   { set: [[x,y,tile]]} change the world mid-scene, shows nothing
//
// The last one is what lets a scene show rather than tell: a pile of crates can
// disappear one at a time between lines of dialogue. `onWorld` receives it, so
// this module never has to know about the map.
export function open(newBeats, { name = '', speaker = 'npc', quiz: q = null,
                                 onDone = null, world = null } = {}) {
  beats = [...newBeats];
  index = 0;
  shown = 0;
  timer = 0;
  quiz = q;
  choice = 0;
  onFinish = onDone;
  onWorld = world;
  answeredCorrectly = false;
  pauseLeft = 0;

  el.box.className = 'visible ' + speaker;
  el.name.textContent = name;
  el.name.style.display = name ? '' : 'none';
  el.choices.innerHTML = '';
  document.body.classList.add('dialog');

  enterBeat();
}

const beatOf = () => beats[index];
const isText = b => typeof b === 'string';

function currentText() {
  const b = beatOf();
  if (isText(b)) return b;
  if (b && b.card) return b.card;
  return '';
}

// Walks forward over any beats that aren't displayed, so a run of world
// changes resolves in one go rather than costing the player a tap each.
function enterBeat() {
  for (;;) {
    const b = beatOf();

    if (b === undefined) {
      if (quiz) askQuiz();
      else close();
      return;
    }
    if (isText(b)) {
      shown = 0;
      timer = 0;
      state = 'typing';
      paint();
      return;
    }
    if (b.set) {
      if (onWorld) onWorld(b.set);
      index++;
      continue;
    }
    if (b.pause) {
      pauseLeft = b.pause;
      state = 'paused';
      shown = 0;
      paint();
      return;
    }
    if (b.card) {
      shown = b.card.length;   // a card lands at once; it's a stamp, not speech
      state = 'card';
      sfx.badge();
      paint();
      return;
    }
    index++;   // unknown beat shape: skip rather than stall the scene
  }
}

function paint() {
  const b = beatOf();
  const card = !!(b && b.card);
  el.text.textContent = state === 'paused' ? '' : currentText().slice(0, shown);
  el.box.classList.toggle('ready', state === 'ready' || state === 'card');
  el.box.classList.toggle('choosing', state === 'choosing');
  el.box.classList.toggle('card', card);
  el.name.style.display = (card || !el.name.textContent) ? 'none' : '';
}

export function update(dt) {
  if (state === 'paused') {
    pauseLeft -= dt;
    if (pauseLeft <= 0) { index++; enterBeat(); }
    return;
  }
  if (state !== 'typing') return;

  timer += dt;
  const target = Math.min(currentText().length, Math.floor(timer / CHAR_MS));
  if (target !== shown) {
    // One tick per few characters, not per character — per-character is a buzz.
    if (target % 3 === 0) sfx.talk();
    shown = target;
    paint();
  }
  if (shown >= currentText().length) {
    state = 'ready';
    paint();
  }
}

// The A button / tap / Enter. One entry point for every input route.
export function action() {
  if (state === 'typing') {
    // Complete the line rather than skipping it.
    shown = currentText().length;
    state = 'ready';
    paint();
    return;
  }
  // A during a pause skips the wait rather than doing nothing.
  if (state === 'paused') { index++; enterBeat(); return; }
  if (state === 'ready' || state === 'card') { advance(); return; }
  if (state === 'choosing') { confirm(); }
}

function advance() {
  index++;
  if (index < beats.length) sfx.advance();
  enterBeat();
}

function askQuiz() {
  beats = [quiz.question];
  index = 0;
  shown = quiz.question.length;   // the question appears at once; it's a prompt
  state = 'choosing';

  el.choices.innerHTML = '';
  quiz.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = opt.text;
    b.className = i === choice ? 'sel' : '';
    b.addEventListener('click', () => { choice = i; confirm(); });
    el.choices.appendChild(b);
  });
  paint();
}

export function moveChoice(delta) {
  if (state !== 'choosing') return;
  const n = quiz.options.length;
  choice = (choice + delta + n) % n;
  [...el.choices.children].forEach((b, i) => b.classList.toggle('sel', i === choice));
  sfx.select();
}

function confirm() {
  const picked = quiz.options[choice];
  answeredCorrectly = !!picked.correct;
  answeredCorrectly ? sfx.correct() : sfx.wrong();

  // The follow-up is supplied by the caller and branches on the answer: the two
  // routes acknowledge a wrong answer very differently, because one asks about
  // facts and the other asks about judgment.
  beats = quiz.resolve(answeredCorrectly, quiz.options.find(o => o.correct).text);
  index = 0;
  shown = 0;
  timer = 0;
  quiz = null;
  state = 'typing';

  el.choices.innerHTML = '';
  paint();
}

export function close() {
  state = 'idle';
  el.box.className = '';
  el.name.style.display = '';
  document.body.classList.remove('dialog');
  const done = onFinish;
  onFinish = null;
  if (done) done({ correct: answeredCorrectly });
}
