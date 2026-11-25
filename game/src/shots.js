// Sizzle Rush — shots: deterministic staged states for screenshots.
// ?shot=start|play|mid|end&seed=1 jumps the game into a fixed scene built
// from the game's own state, with the clock frozen so every render is
// identical. These are real renders of the game's code, not pictures.

import { createKitchen, startDay } from './kitchen.js';
import { spawnOrder } from './orders.js';
import { makeRng } from './config.js';

function baseKitchen(seed) {
  const rng = makeRng(seed);
  const k = createKitchen(rng);
  startDay(k);
  k.events = [];
  k.now = 12; // a fixed moment, so flames and blinking sit still
  return k;
}

export function applyShot(k, name, seed) {
  const rng = makeRng(seed);
  if (name === 'start') {
    const fresh = createKitchen(rng);
    Object.assign(k, fresh);
    k.screen = 'title';
    return k;
  }
  if (name === 'play') {
    const fresh = baseKitchen(seed);
    Object.assign(k, fresh);
    const o = spawnOrder(k.orders, k.now);
    o.recipe = { id: 'burger', name: 'Cheesy Burger', price: 140, needs: ['bun', 'patty', 'cheese'], color: '#e8b25c' };
    o.timeLeft = 31;
    o.total = 42;
    k.orders.score = 250;
    k.orders.combo = 2;
    k.orders.served = 2;
    k.dayTimeLeft = 96;
    // A patty on the grill, a tomato mid-chop, and the cook carrying lettuce.
    k.stove.item = { id: 'patty', prepped: false, burnt: false };
    k.stove.progress = 0.55;
    k.board.item = { id: 'tomato', prepped: false, burnt: false };
    k.board.progress = 0.4;
    k.cook.x = 470;
    k.cook.y = 480;
    k.carry = { id: 'lettuce', prepped: false, burnt: false };
    k.message = 'Chopping Tomato…';
    k.messageAt = k.now;
    return k;
  }
  if (name === 'mid') {
    const fresh = baseKitchen(seed);
    Object.assign(k, fresh);
    const o = spawnOrder(k.orders, k.now);
    o.recipe = { id: 'burger', name: 'Cheesy Burger', price: 140, needs: ['bun', 'patty', 'cheese'], color: '#e8b25c' };
    o.timeLeft = 24;
    o.total = 42;
    const o2 = spawnOrder(k.orders, k.now);
    o2.recipe = { id: 'salad', name: 'Garden Salad', price: 100, needs: ['tomato', 'lettuce'], color: '#5fb84a' };
    o2.timeLeft = 38;
    o2.total = 42;
    k.orders.score = 390;
    k.orders.combo = 3;
    k.orders.served = 3;
    k.dayTimeLeft = 71;
    // The burger is two-thirds built on the plate; the cook brings the cheese.
    k.plate = ['bun', 'patty'];
    k.cook.x = 900;
    k.cook.y = 420;
    k.carry = { id: 'cheese', prepped: false, burnt: false };
    k.message = 'One more — add the cheese to finish the Cheesy Burger!';
    k.messageAt = k.now;
    return k;
  }
  if (name === 'end') {
    const fresh = baseKitchen(seed);
    Object.assign(k, fresh);
    k.screen = 'over';
    k.orders.score = 1240;
    k.orders.served = 9;
    k.orders.expired = 2;
    k.orders.bestCombo = 5;
    k.orders.combo = 0;
    k.dayTimeLeft = 0;
    return k;
  }
  return k;
}

// The shot parameter, if any: { name, seed } or null.
export function readShotParams() {
  const q = new URLSearchParams(window.location.search);
  const name = q.get('shot');
  if (!name) return null;
  const seed = Number(q.get('seed') ?? '1') || 1;
  return { name, seed };
}
