// Sizzle Rush — config: canvas size, ingredients, recipes, stations and tuning.
// Everything the rest of the game needs to know about the kitchen lives here,
// so balancing the game means editing this file, not the logic.

export const VIEW = { width: 1280, height: 800 };

// One dinner rush lasts this long (seconds). Orders keep coming until it ends.
export const DAY_LENGTH = 150;
export const ORDER_SPAWN_EVERY = 14;
export const MAX_ACTIVE_ORDERS = 3;
export const ORDER_TIME = 42;

export const SCORE = {
  serveBase: 100,
  timeBonusPerSecond: 2,
  comboStep: 15,
  expiredPenalty: 25,
};

// Ingredients. `prep` says what station turns the raw item into its usable
// form: 'chop' at the board, 'grill' at the stove, 'none' needs no prep.
export const INGREDIENTS = {
  tomato: { label: 'Tomato', short: 'TOM', color: '#e5484d', dark: '#a92c30', prep: 'chop', prepTime: 1.6, preppedLabel: 'Chopped Tomato' },
  lettuce: { label: 'Lettuce', short: 'LET', color: '#5fb84a', dark: '#3a7d2c', prep: 'chop', prepTime: 1.4, preppedLabel: 'Chopped Lettuce' },
  cheese: { label: 'Cheese', short: 'CHS', color: '#f5b81d', dark: '#c78d08', prep: 'none', prepTime: 0, preppedLabel: 'Cheese' },
  patty: { label: 'Patty', short: 'PAT', color: '#9a5b3c', dark: '#6e3d24', prep: 'grill', prepTime: 3.2, preppedLabel: 'Grilled Patty' },
  bun: { label: 'Bun', short: 'BUN', color: '#e8b25c', dark: '#b57f2e', prep: 'none', prepTime: 0, preppedLabel: 'Bun' },
};

// A recipe is a dish name plus the set of prepped items the plate must hold.
// `needs` uses the prepped item id: 'tomato' means chopped tomato, 'patty'
// means grilled patty, 'cheese' and 'bun' need no prep so they stay as-is.
export const RECIPES = [
  { id: 'salad', name: 'Garden Salad', price: 100, needs: ['tomato', 'lettuce'], color: '#5fb84a' },
  { id: 'burger', name: 'Cheesy Burger', price: 140, needs: ['bun', 'patty', 'cheese'], color: '#e8b25c' },
  { id: 'melt', name: 'Sunny Melt', price: 120, needs: ['bun', 'cheese', 'tomato'], color: '#f5b81d' },
  { id: 'classic', name: 'Classic Burger', price: 130, needs: ['bun', 'patty', 'lettuce'], color: '#c97b4a' },
];

// Where each station sits on the floor (x, y, w, h) and where the cook stands
// to use it (ix, iy). The floor runs from y=150 down to the bottom edge.
export const STATIONS = {
  board: { name: 'Chopping Board', x: 300, y: 180, w: 170, h: 96, ix: 385, iy: 320, kind: 'chop', hint: 'Chop here' },
  stove: { name: 'Grill Stove', x: 560, y: 180, w: 200, h: 96, ix: 660, iy: 320, kind: 'grill', hint: 'Grill here' },
  plate: { name: 'Plating Counter', x: 860, y: 180, w: 210, h: 96, ix: 965, iy: 320, kind: 'plate', hint: 'Assemble here' },
  window: { name: 'Serve Window', x: 1120, y: 180, w: 130, h: 120, ix: 1185, iy: 340, kind: 'serve', hint: 'Serve here' },
  trash: { name: 'Trash Bin', x: 60, y: 430, w: 90, h: 80, ix: 105, iy: 540, kind: 'trash', hint: 'Toss it' },
};

// Ingredient crates along the bottom counter: the cook picks raw items here.
export const CRATES = [
  { id: 'tomato', x: 60, y: 648, w: 96, h: 84, ix: 108, iy: 620 },
  { id: 'lettuce', x: 172, y: 648, w: 96, h: 84, ix: 220, iy: 620 },
  { id: 'cheese', x: 284, y: 648, w: 96, h: 84, ix: 332, iy: 620 },
  { id: 'patty', x: 396, y: 648, w: 96, h: 84, ix: 444, iy: 620 },
  { id: 'bun', x: 508, y: 648, w: 96, h: 84, ix: 556, iy: 620 },
];

export const COOK = { speed: 300, radius: 24, startX: 640, startY: 520 };

// Seeded random (mulberry32) so screenshot shots are deterministic.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
