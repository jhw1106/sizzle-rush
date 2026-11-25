// Sizzle Rush — audio: every sound is synthesized with WebAudio, no files.
// A tiny synth: short oscillator blips and filtered noise bursts, so the
// kitchen sizzles, chops and dings without a single audio asset.

let ctx = null;
let muted = false;
let sizzleTimer = null;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function initAudio() {
  audioCtx();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain, filterFreq) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start();
}

export const sfx = {
  pickup() { tone(520, 0.09, 'sine', 0.18, 0, 760); },
  drop() { tone(300, 0.08, 'sine', 0.14, 0, 210); },
  chop() { noiseBurst(0.09, 0.5, 1400); tone(180, 0.06, 'square', 0.08); },
  chopDone() { tone(660, 0.1, 'triangle', 0.2); tone(880, 0.14, 'triangle', 0.2, 0.09); },
  grillDone() { tone(740, 0.1, 'triangle', 0.2); tone(990, 0.16, 'triangle', 0.2, 0.09); },
  serve() { tone(784, 0.12, 'sine', 0.22); tone(1047, 0.2, 'sine', 0.22, 0.1); tone(1319, 0.26, 'sine', 0.18, 0.2); },
  error() { tone(160, 0.18, 'sawtooth', 0.14, 0, 110); },
  orderIn() { tone(587, 0.1, 'triangle', 0.16); tone(880, 0.14, 'triangle', 0.16, 0.08); },
  tick() { tone(980, 0.05, 'square', 0.08); },
  burnt() { tone(220, 0.25, 'sawtooth', 0.16, 0, 90); },
  startDay() { tone(523, 0.12, 'triangle', 0.2); tone(659, 0.12, 'triangle', 0.2, 0.11); tone(784, 0.2, 'triangle', 0.2, 0.22); },
  dayOver() { tone(392, 0.16, 'triangle', 0.2); tone(330, 0.16, 'triangle', 0.2, 0.15); tone(262, 0.34, 'triangle', 0.2, 0.3); },
};

export function startSizzle() {
  if (sizzleTimer) return;
  sizzleTimer = setInterval(() => noiseBurst(0.12, 0.05, 5200), 140);
}

export function stopSizzle() {
  if (sizzleTimer) { clearInterval(sizzleTimer); sizzleTimer = null; }
}
