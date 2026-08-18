// The public part of the site: landing page, sign-in, and the first-login
// nickname prompt. Plain DOM — this is a web page, not a game screen.

import * as db from './supabase.js';
import { YOUTUBE_ID, EMAIL_DELIVERY_CONFIGURED } from '../config.js';

let el = {};
let onPlay = () => {};
let session = null;
let profile = null;

export function init({ onStartGame }) {
  onPlay = onStartGame;
  el = {
    landing: document.getElementById('landing'),
    play: document.getElementById('btnPlay'),
    video: document.getElementById('videoSlot'),
    board: document.getElementById('leaderboard'),
    recs: document.getElementById('recWall'),
    account: document.getElementById('account'),

    login: document.getElementById('login'),
    loginErr: document.getElementById('loginError'),
    magicEmail: document.getElementById('magicEmail'),
    magicBtn: document.getElementById('btnMagic'),
    magicNote: document.getElementById('magicNote'),
    oauth: document.getElementById('oauthRow'),
    pwToggle: document.getElementById('pwToggle'),
    pwForm: document.getElementById('pwForm'),
    pwEmail: document.getElementById('pwEmail'),
    pwPass: document.getElementById('pwPass'),
    loginBack: document.getElementById('loginBack'),

    nickname: document.getElementById('nickname'),
    nickInput: document.getElementById('nickInput'),
    nickBtn: document.getElementById('btnNick'),
    nickErr: document.getElementById('nickError')
  };

  bind();
  paintVideo();
  refreshPublic();
  restoreSession();
}

function show(node) {
  ['landing', 'login', 'nickname'].forEach(k => el[k].classList.remove('visible'));
  if (node) el[node].classList.add('visible');
  document.body.classList.toggle('public', !!node);
}

export function showLanding() { show('landing'); refreshPublic(); }

// ---------------------------------------------------------------- session

async function restoreSession() {
  if (!db.isConfigured()) {
    el.play.textContent = 'PLAY (offline)';
    return;
  }
  session = await db.currentSession();
  await afterAuth(false);

  // Fires on magic-link and OAuth returns, which land back on this page with a
  // session in the URL fragment.
  db.onAuthChange(async s => {
    const wasSignedOut = !session;
    session = s;
    await afterAuth(wasSignedOut && !!s);
  });
}

async function afterAuth(justSignedIn) {
  paintAccount();
  if (!session) { profile = null; return; }

  const { data } = await db.getProfile(session.user.id);
  profile = data;
  paintAccount();

  if (!profile) {
    el.nickInput.value = db.suggestedName(session.user);
    show('nickname');
    return;
  }
  // Coming back from a redirect means they already asked to play.
  if (justSignedIn) startGame();
}

function paintAccount() {
  if (!db.isConfigured()) { el.account.innerHTML = ''; return; }
  if (!session) { el.account.innerHTML = ''; return; }
  const name = profile ? profile.display_name : session.user.email;
  el.account.innerHTML = `<span>Signed in as <b>${escapeHtml(name)}</b></span>
    <button type="button" id="btnSignOut">Sign out</button>`;
  document.getElementById('btnSignOut').addEventListener('click', async () => {
    await db.signOut();
    session = null;
    profile = null;
    paintAccount();
    refreshPublic();
  });
}

// ---------------------------------------------------------------- actions

function bind() {
  el.play.addEventListener('click', () => {
    // Unconfigured or offline: the game is the point, so let them play it and
    // skip everything that needs a server.
    if (!db.isConfigured()) { startGame(); return; }
    if (!session) { showLogin(); return; }
    if (!profile) { show('nickname'); return; }
    startGame();
  });

  el.magicBtn.addEventListener('click', async () => {
    const email = el.magicEmail.value.trim();
    if (!email) return setLoginError('Enter your email first.');
    setBusy(el.magicBtn, true, 'Sending…');
    const { error } = await db.signInWithMagicLink(email);
    setBusy(el.magicBtn, false, 'Send magic link');
    if (error) return setLoginError(db.friendlyError(error));
    setLoginError(`Link sent to ${email}. Check your inbox.`, 'ok');
  });

  el.oauth.addEventListener('click', async e => {
    // closest(), not e.target: the click usually lands on the <svg> or a <path>
    // inside the button rather than the button itself.
    const btn = e.target.closest('[data-provider]');
    if (!btn) return;

    // The redirect can take a beat on a phone. Without feedback the button
    // looks dead and gets tapped again.
    const label = btn.querySelector('span');
    const original = label.textContent;
    btn.disabled = true;
    label.textContent = 'Redirecting…';
    setLoginError('');

    const { error } = await db.signInWithProvider(btn.dataset.provider);
    if (error) {
      btn.disabled = false;
      label.textContent = original;
      setLoginError(db.friendlyError(error));
    }
    // On success the browser navigates away, so nothing needs resetting.
  });

  el.pwToggle.addEventListener('click', () => {
    el.pwForm.classList.toggle('open');
    el.pwToggle.setAttribute('aria-expanded', String(el.pwForm.classList.contains('open')));
  });

  el.pwForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = el.pwEmail.value.trim();
    const pass = el.pwPass.value;
    const mode = e.submitter && e.submitter.dataset.mode;
    if (!email || !pass) return setLoginError('Email and password, please.');

    const { error } = mode === 'signup'
      ? await db.signUpWithPassword(email, pass)
      : await db.signInWithPassword(email, pass);

    if (error) return setLoginError(db.friendlyError(error));
    if (mode === 'signup') setLoginError('Account created. Check your inbox to confirm.', 'ok');
  });

  el.loginBack.addEventListener('click', () => showLanding());

  el.nickBtn.addEventListener('click', async () => {
    const name = el.nickInput.value.trim();
    if (!name) return setNickError('Pick something.');
    if (name.length > 30) return setNickError('Thirty characters or fewer.');

    setBusy(el.nickBtn, true, 'Saving…');
    const { error } = await db.createProfile(
      session.user.id, name, db.suggestedAvatar(session.user)
    );
    setBusy(el.nickBtn, false, 'Continue');
    if (error) return setNickError(db.friendlyError(error));

    profile = { id: session.user.id, display_name: name };
    paintAccount();
    startGame();
  });
}

function showLogin() {
  setLoginError('');
  // Until custom SMTP is set up, say so here rather than letting someone send
  // themselves a link that will never arrive.
  el.magicNote.textContent = EMAIL_DELIVERY_CONFIGURED
    ? ''
    : 'Email delivery is still being set up — Google or GitHub is the reliable way in right now.';
  // Only offer what the project actually has switched on.
  el.oauth.querySelectorAll('[data-provider]').forEach(b => {
    b.style.display = db.AUTH_METHODS[b.dataset.provider] ? '' : 'none';
  });
  const anyOauth = [...el.oauth.querySelectorAll('[data-provider]')].some(b => b.style.display !== 'none');
  el.oauth.style.display = anyOauth ? '' : 'none';
  document.getElementById('oauthDivider').style.display = anyOauth ? '' : 'none';
  // Hide the form too, not just its toggle: a stale `open` class would
  // otherwise leave a dead sign-in form on screen.
  el.pwToggle.style.display = db.AUTH_METHODS.password ? '' : 'none';
  el.pwForm.style.display = db.AUTH_METHODS.password ? '' : 'none';
  show('login');
}

function startGame() {
  // Whichever button got us here still has focus, and Space is the game's
  // action key — without this, the first press re-fires that button instead of
  // reaching the title screen.
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  show(null);
  onPlay({ session, profile });
}

// ---------------------------------------------------------------- public data

export async function refreshPublic() {
  if (!db.isConfigured()) {
    el.board.innerHTML = '<li class="empty">Leaderboard appears once Supabase is connected.</li>';
    el.recs.innerHTML = '';
    return;
  }

  // Painted before the await: a failing DNS lookup makes supabase-js retry for
  // several seconds, and an empty <ol> during that time reads as "nobody has
  // played" rather than "still loading".
  el.board.innerHTML = '<li class="empty">Loading…</li>';

  const { data: scores, error } = await db.topScores(10);
  if (error) {
    el.board.innerHTML = `<li class="empty">Couldn't load the leaderboard. ${escapeHtml(db.friendlyError(error))}</li>`;
  } else if (!scores.length) {
    el.board.innerHTML = '<li class="empty">Nobody has finished yet. Be first.</li>';
  } else {
    el.board.innerHTML = scores.map((s, i) => `
      <li>
        <span class="rank">${i + 1}</span>
        <span class="who">${escapeHtml(s.display_name)}</span>
        <span class="badges" title="${s.badges} badges, ${s.first_try || 0} first try"
              >${'\u25c9'.repeat(s.badges || 0)}</span>
        <span class="pts">${s.score}</span>
      </li>`).join('');
  }

  const { data: recs } = await db.approvedRecommendations();
  el.recs.innerHTML = recs.length
    ? recs.map(r => `<blockquote>${escapeHtml(r.message)}
        <cite>— ${escapeHtml((r.profiles && r.profiles.display_name) || 'anonymous')}</cite>
      </blockquote>`).join('')
    : '';
  document.getElementById('recSection').style.display = recs.length ? '' : 'none';
}

// ---------------------------------------------------------------- helpers

function paintVideo() {
  if (!YOUTUBE_ID) {
    el.video.innerHTML = `<div class="video-placeholder">
      <p>▶ Video coming here</p>
      <p class="hint">Set YOUTUBE_ID in config.js</p>
    </div>`;
    return;
  }
  // No autoplay, and youtube-nocookie so a visitor isn't tracked for watching.
  el.video.innerHTML = `<iframe
    src="https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?rel=0&cc_load_policy=1"
    title="Why I want to work at Supabase"
    loading="lazy"
    allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
    allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}

function setLoginError(msg, kind = 'err') {
  el.loginErr.textContent = msg;
  el.loginErr.className = msg ? kind : '';
}

function setNickError(msg) { el.nickErr.textContent = msg; }

function setBusy(btn, busy, label) {
  btn.disabled = busy;
  btn.textContent = label;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const getSession = () => session;
export const getProfile = () => profile;
