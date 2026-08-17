// Full-screen DOM overlays: title, quest log, results, and the toast.
//
// All DOM rather than canvas, for the same reason the dialogue box is: text
// that has to be read on a phone should be real text.

import { NPC_ORDER, NPC_CONTENT } from './content.js';
import { run, badgeCount, isComplete } from './progress.js';

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

function paintQuestLog() {
  const rows = NPC_ORDER.map(id => {
    const c = NPC_CONTENT[id];
    const got = run.badges.includes(id);
    const locked = id === 'multigres' && !run.gateOpen && !got;
    const mark = got ? '★' : locked ? '🔒' : '☆';
    const cls = got ? 'got' : locked ? 'locked' : '';
    const note = got ? c.badge : locked ? 'Locked — earn five badges' : 'Not yet visited';
    return `<li class="${cls}"><span class="mark">${mark}</span>
      <span class="who">${c.name}</span><span class="note">${note}</span></li>`;
  }).join('');

  el.panelInner.innerHTML = `
    <h2>Supabase Certification</h2>
    <p class="sub">${badgeCount()}/6 badges · ${run.score} points</p>
    <ul class="quests">${rows}</ul>
    <button class="close" data-close="panel">Close</button>
  `;
  el.panelInner.querySelector('[data-close="panel"]').addEventListener('click', closeQuestLog);
}

// ---------- results ----------
// `save` submits the score and returns a status string to show; `recommend`
// posts a recommendation. Both are optional — without Supabase configured the
// screen still works, minus those blocks.
export function showResults({ onPlayAgain, onHome, save = null, recommend = null }) {
  const badges = run.badges.map(id => `<li>★ ${NPC_CONTENT[id].badge}</li>`).join('');
  el.resultsInner.innerHTML = `
    <h2>CERTIFIED</h2>
    <p class="score">${run.score} <span>points</span></p>
    <ul class="badges">${badges}</ul>
    <p class="note">${isComplete() ? 'All six badges. One database, zero lock-in.' : 'Run ended early.'}</p>
    <p id="saveStatus" class="save" role="status" aria-live="polite"></p>
    ${recommend ? `
      <div class="rec-box">
        <label for="recInput">Leave a note (optional, 200 characters)</label>
        <textarea id="recInput" maxlength="200" rows="3"
                  placeholder="Anything you'd want the Supabase team to read."></textarea>
        <button type="button" id="btnRec">Send</button>
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
    btn.addEventListener('click', async () => {
      const input = document.getElementById('recInput');
      const text = input.value.trim();
      const status = document.getElementById('recStatus');
      if (!text) { status.textContent = 'Write something first.'; return; }
      btn.disabled = true;
      btn.textContent = 'Sending…';
      const message = await recommend(text);
      btn.textContent = 'Send';
      status.textContent = message;
      // Held until approved in the dashboard, so say so rather than implying
      // it's already on the wall.
      if (!message.startsWith('Could')) { input.disabled = true; btn.style.display = 'none'; }
      else btn.disabled = false;
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
