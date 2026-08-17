// Square-wave blips, synthesised — no audio files, same as the art.
//
// Sound is on by default. Nothing plays before the player has tapped PLAY, so
// the browser's autoplay policy is satisfied and a visitor never gets noise
// from a page they only glanced at. The choice is remembered once made.

const KEY = 'sbq_muted';

let ctx = null;
let muted = localStorage.getItem(KEY) === 'true';

export function isMuted() { return muted; }

export function setMuted(on) {
  muted = !!on;
  localStorage.setItem(KEY, String(muted));
}

// The context can only be created inside a user gesture on iOS, so it's made
// lazily on the first sound rather than at load.
function context() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, ms, { type = 'square', gain = 0.04 } = {}) {
  if (muted) return;
  const ac = context();
  if (!ac) return;

  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.value = gain;
  // A short ramp to zero instead of a hard stop; a square wave cut mid-cycle
  // clicks audibly.
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + ms / 1000);
  osc.connect(vol).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + ms / 1000);
}

export const sfx = {
  step:    () => blip(180, 40, { gain: 0.02 }),
  talk:    () => blip(520, 25, { gain: 0.015 }),
  advance: () => blip(660, 50),
  select:  () => blip(440, 40),
  correct: () => { blip(660, 70); setTimeout(() => blip(880, 110), 80); },
  wrong:   () => blip(180, 160, { type: 'sawtooth', gain: 0.03 }),
  badge:   () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 110), i * 90));
  },
  unlock:  () => {
    [392, 523, 659].forEach((f, i) => setTimeout(() => blip(f, 150), i * 130));
  }
};
