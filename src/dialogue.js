// Dialogue box: DOM, not canvas.
//
// It occupies the bottom third and the map stays visible above it. Typewriter
// reveal at ~25ms/char; A (or a tap) completes the current beat instantly, and
// again to advance — never a single press that both finishes and skips, which
// is how players miss lines.

import { sfx } from './audio.js';

const CHAR_MS = 25;

let el = {};
let state = 'idle';   // idle | typing | ready | choosing | done
let beats = [];
let index = 0;
let shown = 0;
let timer = 0;
let quiz = null;
let choice = 0;
let onFinish = null;
let answeredCorrectly = false;

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

export function open(newBeats, { name = '', speaker = 'npc', quiz: q = null, onDone = null } = {}) {
  beats = [...newBeats];
  index = 0;
  shown = 0;
  timer = 0;
  quiz = q;
  choice = 0;
  onFinish = onDone;
  answeredCorrectly = false;

  el.box.className = 'visible ' + speaker;
  el.name.textContent = name;
  el.name.style.display = name ? '' : 'none';
  el.choices.innerHTML = '';
  document.body.classList.add('dialog');

  state = 'typing';
  paint();
}

function currentText() {
  return beats[index] || '';
}

function paint() {
  el.text.textContent = currentText().slice(0, shown);
  el.box.classList.toggle('ready', state === 'ready');
  el.box.classList.toggle('choosing', state === 'choosing');
}

export function update(dt) {
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
  if (state === 'ready') { advance(); return; }
  if (state === 'choosing') { confirm(); }
}

function advance() {
  index++;
  if (index < beats.length) {
    shown = 0;
    timer = 0;
    state = 'typing';
    sfx.advance();
    paint();
    return;
  }
  if (quiz) { askQuiz(); return; }
  close();
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

  // Say plainly whether it was right, then teach the point either way — the
  // goal is that they leave knowing the answer, not that they're scored.
  const verdict = answeredCorrectly ? '✅ Correct.' : `❌ Not quite. The answer: ${quiz.options.find(o => o.correct).text}.`;
  beats = [verdict, quiz.after].filter(Boolean);
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
  document.body.classList.remove('dialog');
  const done = onFinish;
  onFinish = null;
  if (done) done({ correct: answeredCorrectly });
}
