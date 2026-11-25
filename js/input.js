/* Touch + keyboard input. One local player per device.
   Phone: left-half virtual stick, right-side action buttons.
   Desktop: WASD / arrows to move, J punch, K kick, L dash, Space super. */

const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  punch: ['KeyJ'],
  kick: ['KeyK'],
  dash: ['KeyL'],
  super: ['Space']
};

export function createInput(doc = document) {
  const held = new Set();
  const state = {
    mx: 0,
    my: 0,
    punch: false,
    kick: false,
    dash: false,
    superQueued: false
  };

  const touch = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  const buttons = { punch: false, kick: false, dash: false };

  const stickEl = doc.getElementById('stick');
  const knobEl = doc.getElementById('stick-knob');
  const stickZone = doc.getElementById('stick-zone');
  const RADIUS = 52;

  function setKnob(dx, dy) {
    if (!knobEl) return;
    knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  const hintEl = doc.getElementById('stick-hint');

  function showStick(on, ox = 0, oy = 0) {
    if (!stickEl) return;
    stickEl.classList.toggle('visible', on);
    if (hintEl) hintEl.classList.toggle('hidden', on);
    if (on) {
      stickEl.style.left = `${ox}px`;
      stickEl.style.top = `${oy}px`;
      setKnob(0, 0);
    }
  }

  if (stickZone) {
    stickZone.addEventListener('pointerdown', (e) => {
      if (touch.active) return;
      touch.active = true;
      touch.id = e.pointerId;
      const r = stickZone.getBoundingClientRect();
      touch.ox = e.clientX;
      touch.oy = e.clientY;
      touch.baseX = e.clientX - r.left;
      touch.baseY = e.clientY - r.top;
      showStick(true, touch.baseX, touch.baseY);
      stickZone.setPointerCapture(e.pointerId);
    });

    stickZone.addEventListener('pointermove', (e) => {
      if (!touch.active || e.pointerId !== touch.id) return;
      let dx = e.clientX - touch.ox;
      let dy = e.clientY - touch.oy;
      const d = Math.hypot(dx, dy);
      if (d > RADIUS) {
        dx = (dx / d) * RADIUS;
        dy = (dy / d) * RADIUS;
      }
      touch.dx = dx / RADIUS;
      touch.dy = dy / RADIUS;
      setKnob(dx, dy);
    });

    const end = (e) => {
      if (!touch.active || (e && e.pointerId !== touch.id)) return;
      touch.active = false;
      touch.dx = 0;
      touch.dy = 0;
      showStick(false);
    };
    stickZone.addEventListener('pointerup', end);
    stickZone.addEventListener('pointercancel', end);
    /* Listen on the window too: with pointer capture the thumb often drifts
       outside the zone, and losing the drag there would freeze movement. */
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function bindButton(id, key) {
    const el = doc.getElementById(id);
    if (!el) return;
    const down = (e) => {
      e.preventDefault();
      buttons[key] = true;
      el.classList.add('pressed');
      if (key === 'super') state.superQueued = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    };
    const up = (e) => {
      if (e) e.preventDefault();
      buttons[key] = false;
      el.classList.remove('pressed');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  bindButton('btn-punch', 'punch');
  bindButton('btn-kick', 'kick');
  bindButton('btn-dash', 'dash');
  bindButton('btn-super', 'super');

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    held.add(e.code);
    if (KEYS.super.includes(e.code)) {
      state.superQueued = true;
      e.preventDefault();
    }
    if (KEYS.punch.includes(e.code) || KEYS.kick.includes(e.code) || KEYS.dash.includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => {
    held.clear();
    buttons.punch = buttons.kick = buttons.dash = false;
  });

  const anyHeld = (list) => list.some((k) => held.has(k));

  function getInput() {
    let mx = 0;
    let my = 0;

    if (touch.active) {
      mx = touch.dx;
      my = touch.dy;
    } else {
      if (anyHeld(KEYS.left)) mx -= 1;
      if (anyHeld(KEYS.right)) mx += 1;
      if (anyHeld(KEYS.up)) my -= 1;
      if (anyHeld(KEYS.down)) my += 1;
    }

    const input = {
      mx,
      my,
      punch: buttons.punch || anyHeld(KEYS.punch),
      kick: buttons.kick || anyHeld(KEYS.kick),
      dash: buttons.dash || anyHeld(KEYS.dash),
      super: state.superQueued
    };
    state.superQueued = false;
    return input;
  }

  function reset() {
    held.clear();
    buttons.punch = buttons.kick = buttons.dash = false;
    touch.active = false;
    touch.dx = 0;
    touch.dy = 0;
    state.superQueued = false;
    showStick(false);
  }

  return { getInput, reset };
}
