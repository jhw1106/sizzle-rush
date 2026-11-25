// Sizzle Rush — kitchen: the game state, the cook's movement, and every
// station interaction. One item in hand at a time; raw items are prepped on
// the board (chop) or the stove (grill), assembled on the plate, and served
// at the window when the plate matches an open order.

import {
  VIEW, COOK, STATIONS, CRATES, INGREDIENTS, DAY_LENGTH,
} from './config.js';
import { createOrders, updateOrders, servePlate, findMatchingOrder } from './orders.js';

export function createKitchen(rng) {
  return {
    rng,
    screen: 'title', // 'title' | 'play' | 'over'
    now: 0,
    dayTimeLeft: DAY_LENGTH,
    cook: { x: COOK.startX, y: COOK.startY, dir: 1, moving: false, bob: 0 },
    carry: null, // { id, prepped, burnt } or null
    board: { item: null, progress: 0, done: false }, // chopping board slot
    stove: { item: null, progress: 0, done: false, burnIn: 0 }, // grill slot
    plate: [], // item ids sitting on the plating counter
    orders: createOrders(rng),
    events: [], // { type, ... } consumed by main.js for sounds and banners
    message: null, // { text, at } short hint shown under the HUD
    messageAt: 0,
    walkTarget: null, // { x, y, action } mouse-set destination
    servedFlash: 0,
    muted: false,
  };
}

export function startDay(k) {
  k.screen = 'play';
  k.now = 0;
  k.dayTimeLeft = DAY_LENGTH;
  k.cook.x = COOK.startX;
  k.cook.y = COOK.startY;
  k.carry = null;
  k.board = { item: null, progress: 0, done: false };
  k.stove = { item: null, progress: 0, done: false, burnIn: 0 };
  k.plate = [];
  k.orders = createOrders(k.rng);
  k.events = [];
  k.message = null;
  k.walkTarget = null;
  k.servedFlash = 0;
  k.events.push({ type: 'start-day' });
}

function say(k, text) {
  k.message = text;
  k.messageAt = k.now;
}

// Distance from the cook to an interaction point.
function near(k, ix, iy) {
  const dx = k.cook.x - ix, dy = k.cook.y - iy;
  return dx * dx + dy * dy < 78 * 78;
}

// What the cook is standing next to, nearest first. Returns
// { kind: 'crate'|'station', id } or null.
export function nearestUsable(k) {
  let best = null, bestD = Infinity;
  for (const c of CRATES) {
    const d = (k.cook.x - c.ix) ** 2 + (k.cook.y - c.iy) ** 2;
    if (d < bestD && d < 78 * 78) { best = { kind: 'crate', id: c.id }; bestD = d; }
  }
  for (const [id, s] of Object.entries(STATIONS)) {
    const d = (k.cook.x - s.ix) ** 2 + (k.cook.y - s.iy) ** 2;
    if (d < bestD && d < 78 * 78) { best = { kind: 'station', id }; bestD = d; }
  }
  return best;
}

function takeFromBoard(k) {
  const item = k.board.item;
  k.board = { item: null, progress: 0, done: false };
  k.carry = item;
  k.events.push({ type: 'pickup' });
  say(k, item.prepped ? `${INGREDIENTS[item.id].preppedLabel} — take it to the plate!` : `${INGREDIENTS[item.id].label} back in hand.`);
}

function takeFromStove(k) {
  const item = k.stove.item;
  k.stove = { item: null, progress: 0, done: false, burnIn: 0 };
  k.carry = item;
  if (item.burnt) {
    k.events.push({ type: 'burnt' });
    say(k, 'Burnt! Toss it in the trash.');
  } else {
    k.events.push({ type: 'pickup' });
    say(k, item.prepped ? `${INGREDIENTS[item.id].preppedLabel} — take it to the plate!` : `${INGREDIENTS[item.id].label} back in hand.`);
  }
}

// The context action: what E (or a click on arrival) does right now.
export function interact(k, target) {
  if (k.screen !== 'play') return;
  const use = target ?? nearestUsable(k);
  if (!use) { say(k, 'Walk up to a counter or station, then press E.'); return; }

  if (use.kind === 'crate') {
    if (k.carry) { k.events.push({ type: 'error' }); say(k, 'Hands full! Put something down first.'); return; }
    k.carry = { id: use.id, prepped: false, burnt: false };
    k.events.push({ type: 'pickup' });
    const def = INGREDIENTS[use.id];
    say(k, def.prep === 'none'
      ? `${def.label} — ready for the plate!`
      : `${def.label} — needs the ${def.prep === 'chop' ? 'chopping board' : 'grill'} first.`);
    return;
  }

  const station = STATIONS[use.id];
  if (use.id === 'board') {
    if (k.board.item) { takeFromBoard(k); return; }
    if (!k.carry) { say(k, 'Bring something choppable to the board.'); return; }
    const def = INGREDIENTS[k.carry.id];
    if (k.carry.prepped || def.prep !== 'chop') {
      k.events.push({ type: 'error' });
      say(k, `${def.label} doesn't need chopping.`);
      return;
    }
    k.board.item = k.carry;
    k.carry = null;
    k.events.push({ type: 'chop-start' });
    say(k, `Chopping ${def.label}…`);
    return;
  }

  if (use.id === 'stove') {
    if (k.stove.item) { takeFromStove(k); return; }
    if (!k.carry) { say(k, 'Bring a patty to the grill.'); return; }
    const def = INGREDIENTS[k.carry.id];
    if (k.carry.prepped || def.prep !== 'grill') {
      k.events.push({ type: 'error' });
      say(k, `${def.label} doesn't go on the grill.`);
      return;
    }
    k.stove.item = k.carry;
    k.carry = null;
    k.events.push({ type: 'grill-start' });
    say(k, `Grilling ${def.label}… don't let it burn!`);
    return;
  }

  if (use.id === 'plate') {
    if (k.carry) {
      const def = INGREDIENTS[k.carry.id];
      if (!k.carry.prepped && def.prep !== 'none') {
        k.events.push({ type: 'error' });
        say(k, `${def.label} still needs ${def.prep === 'chop' ? 'chopping' : 'grilling'} first!`);
        return;
      }
      if (k.carry.burnt) { k.events.push({ type: 'error' }); say(k, "That's burnt — trash it!"); return; }
      k.plate.push(k.carry.id);
      k.carry = null;
      k.events.push({ type: 'drop' });
      const match = findMatchingOrder(k.orders, k.plate);
      say(k, match ? `${match.recipe.name} is complete — serve it at the window!` : 'Added to the plate.');
      return;
    }
    if (k.plate.length) {
      k.carry = { id: k.plate.pop(), prepped: true, burnt: false };
      k.events.push({ type: 'pickup' });
      say(k, 'Took it back off the plate.');
      return;
    }
    say(k, 'The plate is empty — bring ingredients here.');
    return;
  }

  if (use.id === 'window') {
    if (!k.plate.length) { say(k, 'Nothing plated yet — assemble a dish first.'); return; }
    const points = servePlate(k.orders, k.plate, k.now);
    if (points > 0) {
      k.plate = [];
      k.servedFlash = k.now;
      k.events.push({ type: 'serve', points });
      say(k, `Served! +${points} points.`);
    } else {
      k.events.push({ type: 'error' });
      say(k, 'No open order wants this plate — check the order board!');
    }
    return;
  }

  if (use.id === 'trash') {
    if (k.carry) {
      k.carry = null;
      k.events.push({ type: 'drop' });
      say(k, 'Tossed it.');
      return;
    }
    say(k, 'Nothing in hand to toss.');
  }
}

function tickStation(k, slot, def, dt, onDone) {
  if (!slot.item || slot.done) return;
  slot.progress += dt / def.prepTime;
  if (slot.progress >= 1) {
    slot.progress = 1;
    slot.done = true;
    slot.item.prepped = true;
    onDone();
  }
}

export function updateKitchen(k, input, dt) {
  if (k.screen !== 'play') return;
  k.now += dt;
  k.dayTimeLeft -= dt;

  // Chopping and grilling run on their own once an item is placed.
  if (k.board.item) {
    const def = INGREDIENTS[k.board.item.id];
    const was = k.board.progress;
    tickStation(k, k.board, def, dt, () => k.events.push({ type: 'chop-done' }));
    if (k.board.item && Math.floor(k.board.progress * 4) !== Math.floor(was * 4)) {
      k.events.push({ type: 'chop' });
    }
  }
  if (k.stove.item) {
    const def = INGREDIENTS[k.stove.item.id];
    if (!k.stove.done) {
      tickStation(k, k.stove, def, dt, () => {
        k.events.push({ type: 'grill-done' });
        k.stove.burnIn = 5;
      });
    } else if (!k.stove.item.burnt) {
      k.stove.burnIn -= dt;
      if (k.stove.burnIn <= 0) {
        k.stove.item.burnt = true;
        k.events.push({ type: 'burnt' });
        say(k, 'The patty burnt! Take it off the grill.');
      }
    }
  }

  updateOrders(k.orders, dt, k.now, k.events);

  // Movement: keyboard wins over a mouse walk target.
  const mv = input.moveVector();
  let moving = false;
  if (mv.dx || mv.dy) {
    k.walkTarget = null;
    k.cook.x += mv.dx * COOK.speed * dt;
    k.cook.y += mv.dy * COOK.speed * dt;
    if (mv.dx) k.cook.dir = mv.dx > 0 ? 1 : -1;
    moving = true;
  } else if (k.walkTarget) {
    const t = k.walkTarget;
    const dx = t.x - k.cook.x, dy = t.y - k.cook.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      k.walkTarget = null;
      if (t.action) interact(k, t.action);
    } else {
      const step = Math.min(dist, COOK.speed * dt);
      k.cook.x += (dx / dist) * step;
      k.cook.y += (dy / dist) * step;
      if (dx) k.cook.dir = dx > 0 ? 1 : -1;
      moving = true;
    }
  }
  k.cook.moving = moving;
  if (moving) k.cook.bob += dt * 12;

  // Keep the cook on the floor, below the station row.
  k.cook.x = Math.max(28, Math.min(VIEW.width - 28, k.cook.x));
  k.cook.y = Math.max(308, Math.min(VIEW.height - 28, k.cook.y));

  if (k.dayTimeLeft <= 0) {
    k.dayTimeLeft = 0;
    k.screen = 'over';
    k.events.push({ type: 'day-over' });
  }
}
