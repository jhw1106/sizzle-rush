// Sizzle Rush — main: the game loop, screen flow, mouse hover and clicks,
// sound wiring, and the ?shot= screenshot staging. The kitchen logic lives
// in kitchen.js, the drawing in render.js; this file just runs the show.

import { VIEW, STATIONS, CRATES, makeRng } from './config.js';
import { createInput } from './input.js';
import { createKitchen, startDay, updateKitchen, interact } from './kitchen.js';
import { render } from './render.js';
import { applyShot, readShotParams } from './shots.js';
import { initAudio, toggleMute, sfx, startSizzle, stopSizzle } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const input = createInput(canvas);
const shot = readShotParams();
const rng = makeRng(shot ? shot.seed : (Date.now() % 2147483647));
const kitchen = createKitchen(rng);
let frozen = false;

if (shot) {
  applyShot(kitchen, shot.name, shot.seed);
  frozen = true; // screenshots must not tick while the browser renders
}

// What the mouse is hovering, for the highlight ring: a station id, a
// 'crate:<id>' tag, or null.
function hoverTarget() {
  const { x, y } = input.mouse;
  for (const c of CRATES) {
    if (x >= c.x - 6 && x <= c.x + c.w + 6 && y >= c.y - 6 && y <= c.y + c.h + 6) return `crate:${c.id}`;
  }
  for (const [id, s] of Object.entries(STATIONS)) {
    if (x >= s.x - 6 && x <= s.x + s.w + 6 && y >= s.y - 6 && y <= s.y + s.h + 6) return id;
  }
  return null;
}

function stationAtPoint(x, y) {
  for (const c of CRATES) {
    if (x >= c.x - 6 && x <= c.x + c.w + 6 && y >= c.y - 6 && y <= c.y + c.h + 6) {
      return { x: c.ix, y: c.iy, action: { kind: 'crate', id: c.id } };
    }
  }
  for (const [id, s] of Object.entries(STATIONS)) {
    if (x >= s.x - 6 && x <= s.x + s.w + 6 && y >= s.y - 6 && y <= s.y + s.h + 6) {
      return { x: s.ix, y: s.iy, action: { kind: 'station', id } };
    }
  }
  return null;
}

function handleClick(x, y) {
  if (kitchen.screen === 'title') {
    if (x >= 490 && x <= 790 && y >= 528 && y <= 580) {
      initAudio();
      startDay(kitchen);
      sfx.startDay();
    }
    return;
  }
  if (kitchen.screen === 'over') {
    if (x >= 490 && x <= 790 && y >= 490 && y <= 542) {
      startDay(kitchen);
      sfx.startDay();
    }
    return;
  }
  const hit = stationAtPoint(x, y);
  if (hit) {
    kitchen.walkTarget = hit;
  } else if (y > 300) {
    // Clicking the open floor just walks there.
    kitchen.walkTarget = { x, y: Math.max(308, Math.min(VIEW.height - 28, y)), action: null };
  }
}

function playEventSounds() {
  for (const e of kitchen.events) {
    if (e.type === 'order-in') sfx.orderIn();
    else if (e.type === 'pickup') sfx.pickup();
    else if (e.type === 'drop') sfx.drop();
    else if (e.type === 'chop') sfx.chop();
    else if (e.type === 'chop-done') sfx.chopDone();
    else if (e.type === 'grill-done') sfx.grillDone();
    else if (e.type === 'serve') sfx.serve();
    else if (e.type === 'error') sfx.error();
    else if (e.type === 'tick') sfx.tick();
    else if (e.type === 'burnt') sfx.burnt();
    else if (e.type === 'start-day') sfx.startDay();
    else if (e.type === 'day-over') sfx.dayOver();
  }
  kitchen.events = [];
  if (kitchen.stove.item && !kitchen.stove.done) startSizzle();
  else stopSizzle();
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!frozen) {
    if (input.wasPressed('mute')) {
      const muted = toggleMute();
      kitchen.message = muted ? 'Sound off (M to turn back on).' : 'Sound on.';
      kitchen.messageAt = kitchen.now;
    }
    if (kitchen.screen === 'title' && (input.wasPressed('confirm'))) {
      initAudio();
      startDay(kitchen);
      sfx.startDay();
    } else if (kitchen.screen === 'over' && input.wasPressed('restart')) {
      startDay(kitchen);
      sfx.startDay();
    } else if (kitchen.screen === 'play') {
      if (input.wasPressed('act')) interact(kitchen);
      if (input.mouse.clicked) handleClick(input.mouse.clickX, input.mouse.clickY);
      updateKitchen(kitchen, input, dt);
    } else if (input.mouse.clicked) {
      handleClick(input.mouse.clickX, input.mouse.clickY);
    }
    playEventSounds();
  }

  render(ctx, kitchen, hoverTarget());
  input.endFrame();
  requestAnimationFrame(frame);
}

// A handle for scripted play-tests: window.__sizzle exposes the live state
// and the same actions a player has, so an automated test can drive the game.
window.__sizzle = {
  kitchen,
  start: () => startDay(kitchen),
  interact: () => interact(kitchen),
  version: 'sizzle-rush-1',
};

requestAnimationFrame(frame);
