// Full-screen DOM overlays: title, quest log, results, and the toast.
//
// All DOM rather than canvas, for the same reason the dialogue box is: text
// that has to be read on a phone should be real text.

import { BADGE_ORDER, TRIAL_ORDER, NPC_CONTENT } from './content.js';
import { run, badgeCount, trialCount, allBadges } from './progress.js';

let el = {};
let toastTimer = null;
let howToPlay = () => {};

export function onHowToPlay(fn) { howToPlay = fn; }

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

// The badge case. Earned badges in full, locked ones as silhouettes with a
// hint — this is the player's answer to "where do I go next", so the hint
// matters more than the styling.
function paintQuestLog() {
  const rows = BADGE_ORDER.map(id => {
    const c = NPC_CONTENT[id];
    // Region 2 content doesn't exist yet in this build.
    if (!c) {
      return `<li class="locked"><span class="mark">?</span>
        <span class="who">? ? ? ? ?</span><span class="note">Region 2</span></li>`;
    }
    const got = run.badges.includes(id);
    return `<li class="${got ? 'got' : 'locked'}">
      <span class="mark">${got ? '\u25c9' : '\u25cb'}</span>
      <span class="who">${got ? c.badge : '? ? ? ? ?'}</span>
      <span class="note">${got ? c.name : (c.hint || 'Not found yet')}</span></li>`;
  }).join('');

  el.panelInner.innerHTML = `
    <h2>Badge Case</h2>
    <p class="sub">${badgeCount()}/${BADGE_ORDER.length} badges &middot; ${run.score} points
      &middot; ${run.firstTry} first try</p>
    <ul class="quests">${rows}</ul>
    <p class="muted">Badges are earned in gyms. Look for the pink roofs and the
      badge over the door.</p>
    <div class="panel-actions">
      <button class="ghost" data-howto>How to play</button>
      <button class="close" data-close="panel">Close</button>
    </div>
  `;
  el.panelInner.querySelector('[data-close="panel"]').addEventListener('click', closeQuestLog);
  el.panelInner.querySelector('[data-howto]').addEventListener('click', () => howToPlay());
}

// ---------- results ----------
// `save` submits the score and returns a status string to show; `recommend`
// posts a recommendation. Both are optional — without Supabase configured the
// screen still works, minus those blocks.
export function showResults({ onPlayAgain, onHome, save = null, recommend = null }) {
  const earned = run.badges.map(id => `<li>\u25c9 ${NPC_CONTENT[id].badge}</li>`).join('');

  el.resultsInner.innerHTML = `
    <h2>HALL OF FAME</h2>
    <p class="score">${run.score} <span>points</span></p>
    <p class="sub">${badgeCount()}/${BADGE_ORDER.length} badges
      &middot; ${trialCount()}/${TRIAL_ORDER.length} trials
      &middot; ${run.firstTry} first try</p>
    <ul class="badges">${earned}</ul>
    <p class="note">${allBadges()
      ? 'Every badge was a problem nobody assigned her.'
      : 'Run ended early.'}</p>
    <p class="muted">The last region hasn't been played yet.
      She'd love the chance to play it at Supabase.</p>
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
      <a class="ghost link" href="https://www.linkedin.com/in/laurajbarros/"
         target="_blank" rel="noopener">LinkedIn</a>
      <a class="ghost link" href="https://github.com/laurajbarros/supabase-quest"
         target="_blank" rel="noopener">Repo</a>
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
