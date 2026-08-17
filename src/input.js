// Keyboard and touch collapse into one state, so nothing downstream needs to
// know which one the player is using.

const DIRS = ['up', 'down', 'left', 'right'];

export const held = { up: false, down: false, left: false, right: false };

// Handlers are supplied by game.js. Actions fire as events rather than being
// polled, so a press still registers on the title screen and in menus, where
// the simulation loop isn't stepping.
let handlers = { onAction: () => {}, onDirection: () => {} };

function fireAction() { handlers.onAction(); }

const KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right'
};

// Most recently pressed direction wins, so a diagonal press never deadlocks.
let priority = [];

// A tap can start and end inside a single frame — especially on a keyboard, or
// a quick thumb — so a press is remembered briefly after release.
const BUFFER_FRAMES = 8;
let buffered = null;
let bufferTtl = 0;

function press(dir) {
  if (!held[dir]) {
    held[dir] = true;
    priority = [dir, ...priority.filter(d => d !== dir)];
  }
  buffered = dir;
  bufferTtl = BUFFER_FRAMES;
  handlers.onDirection(dir);
}

function release(dir) {
  held[dir] = false;
  priority = priority.filter(d => d !== dir);
}

export function tick() {
  if (bufferTtl > 0) bufferTtl--;
  else buffered = null;
}

export function currentDirection() {
  if (priority.length) return priority[0];
  if (buffered && bufferTtl > 0) {
    const d = buffered;
    buffered = null;
    bufferTtl = 0;
    return d;
  }
  return null;
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function init(newHandlers = {}) {
  handlers = { ...handlers, ...newHandlers };

  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (KEYS[e.code]) {
      press(KEYS[e.code]);
      e.preventDefault();
    } else if (e.code === 'Space' || e.code === 'Enter') {
      fireAction();
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', e => {
    if (KEYS[e.code]) {
      release(KEYS[e.code]);
      e.preventDefault();
    }
  });

  // Releasing everything on blur prevents a stuck key when the tab loses focus
  // mid-walk (alt-tab, incoming call).
  window.addEventListener('blur', () => DIRS.forEach(release));

  bindTouch();

  if (isTouchDevice()) document.body.classList.add('touch');
  window.addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true });
}

function bindTouch() {
  for (const dir of DIRS) {
    const el = document.querySelector(`[data-pad="${dir}"]`);
    if (!el) continue;

    const on = e => { e.preventDefault(); press(dir); el.classList.add('on'); };
    const off = e => { e.preventDefault(); release(dir); el.classList.remove('on'); };

    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    // Sliding a thumb off the button must not leave the direction stuck on.
    el.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      const r = el.getBoundingClientRect();
      const inside = t.clientX >= r.left && t.clientX <= r.right &&
                     t.clientY >= r.top && t.clientY <= r.bottom;
      if (inside) { press(dir); el.classList.add('on'); }
      else { release(dir); el.classList.remove('on'); }
    }, { passive: false });
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  }

  const a = document.querySelector('[data-btn="a"]');
  if (!a) return;
  const fire = e => { e.preventDefault(); fireAction(); a.classList.add('on'); };
  const done = e => { e.preventDefault(); a.classList.remove('on'); };
  a.addEventListener('touchstart', fire, { passive: false });
  a.addEventListener('touchend', done, { passive: false });
  a.addEventListener('touchcancel', done, { passive: false });
  a.addEventListener('mousedown', fire);
  a.addEventListener('mouseup', done);
}
