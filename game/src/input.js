// Sizzle Rush — input: keyboard (WASD/arrows + E) and mouse (click to walk,
// click a station to use it). Keeps one frame of "pressed" edges so actions
// fire once per key press or click, not every frame the key is held.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const input = {
    keys,
    pressed,
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
    // A walk target the mouse set; null when the player drives with keys.
    walkTarget: null,
  };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    KeyE: 'act', Space: 'act',
    KeyR: 'restart', KeyM: 'mute', Enter: 'confirm',
  };

  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (!e.repeat) pressed.add(action);
    keys.add(action);
  });
  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  });
  window.addEventListener('blur', () => { keys.clear(); input.walkTarget = null; });

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPos(e);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
  });
  canvas.addEventListener('click', (e) => {
    const p = canvasPos(e);
    input.mouse.clicked = true;
    input.mouse.clickX = p.x;
    input.mouse.clickY = p.y;
  });

  // Call once per frame after the game has read the edges.
  input.endFrame = function () {
    pressed.clear();
    input.mouse.clicked = false;
  };

  input.wasPressed = function (action) {
    return pressed.has(action);
  };

  input.moveVector = function () {
    let dx = 0, dy = 0;
    if (keys.has('left')) dx -= 1;
    if (keys.has('right')) dx += 1;
    if (keys.has('up')) dy -= 1;
    if (keys.has('down')) dy += 1;
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    return { dx, dy };
  };

  return input;
}
