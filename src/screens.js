// Full-screen DOM overlays: title, quest log, results, and the toast.
//
// All DOM rather than canvas, for the same reason the dialogue box is: text
// that has to be read on a phone should be real text.

import { FIELD_ORDER, PLATFORM_ORDER, NPC_CONTENT } from './content.js';
import { run, fieldCount, platformCount, isComplete } from './progress.js';
import { ROUTE_GATE_REQUIREMENT, CEILING_REQUIREMENT, OFFICE_REQUIREMENT } from './progress.js';

let el = {};
let toastTimer = null;

export function init() {
  el = {
    title: document.getElementById('titleScreen'),
    titleHint: document.getElementById('titleHint'),
    panel: document.getElementById('panel'),
    panelInner: document.getElementById('panelInner'),
    results: document.getElementById('results'),
    resultsInner: document.getElementById('resultsInner'),
    toast: document.getElementById('toast')
  };
}

// ---------- toast ----------
export function toast(message, ms = 2600) {
  el.toast.textContent = message;
  el.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('visible'), ms);
}

// ---------- title ----------
export function showTitle(hasSave) {
  el.titleHint.textContent = hasSave ? 'PRESS START TO CONTINUE' : 'PRESS START';
  el.title.classList.add('visible');
  document.body.classList.add('title');
}

export function hideTitle() {
  el.title.classList.remove('visible');
  document.body.classList.remove('title');
}

export function isTitleVisible() {
  return el.title.classList.contains('visible');
}

// ---------- quest log ----------
export function toggleQuestLog() {
  const open = el.panel.classList.toggle('visible');
  document.body.classList.toggle('panel', open);
  if (open) paintQuestLog();
  return open;
}

export function closeQuestLog() {
  el.panel.classList.remove('visible');
  document.body.classList.remove('panel');
}

export function isQuestLogOpen() {
  return el.panel.classList.contains('visible');
}

function questRows(ids, done, lockedWhen) {
  return ids.map(id => {
    const c = NPC_CONTENT[id];
    const got = done.includes(id);
    const locked = !got && lockedWhen(id);
    const mark = got ? '\u2605' : locked ? '\ud83d\udd12' : '\u2606';
    const cls = [got ? 'got' : '', locked ? 'locked' : ''].filter(Boolean).join(' ');
    const note = got ? c.badge : locked ? 'Locked' : 'Not yet visited';
    return `<li class="${cls}"><span class="mark">${mark}</span>
      <span class="who">${c.name}</span><span class="note">${note}</span></li>`;
  }).join('');
}

function paintQuestLog() {
  el.panelInner.innerHTML = `
    <h2>Laura &mdash; ${run.title}</h2>
    <p class="sub">${run.score} points</p>

    <h3 class="track-head field">Route 1 &mdash; The Field
      <span>${fieldCount()}/${FIELD_ORDER.length}</span></h3>
    <ul class="quests">${questRows(FIELD_ORDER, run.field, () => false)}</ul>

    <h3 class="track-head platform">Route 2 &mdash; The Work I Want
      <span>${platformCount()}/${PLATFORM_ORDER.length}</span></h3>
    <ul class="quests">${questRows(PLATFORM_ORDER, run.platform,
      id => !run.routeOpen || (id === 'ceiling' && !run.gateOpen))}</ul>

    <button class="close" data-close="panel">Close</button>
  `;
  el.panelInner.querySelector('[data-close="panel"]').addEventListener('click', closeQuestLog);
}

// ---------- results ----------
// `save` submits the score and returns a status string to show; `recommend`
// posts a recommendation. Both are optional — without Supabase configured the
// screen still works, minus those blocks.
export function showResults({ onPlayAgain, onHome, save = null, recommend = null }) {
  const dots = (n, total, cls) => `<span class="dots ${cls}">` +
    Array.from({length: total}, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('') +
    `</span>`;

  el.resultsInner.innerHTML = `
    <h2>${run.title}</h2>
    <div class="result-tracks">
      <div class="track field"><span class="track-label">FIELD</span>
        ${dots(fieldCount(), FIELD_ORDER.length, 'field')}
        <span class="track-count">${fieldCount()}/${FIELD_ORDER.length}</span></div>
      <div class="track platform"><span class="track-label">PLATFORM</span>
        ${dots(platformCount(), PLATFORM_ORDER.length, 'platform')}
        <span class="track-count">${platformCount()}/${PLATFORM_ORDER.length}</span></div>
    </div>
    <p class="score">${run.score} <span>points</span></p>
    <blockquote class="sendoff">Five in the field.<br>Six on the platform.<br>
      Now go build something in a weekend.<cite>&mdash; Laura</cite></blockquote>
    <p class="note">${isComplete() ? '' : 'Run ended early.'}</p>
    <p id="saveStatus" class="save" role="status" aria-live="polite"></p>
    ${recommend ? `
      <div class="rec-box">
        <label for="recInput">Leave a note (optional, 200 characters)</label>
        <textarea id="recInput" maxlength="200"
                  placeholder="Anything you'd want the Supabase team to read."></textarea>
        <div class="rec-actions">
          <button type="button" id="btnRec">Send</button>
          <span id="recCount">0/200</span>
        </div>
        <p id="recStatus" role="status" aria-live="polite"></p>
      </div>` : ''}
    <div class="result-actions">
      <button class="again" data-again>Play again</button>
      <button class="ghost" data-home>Back to the page</button>
    </div>
  `;

  el.resultsInner.querySelector('[data-again]').addEventListener('click', () => {
    hideResults();
    onPlayAgain();
  });
  el.resultsInner.querySelector('[data-home]').addEventListener('click', () => {
    hideResults();
    onHome();
  });

  if (recommend) {
    const btn = document.getElementById('btnRec');
    const count = document.getElementById('recCount');
    const field = document.getElementById('recInput');
    // The 200-character cap is enforced by maxlength, by a check constraint in
    // the schema, and by a slice before insert. Showing the remaining budget
    // stops it being discovered by silently losing the end of a sentence.
    field.addEventListener('input', () => {
      count.textContent = `${field.value.length}/200`;
      count.classList.toggle('full', field.value.length >= 200);
    });
    btn.addEventListener('click', async () => {
      const input = document.getElementById('recInput');
      const text = input.value.trim();
      const status = document.getElementById('recStatus');
      if (!text) { status.textContent = 'Write something first.'; return; }
      btn.disabled = true;
      btn.textContent = 'Sending…';
      const message = await recommend(text);
      btn.textContent = 'Send';
      const failed = message.startsWith('Could');
      status.textContent = message;
      status.className = failed ? 'err' : 'ok';
      // Held until approved in the dashboard, so say so rather than implying
      // it's already on the wall.
      if (failed) btn.disabled = false;
      else { input.disabled = true; btn.style.display = 'none'; }
    });
  }

  el.results.classList.add('visible');
  document.body.classList.add('results');

  if (save) {
    const status = document.getElementById('saveStatus');
    status.textContent = 'Saving your score…';
    save().then(msg => { status.textContent = msg; });
  }
}

export function hideResults() {
  el.results.classList.remove('visible');
  document.body.classList.remove('results');
}

export function isResultsVisible() {
  return el.results.classList.contains('visible');
}

// ---------- objective chip ----------
export function setObjective(text) {
  document.getElementById('objectiveText').textContent = text;
}
