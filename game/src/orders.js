// Sizzle Rush — orders: spawning tickets, ticking their timers, matching a
// finished plate against them, and scoring serves. An order is a recipe plus
// a countdown; the plate matches when it holds exactly the recipe's items.

import { RECIPES, ORDER_TIME, MAX_ACTIVE_ORDERS, ORDER_SPAWN_EVERY, SCORE, pickFrom } from './config.js';

let nextOrderId = 1;

export function createOrders(rng) {
  return {
    rng,
    active: [],
    spawnIn: 1.5,
    served: 0,
    expired: 0,
    combo: 0,
    bestCombo: 0,
    score: 0,
    lastServe: null, // { name, points, combo } for the floating banner
    lastServeAt: 0,
  };
}

export function spawnOrder(orders, now) {
  const recipe = pickFrom(orders.rng, RECIPES);
  const order = {
    id: nextOrderId++,
    recipe,
    timeLeft: ORDER_TIME,
    total: ORDER_TIME,
    bornAt: now,
  };
  orders.active.push(order);
  return order;
}

export function updateOrders(orders, dt, now, events) {
  orders.spawnIn -= dt;
  if (orders.spawnIn <= 0 && orders.active.length < MAX_ACTIVE_ORDERS) {
    spawnOrder(orders, now);
    orders.spawnIn = ORDER_SPAWN_EVERY;
    events.push({ type: 'order-in' });
  }
  for (let i = orders.active.length - 1; i >= 0; i--) {
    const o = orders.active[i];
    o.timeLeft -= dt;
    if (o.timeLeft <= 10 && !o.warned) {
      o.warned = true;
      events.push({ type: 'tick' });
    }
    if (o.timeLeft <= 0) {
      orders.active.splice(i, 1);
      orders.expired++;
      orders.combo = 0;
      orders.score = Math.max(0, orders.score - SCORE.expiredPenalty);
      events.push({ type: 'expired', name: o.recipe.name });
    }
  }
}

// Does this plate hold exactly what the recipe asks for? Order of items
// does not matter; extra or missing items break the match.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const have = [...plateItems].sort();
  const want = [...recipe.needs].sort();
  return have.every((item, i) => item === want[i]);
}

export function findMatchingOrder(orders, plateItems) {
  return orders.active.find((o) => plateMatchesRecipe(plateItems, o.recipe)) ?? null;
}

// Serve the plate to the first order it matches. Returns the points earned,
// or 0 when no open order wants this plate.
export function servePlate(orders, plateItems, now) {
  const order = findMatchingOrder(orders, plateItems);
  if (!order) return 0;
  const timeBonus = Math.round(order.timeLeft * SCORE.timeBonusPerSecond);
  const comboBonus = orders.combo * SCORE.comboStep;
  const points = order.recipe.price + timeBonus + comboBonus;
  orders.active.splice(orders.active.indexOf(order), 1);
  orders.served++;
  orders.combo++;
  orders.bestCombo = Math.max(orders.bestCombo, orders.combo);
  orders.score += points;
  orders.lastServe = { name: order.recipe.name, points, combo: orders.combo };
  orders.lastServeAt = now;
  return points;
}
