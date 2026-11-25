// Sizzle Rush — render: everything drawn on the canvas, from the tiled
// kitchen floor to the order tickets, the cook and the title/day-over
// screens. All art is drawn shapes — no image files, no fonts to fetch.

import { VIEW, INGREDIENTS, STATIONS, CRATES } from './config.js';
import { plateMatchesRecipe } from './orders.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

// --- ingredient icons -------------------------------------------------------

export function drawIngredient(ctx, id, x, y, size, prepped = false, burnt = false) {
  const def = INGREDIENTS[id];
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (burnt) {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.9); ctx.quadraticCurveTo(-s * 0.6, -s * 1.4, -s * 0.3, -s * 1.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.9); ctx.quadraticCurveTo(s * 0.5, -s * 1.4, s * 0.2, -s * 1.6); ctx.stroke();
    ctx.restore();
    return;
  }
  if (id === 'tomato') {
    if (prepped) {
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(-s * 0.35, 0, s * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.35, 0, s * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd9d9';
      ctx.beginPath(); ctx.arc(-s * 0.35, 0, s * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.35, 0, s * 0.28, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = def.dark;
      ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.25, s * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a7d2c';
      ctx.beginPath(); ctx.ellipse(0, -s * 0.95, s * 0.45, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = def.color;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse((i - 1) * s * 0.45, (i % 2 ? 2 : -2), s * 0.55, s * 0.7, (i - 1) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = def.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.lineTo(0, s * 0.6); ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.7); ctx.lineTo(0, -s * 0.9); ctx.lineTo(s, s * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(-s * 0.25, s * 0.2, s * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.3, s * 0.35, s * 0.11, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = prepped ? '#7a4a2b' : def.color;
    rr(ctx, -s, -s * 0.55, s * 2, s * 1.1, s * 0.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.arc(-s * 0.4, 0, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
    if (prepped) {
      ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.75); ctx.lineTo(-s * 0.3, -s * 0.95); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.75); ctx.lineTo(s * 0.6, -s * 0.95); ctx.stroke();
    }
  } else if (id === 'bun') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = def.dark;
    rr(ctx, -s * 0.95, s * 0.05, s * 1.9, s * 0.35, s * 0.15);
    ctx.fill();
    ctx.fillStyle = '#fff3d0';
    ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.45, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.25, -s * 0.55, s * 0.1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
}

// --- the kitchen -----------------------------------------------------------

function drawFloor(ctx, now) {
  ctx.fillStyle = '#c98f5f';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Checker tiles.
  for (let ty = 0; ty < 9; ty++) {
    for (let tx = 0; tx < 16; tx++) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(tx * 80, 140 + ty * 76, 80, 76);
      }
    }
  }
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(0, 140, VIEW.width, 6);
  // Wall band with a menu poster.
  ctx.fillStyle = '#f3e2c7';
  ctx.fillRect(0, 0, VIEW.width, 140);
  ctx.fillStyle = '#e8d3ae';
  ctx.fillRect(0, 128, VIEW.width, 12);
  text(ctx, 'SIZZLE RUSH', 24, 46, 30, '#b3541e', 'bold');
  text(ctx, '— tiny kitchen, big dinner rush —', 24, 74, 15, '#8a6d4b', 'normal');
}

function drawOrderBoard(ctx, orders, now) {
  const x0 = 330, y0 = 14, w = 700, h = 112;
  ctx.fillStyle = '#5b3a29';
  rr(ctx, x0 - 8, y0 - 6, w + 16, h + 12, 12);
  ctx.fill();
  ctx.fillStyle = '#fff8ec';
  rr(ctx, x0, y0, w, h, 8);
  ctx.fill();
  text(ctx, 'ORDER BOARD', x0 + 14, y0 + 22, 14, '#b3541e');
  if (!orders.active.length) {
    text(ctx, 'No orders yet — the dinner rush is coming…', x0 + 14, y0 + 66, 17, '#8a6d4b', 'normal');
    return;
  }
  orders.active.forEach((o, i) => {
    const tx = x0 + 14 + i * 222, ty = y0 + 30, tw = 208, th = 74;
    const urgent = o.timeLeft <= 10;
    ctx.fillStyle = urgent && Math.floor(now * 2) % 2 === 0 ? '#ffe3e3' : '#fff';
    rr(ctx, tx, ty, tw, th, 8);
    ctx.fill();
    ctx.strokeStyle = o.recipe.color;
    ctx.lineWidth = 3;
    rr(ctx, tx, ty, tw, th, 8);
    ctx.stroke();
    text(ctx, `#${o.id} ${o.recipe.name}`, tx + 10, ty + 20, 14, '#3a2a1e');
    o.recipe.needs.forEach((need, j) => {
      drawIngredient(ctx, need, tx + 22 + j * 34, ty + 44, 26, true);
    });
    // Timer bar.
    const frac = Math.max(0, o.timeLeft / o.total);
    ctx.fillStyle = '#e8ddd0';
    rr(ctx, tx + 10, ty + 60, tw - 20, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#5fb84a' : frac > 0.25 ? '#f5b81d' : '#e5484d';
    rr(ctx, tx + 10, ty + 60, (tw - 20) * frac, 8, 4);
    ctx.fill();
    text(ctx, `${Math.ceil(o.timeLeft)}s`, tx + tw - 12, ty + 20, 13, urgent ? '#e5484d' : '#8a6d4b', 'bold', 'right');
  });
}

function drawHud(ctx, k) {
  const x0 = 1050, y0 = 14;
  ctx.fillStyle = '#5b3a29';
  rr(ctx, x0 - 8, y0 - 6, 214, 124, 12);
  ctx.fill();
  ctx.fillStyle = '#fff8ec';
  rr(ctx, x0, y0, 198, 112, 8);
  ctx.fill();
  text(ctx, 'SCORE', x0 + 14, y0 + 24, 13, '#b3541e');
  text(ctx, `${k.orders.score}`, x0 + 14, y0 + 52, 28, '#3a2a1e');
  text(ctx, `COMBO ×${k.orders.combo}`, x0 + 120, y0 + 24, 13, '#b3541e', 'bold', 'left');
  // Day timer.
  const frac = Math.max(0, k.dayTimeLeft / 150);
  const mins = Math.floor(k.dayTimeLeft / 60), secs = Math.floor(k.dayTimeLeft % 60);
  text(ctx, `DAY TIMER  ${mins}:${String(secs).padStart(2, '0')}`, x0 + 14, y0 + 78, 14, '#3a2a1e');
  ctx.fillStyle = '#e8ddd0';
  rr(ctx, x0 + 14, y0 + 88, 170, 10, 5);
  ctx.fill();
  ctx.fillStyle = frac > 0.3 ? '#5fb84a' : '#e5484d';
  rr(ctx, x0 + 14, y0 + 88, 170 * frac, 10, 5);
  ctx.fill();
  text(ctx, `Served ${k.orders.served} · Lost ${k.orders.expired}`, x0 + 14, y0 + 106, 12, '#8a6d4b', 'normal');
}

function drawStation(ctx, k, id, highlight) {
  const s = STATIONS[id];
  ctx.save();
  if (highlight) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 12);
    ctx.stroke();
  }
  if (id === 'board') {
    ctx.fillStyle = '#a9805a';
    rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
    ctx.fillStyle = '#e8d3ae';
    rr(ctx, s.x + 14, s.y + 14, s.w - 28, s.h - 28, 8); ctx.fill();
    text(ctx, 'CHOPPING BOARD', s.x + s.w / 2, s.y + 34, 13, '#8a6d4b', 'bold', 'center');
    if (k.board.item) {
      drawIngredient(ctx, k.board.item.id, s.x + s.w / 2, s.y + 62, 40, k.board.item.prepped, k.board.item.burnt);
      if (!k.board.done) drawProgressRing(ctx, s.x + s.w / 2, s.y + 62, 28, k.board.progress, '#5fb84a');
      else text(ctx, 'READY!', s.x + s.w / 2, s.y + 92, 12, '#3a7d2c', 'bold', 'center');
    } else {
      text(ctx, 'drop tomato / lettuce', s.x + s.w / 2, s.y + 62, 12, '#b59a7a', 'normal', 'center');
    }
  } else if (id === 'stove') {
    ctx.fillStyle = '#4a4a52';
    rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
    ctx.fillStyle = '#2e2e33';
    ctx.beginPath(); ctx.arc(s.x + 55, s.y + 48, 26, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x + 145, s.y + 48, 26, 0, Math.PI * 2); ctx.fill();
    // Flame under the left burner while something grills.
    if (k.stove.item && !k.stove.done) {
      const flick = 1 + Math.sin(k.now * 14) * 0.15;
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.ellipse(s.x + 55, s.y + 48, 20 * flick, 12 * flick, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5714';
      ctx.beginPath();
      ctx.ellipse(s.x + 55, s.y + 48, 12 * flick, 7 * flick, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, 'GRILL STOVE', s.x + s.w / 2, s.y + 20, 13, '#cfcfd6', 'bold', 'center');
    if (k.stove.item) {
      drawIngredient(ctx, k.stove.item.id, s.x + 55, s.y + 48, 36, k.stove.item.prepped, k.stove.item.burnt);
      if (!k.stove.done) drawProgressRing(ctx, s.x + 55, s.y + 48, 26, k.stove.progress, '#ff9f1c');
      else if (k.stove.item.burnt) text(ctx, 'BURNT!', s.x + 145, s.y + 52, 13, '#e5484d', 'bold', 'center');
      else text(ctx, 'READY!', s.x + 145, s.y + 52, 13, '#ffd166', 'bold', 'center');
    } else {
      text(ctx, 'patty goes here', s.x + 145, s.y + 52, 12, '#8a8a94', 'normal', 'center');
    }
  } else if (id === 'plate') {
    // The plating counter is drawn by drawPlateCounter below.
  }
  ctx.restore();
}

export function render(ctx, k, hover) {
  drawFloor(ctx, k.now);
  drawOrderBoard(ctx, k.orders, k.now);
  drawHud(ctx, k);
  if (k.screen === 'title') { drawTitle(ctx, k); return; }
  if (k.screen === 'over') { drawDayOver(ctx, k); return; }

  const near = hover;
  for (const id of Object.keys(STATIONS)) drawStation(ctx, k, id, near === id);
  drawPlateCounter(ctx, k, near === 'plate');
  drawServeWindow(ctx, k, near === 'window');
  drawTrash(ctx, k, near === 'trash');
  drawCrates(ctx, k, near);
  drawCook(ctx, k);
  drawMessage(ctx, k);
  if (k.orders.lastServe && k.now - k.orders.lastServeAt < 2.2) {
    const ls = k.orders.lastServe;
    ctx.fillStyle = 'rgba(58,125,44,0.92)';
    rr(ctx, VIEW.width / 2 - 170, 150, 340, 44, 10);
    ctx.fill();
    text(ctx, `Served ${ls.name}  +${ls.points}  (combo ×${ls.combo})`, VIEW.width / 2, 179, 18, '#fff', 'bold', 'center');
  }
  // Controls reminder.
  text(ctx, 'WASD / arrows to move · E to use · click a station to walk there · M to mute', 24, VIEW.height - 14, 13, 'rgba(255,255,255,0.85)', 'normal');
}

function drawPlateCounter(ctx, k, highlight) {
  const s = STATIONS.plate;
  if (highlight) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4;
    rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 12); ctx.stroke();
  }
  ctx.fillStyle = '#e8d3ae';
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  text(ctx, 'PLATING COUNTER', s.x + s.w / 2, s.y + 22, 13, '#8a6d4b', 'bold', 'center');
  // The plate.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + 62, 62, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8c8ae'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + 62, 62, 22, 0, 0, Math.PI * 2); ctx.stroke();
  k.plate.forEach((id, i) => {
    drawIngredient(ctx, id, s.x + 62 + i * 36, s.y + 58, 30, true);
  });
  if (k.plate.length) {
    const ready = k.orders.active.some((o) => plateMatchesRecipe(k.plate, o.recipe));
    text(ctx, ready ? 'READY TO SERVE!' : 'assembling…', s.x + s.w / 2, s.y + 92, 12, ready ? '#3a7d2c' : '#8a6d4b', 'bold', 'center');
  } else {
    text(ctx, 'plate is empty', s.x + s.w / 2, s.y + 92, 12, '#b59a7a', 'normal', 'center');
  }
}

function drawServeWindow(ctx, k, highlight) {
  const s = STATIONS.window;
  if (highlight) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4;
    rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 12); ctx.stroke();
  }
  ctx.fillStyle = '#5b3a29';
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.fillStyle = '#ffd166';
  rr(ctx, s.x + 10, s.y + 10, s.w - 20, 30, 6); ctx.fill();
  text(ctx, 'SERVE', s.x + s.w / 2, s.y + 31, 16, '#5b3a29', 'bold', 'center');
  // A little bell on the counter.
  ctx.fillStyle = '#f5b81d';
  ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + 66, 16, Math.PI, 0); ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 18, s.y + 66, 36, 5);
  ctx.fillStyle = '#e5484d';
  ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + 46, 4, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'ring the bell!', s.x + s.w / 2, s.y + 100, 11, '#ffd166', 'normal', 'center');
}

function drawTrash(ctx, k, highlight) {
  const s = STATIONS.trash;
  if (highlight) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4;
    rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 12); ctx.stroke();
  }
  ctx.fillStyle = '#6b7280';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 8); ctx.fill();
  ctx.fillStyle = '#4b5563';
  rr(ctx, s.x + 4, s.y, s.w - 8, 12, 6); ctx.fill();
  text(ctx, 'TRASH', s.x + s.w / 2, s.y + 52, 13, '#e5e7eb', 'bold', 'center');
}

function drawCrates(ctx, k, near) {
  for (const c of CRATES) {
    const def = INGREDIENTS[c.id];
    const isNear = near === `crate:${c.id}`;
    if (isNear) {
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4;
      rr(ctx, c.x - 5, c.y - 5, c.w + 10, c.h + 10, 10); ctx.stroke();
    }
    ctx.fillStyle = '#a9805a';
    rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
    ctx.fillStyle = '#8a5f36';
    rr(ctx, c.x + 6, c.y + 6, c.w - 12, c.h - 12, 6); ctx.fill();
    drawIngredient(ctx, c.id, c.x + c.w / 2, c.y + 34, 44);
    ctx.fillStyle = '#fff8ec';
    rr(ctx, c.x + 8, c.y + c.h - 22, c.w - 16, 16, 4); ctx.fill();
    text(ctx, def.label.toUpperCase(), c.x + c.w / 2, c.y + c.h - 10, 11, '#5b3a29', 'bold', 'center');
  }
  text(ctx, 'INGREDIENTS — grab what the orders need', 60, 640, 14, '#fff', 'bold');
}

function drawCook(ctx, k) {
  const c = k.cook;
  const bob = c.moving ? Math.sin(c.bob) * 3 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 26, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white chef coat and apron.
  ctx.fillStyle = '#f8f8f8';
  rr(ctx, -17, -8, 34, 34, 10); ctx.fill();
  ctx.fillStyle = '#3b82f6';
  rr(ctx, -17, 12, 34, 14, 6); ctx.fill();
  // Head and chef hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -20, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -30, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -34, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -30, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-14, -32, 28, 6);
  // Eyes look the way the cook faces.
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(c.dir * 3 - 4, -20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.dir * 3 + 5, -20, 2, 0, Math.PI * 2); ctx.fill();
  // Carried item held overhead.
  if (k.carry) {
    drawIngredient(ctx, k.carry.id, 0, -58, 34, k.carry.prepped, k.carry.burnt);
  }
  ctx.restore();
}

function drawMessage(ctx, k) {
  if (!k.message) return;
  if (k.now - k.messageAt > 4) return;
  ctx.fillStyle = 'rgba(43,32,20,0.85)';
  const w = Math.min(720, ctx.measureText(k.message).width + 80);
  rr(ctx, VIEW.width / 2 - w / 2, 566, w, 34, 8);
  ctx.fill();
  text(ctx, k.message, VIEW.width / 2, 589, 15, '#ffe9c4', 'normal', 'center');
}

function drawTitle(ctx, k) {
  ctx.fillStyle = 'rgba(43,26,16,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8ec';
  rr(ctx, 290, 150, 700, 470, 18); ctx.fill();
  ctx.strokeStyle = '#b3541e'; ctx.lineWidth = 4;
  rr(ctx, 290, 150, 700, 470, 18); ctx.stroke();
  text(ctx, 'SIZZLE RUSH', 640, 235, 56, '#b3541e', 'bold', 'center');
  text(ctx, 'Run the tiniest kitchen in town.', 640, 275, 20, '#5b3a29', 'normal', 'center');
  const lines = [
    '1. Read the ORDER BOARD — every ticket is a dish with a timer.',
    '2. Grab ingredients from the crates at the bottom.',
    '3. Chop tomato & lettuce on the board, grill the patty on the stove.',
    '4. Stack it all on the PLATE, then serve at the window before time runs out!',
  ];
  lines.forEach((l, i) => text(ctx, l, 340, 330 + i * 32, 17, '#3a2a1e', 'normal'));
  text(ctx, 'WASD / arrows to move · E to use · or just click a station', 640, 490, 16, '#8a6d4b', 'normal', 'center');
  text(ctx, 'One dinner rush: 150 seconds. Serve fast, keep the combo alive!', 640, 518, 16, '#8a6d4b', 'normal', 'center');
  ctx.fillStyle = '#b3541e';
  rr(ctx, 490, 528, 300, 52, 12); ctx.fill();
  text(ctx, 'START THE RUSH  ▶', 640, 562, 20, '#fff', 'bold', 'center');
  text(ctx, 'Press Enter or click START', 640, 602, 13, '#b59a7a', 'normal', 'center');
}

function drawDayOver(ctx, k) {
  ctx.fillStyle = 'rgba(43,26,16,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8ec';
  rr(ctx, 340, 170, 600, 440, 18); ctx.fill();
  ctx.strokeStyle = '#b3541e'; ctx.lineWidth = 4;
  rr(ctx, 340, 170, 600, 440, 18); ctx.stroke();
  text(ctx, 'DAY COMPLETE!', 640, 250, 46, '#b3541e', 'bold', 'center');
  text(ctx, 'The dinner rush is over — the kitchen can breathe.', 640, 288, 17, '#5b3a29', 'normal', 'center');
  text(ctx, `FINAL SCORE  ${k.orders.score}`, 640, 360, 30, '#3a2a1e', 'bold', 'center');
  text(ctx, `Dishes served: ${k.orders.served}    Orders lost: ${k.orders.expired}    Best combo: ×${k.orders.bestCombo}`, 640, 410, 17, '#3a2a1e', 'normal', 'center');
  const verdict = k.orders.served >= 8 ? 'Head Chef material! The town is talking about your kitchen.'
    : k.orders.served >= 4 ? 'A solid service — the regulars will be back.'
    : 'A tough night. Sharpen those knives and try again!';
  text(ctx, verdict, 640, 450, 17, '#8a6d4b', 'normal', 'center');
  ctx.fillStyle = '#b3541e';
  rr(ctx, 490, 490, 300, 52, 12); ctx.fill();
  text(ctx, 'PLAY AGAIN  ↻', 640, 524, 20, '#fff', 'bold', 'center');
  text(ctx, 'Press R or click PLAY AGAIN', 640, 575, 13, '#b59a7a', 'normal', 'center');
}
