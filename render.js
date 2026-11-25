/* Canvas renderer. Takes a plain "view" object (already interpolated by the
   caller) and draws it. Knows nothing about networking or match rules. */

import { ARENA, PLAYER_R } from './engine.js';

const TAU = Math.PI * 2;

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const cam = { s: 1, tx: 0, ty: 0 };
  const particles = [];
  const rings = [];
  let W = 1;
  let H = 1;
  let shake = 0;
  let time = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateCam() {
    const pad = 60;
    cam.s = Math.min(W, H) / (ARENA.r * 2 + pad);
    cam.tx = W / 2 - ARENA.cx * cam.s;
    cam.ty = H / 2 - ARENA.cy * cam.s;
  }

  const sx = (x) => x * cam.s + cam.tx;
  const sy = (y) => y * cam.s + cam.ty;

  function feed(events, players) {
    for (const e of events || []) {
      if (e.type === 'hit') {
        const target = players.find((p) => p.id === e.on);
        const color = target ? target.colors.accent : '#ffffff';
        const big = e.kind === 'kick' || e.kind === 'super';
        const n = big ? 14 : 8;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * TAU;
          const sp = 80 + Math.random() * (big ? 320 : 180);
          particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.35 + Math.random() * 0.3,
            max: 0.65,
            size: 2 + Math.random() * 3,
            color: i % 3 === 0 ? '#ffffff' : color
          });
        }
        rings.push({ x: e.x, y: e.y, r: 6, max: big ? 90 : 52, life: 0.28, maxLife: 0.28, color });
        shake = Math.min(16, shake + (big ? 9 : 4));
      } else if (e.type === 'ko') {
        const p = players.find((q) => q.id === e.id);
        const color = p ? p.colors.accent : '#ffffff';
        for (let i = 0; i < 26; i++) {
          const a = Math.random() * TAU;
          const sp = 120 + Math.random() * 380;
          particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.5 + Math.random() * 0.4,
            max: 0.9,
            size: 3 + Math.random() * 4,
            color
          });
        }
        rings.push({ x: e.x, y: e.y, r: 10, max: 150, life: 0.5, maxLife: 0.5, color });
        shake = Math.min(22, shake + 14);
      } else if (e.type === 'super' || e.type === 'superstart') {
        const p = players.find((q) => q.id === e.id);
        const color = p ? p.colors.accent : '#ffffff';
        rings.push({
          x: e.x,
          y: e.y,
          r: 10,
          max: e.r || 190,
          life: 0.45,
          maxLife: 0.45,
          color,
          thick: true
        });
        shake = Math.min(20, shake + 10);
      }
    }
  }

  function step(dt) {
    time += dt;
    shake *= Math.pow(0.001, dt);
    if (shake < 0.2) shake = 0;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.06, dt);
      p.vy *= Math.pow(0.06, dt);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= dt;
      if (r.life <= 0) {
        rings.splice(i, 1);
        continue;
      }
      r.r += (r.max - r.r) * Math.min(1, dt * 9);
    }
  }

  function drawFloor() {
    const g = ctx.createRadialGradient(ARENA.cx, ARENA.cy, 40, ARENA.cx, ARENA.cy, ARENA.r);
    g.addColorStop(0, '#1b2233');
    g.addColorStop(0.65, '#151a26');
    g.addColorStop(1, '#0e1119');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, ARENA.r, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 2;
    for (const f of [0.35, 0.62, 0.85]) {
      ctx.beginPath();
      ctx.arc(ARENA.cx, ARENA.cy, ARENA.r * f, 0, TAU);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 16; i++) {
      const a = (TAU * i) / 16;
      ctx.beginPath();
      ctx.moveTo(ARENA.cx + Math.cos(a) * ARENA.r * 0.35, ARENA.cy + Math.sin(a) * ARENA.r * 0.35);
      ctx.lineTo(ARENA.cx + Math.cos(a) * ARENA.r, ARENA.cy + Math.sin(a) * ARENA.r);
      ctx.stroke();
    }

    /* centre emblem */
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(255,209,102,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, 54, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, 40, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,209,102,0.10)';
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, 40, 0, TAU);
    ctx.fill();
    ctx.restore();

    /* boundary */
    const pulse = 0.55 + Math.sin(time * 2) * 0.08;
    ctx.strokeStyle = `rgba(255,209,102,${pulse})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, ARENA.r, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, ARENA.r - 10, 0, TAU);
    ctx.stroke();
  }

  function drawAttack(p, t) {
    const a = p.attack;
    if (!a) return;
    const prog = Math.min(1, a.t / a.dur);
    const colors = p.colors;

    if (a.type === 'super') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 * (1 - prog);
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.moves.super.range * (0.4 + prog * 0.7), 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    const mv = p.moves[a.type];
    const reach = mv.range * (0.55 + 0.45 * Math.min(1, prog * 2.2));
    const swing = Math.sin(Math.min(1, prog) * Math.PI);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(p.x, p.y);
    ctx.rotate(p.face);
    ctx.globalAlpha = 0.34 + 0.5 * swing;

    if (a.type === 'punch') {
      ctx.fillStyle = colors.accent;
      const w = reach;
      ctx.beginPath();
      ctx.roundRect(PLAYER_R * 0.4, -11, w - PLAYER_R * 0.4, 22, 11);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w, 0, 9, 0, TAU);
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(0, 0, PLAYER_R * 0.5, 0, 0, reach);
      g.addColorStop(0, 'rgba(255,255,255,0.75)');
      g.addColorStop(0.55, colors.accent);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, reach, -mv.arc / 2, mv.arc / 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, reach, -mv.arc / 2, mv.arc / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFighter(p) {
    const c = p.colors;
    const ko = !p.alive;
    const hitFlash = p.hitstun > 0.02;

    ctx.save();
    ctx.globalAlpha = ko ? 0.3 : 1;

    /* shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + PLAYER_R * 0.85, PLAYER_R * 0.95, PLAYER_R * 0.4, 0, 0, TAU);
    ctx.fill();

    if (ko) {
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.55);
      ctx.translate(-p.x, -p.y);
    }

    const bodyColor = hitFlash ? '#ffffff' : c.body;

    /* arms */
    ctx.fillStyle = shade(c.body, -30);
    const perp = p.face + Math.PI / 2;
    const armSpread = PLAYER_R * 0.78;
    for (const side of [-1, 1]) {
      const ax = p.x + Math.cos(perp) * armSpread * side + Math.cos(p.face) * 6;
      const ay = p.y + Math.sin(perp) * armSpread * side + Math.sin(p.face) * 6;
      ctx.beginPath();
      ctx.arc(ax, ay, PLAYER_R * 0.26, 0, TAU);
      ctx.fill();
    }

    /* torso */
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_R, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    /* collar */
    ctx.fillStyle = shade(c.body, 26);
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_R * 0.62, 0, TAU);
    ctx.fill();

    /* head */
    const hx = p.x + Math.cos(p.face) * 5;
    const hy = p.y + Math.sin(p.face) * 5 - 4;
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(hx, hy, PLAYER_R * 0.56, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* hair cap */
    ctx.fillStyle = c.hair || '#222';
    ctx.beginPath();
    ctx.arc(hx, hy - 2, PLAYER_R * 0.56, Math.PI * 1.08, Math.PI * 1.92);
    ctx.fill();

    /* eyes */
    const eyeDist = PLAYER_R * 0.2;
    const ex = hx + Math.cos(p.face) * PLAYER_R * 0.22;
    const ey = hy + Math.sin(p.face) * PLAYER_R * 0.22;
    ctx.fillStyle = '#14161b';
    if (ko) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#14161b';
      for (const s of [-1, 1]) {
        const px = ex + Math.cos(perp) * eyeDist * s;
        const py = ey + Math.sin(perp) * eyeDist * s;
        ctx.beginPath();
        ctx.moveTo(px - 4, py - 4);
        ctx.lineTo(px + 4, py + 4);
        ctx.moveTo(px + 4, py - 4);
        ctx.lineTo(px - 4, py + 4);
        ctx.stroke();
      }
    } else {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(ex + Math.cos(perp) * eyeDist * s, ey + Math.sin(perp) * eyeDist * s, 3.1, 0, TAU);
        ctx.fill();
      }
    }

    ctx.restore();

    if (!ko) drawAttack(p);
  }

  /* Health bars sit above each fighter, but nudged up when two would overlap,
     so a crowded scrum never produces unreadable stacked names. */
  function layoutHud(players) {
    const items = [];
    for (const p of players) {
      if (!p.alive) continue;
      items.push({
        p,
        x: Math.max(34, Math.min(W - 34, sx(p.x))),
        y: Math.max(40, sy(p.y) - 54),
        w: 62,
        h: 26
      });
    }
    const placed = [];
    for (const it of items) {
      let guard = 0;
      while (
        guard++ < 10 &&
        placed.some((o) => Math.abs(o.x - it.x) < (o.w + it.w) / 2 && Math.abs(o.y - it.y) < (o.h + it.h) / 2)
      ) {
        it.y -= 26;
      }
      placed.push(it);
    }
    return items;
  }

  function drawHud(p, isLocal, x, y) {
    if (!p.alive) return;
    const w = 58;
    const h = 6;
    const hpFrac = Math.max(0, p.hp / p.maxHp);
    const meterFrac = Math.max(0, Math.min(1, p.meter / 100));

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2 - 1, y - 1, w + 2, h + 2, 4);
    ctx.fill();

    ctx.fillStyle = hpFrac > 0.5 ? '#4ade80' : hpFrac > 0.22 ? '#facc15' : '#f87171';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w * hpFrac, h, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y + h + 3, w, 3.5, 2);
    ctx.fill();
    if (meterFrac >= 1) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(time * 6) * 0.25;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.roundRect(x - w / 2 - 3, y - 4, w + 6, h + 14, 6);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = meterFrac >= 1 ? '#ffd166' : '#7dd3fc';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y + h + 3, w * meterFrac, 3.5, 2);
    ctx.fill();

    ctx.font = '600 11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.fillStyle = isLocal ? '#ffd166' : '#ffffff';
    const label = p.name;
    ctx.strokeText(label, x, y - 6);
    ctx.fillText(label, x, y - 6);

    if (isLocal) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(x, y - 15);
      ctx.lineTo(x - 5, y - 22);
      ctx.lineTo(x + 5, y - 22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(view) {
    updateCam();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0e15');
    g.addColorStop(1, '#05070b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    ctx.save();
    ctx.translate(cam.tx, cam.ty);
    ctx.scale(cam.s, cam.s);

    drawFloor();

    const sorted = view.players.slice().sort((a, b) => a.y - b.y);
    for (const p of sorted) drawFighter(p);

    for (const r of rings) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.thick ? 9 : 4;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    for (const it of layoutHud(view.players)) {
      drawHud(it.p, it.p.id === view.localId, it.x, it.y);
    }

    ctx.restore();
  }

  return { resize, draw, step, feed };
}
