/* Mukesh — Ambani Army.

   He snaps his fingers. Silence. A cup of chai on the floor trembles. Then a
   herd of buffalo charges across the arena at different depths, legs galloping,
   horns down, dust flying, and carries whoever it hits along with it. The last,
   smallest buffalo arrives late, stops, moos, and wanders off.

   Each buffalo is a fully drawn quadruped, not a shape. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['mukesh'] = {
  name: 'Ambani Army',
  banner: 'AMBANI ARMY',
  phases: { startup: 1.0, action: 1.5, impact: 0.5, aftermath: 1.2 },
  damage: 24,
  radius: 210,
  hits: [
    { at: 1.35, radius: 210, damage: 8, knock: 260, hitstun: 0.2, atTarget: true },
    { at: 1.75, radius: 210, damage: 8, knock: 260, hitstun: 0.2, atTarget: true },
    { at: 2.15, radius: 210, damage: 8, knock: 420, knockdown: true, hitstun: 0.45, atTarget: true }
  ],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    const landX = s.landX !== undefined ? s.landX : s.x;
    const land = g.project(landX, 0);
    if (!pr || !land) return;

    const u = pr.s;
    const el = s.elapsed;
    const chargeAt = 1.0;
    const endAt = 2.6;

    /* ---- the snap, and the trembling chai ---- */
    if (el < chargeAt) {
      const k = Math.min(1, el / 0.5);

      /* chai cup on the floor */
      const cx = pr.x + 34 * u;
      const cy = pr.y - 8 * u;
      const shake = el > 0.6 ? Math.sin(el * 40) * 1.6 * u : 0;
      ctx.save();
      ctx.translate(cx + shake, cy);
      ctx.fillStyle = '#e8dcc0';
      ctx.strokeStyle = 'rgba(60,45,25,0.6)';
      ctx.lineWidth = 1.6 * u;
      ctx.beginPath();
      ctx.roundRect(-7 * u, -14 * u, 14 * u, 14 * u, 2 * u);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a8763f';
      ctx.beginPath();
      ctx.ellipse(0, -13 * u, 7 * u, 2.6 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      /* ripples in the chai */
      if (el > 0.6) {
        ctx.strokeStyle = 'rgba(200,160,110,0.8)';
        ctx.lineWidth = 1 * u;
        const r = ((el * 3) % 1) * 5 * u;
        ctx.beginPath();
        ctx.ellipse(0, -13 * u, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      /* the silence beat */
      if (el > 0.7) {
        ctx.save();
        ctx.globalAlpha = 0.7 * k;
        ctx.fillStyle = '#e6e6ee';
        ctx.font = `900 ${Math.round(16 * u)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('. . .', pr.x, pr.y - 150 * u);
        ctx.restore();
      }
      return;
    }

    /* ---- the charge ---- */
    if (el < endAt) {
      const k = (el - chargeAt) / (endAt - chargeAt);
      const count = 6;

      /* dust kicked up under the herd */
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#b9a184';
      for (let i = 0; i < 10; i++) {
        const px = land.x - 260 * u + ((k * 900 + i * 90) % 620) * u;
        const py = land.y - (4 + (i % 3) * 5) * u;
        ctx.beginPath();
        ctx.arc(px, py, (8 + (i % 4) * 4) * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      /* the herd, back to front so nearer ones overlap */
      for (let i = count - 1; i >= 0; i--) {
        const depth = i / (count - 1);            /* 0 = far, 1 = near */
        const scale = 0.62 + depth * 0.5;
        const travel = Math.min(1.15, k * 1.35 + i * 0.06);
        const bx = land.x - 420 * u + travel * 900 * u;
        const by = land.y - (6 + depth * 22) * u;
        drawBuffalo(ctx, bx, by, u * scale, el * 16 + i * 1.4, depth);
      }

      /* the target being carried along */
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2.5 * u;
      for (let i = 0; i < 3; i++) {
        const yy = land.y - (60 + i * 26) * u;
        ctx.beginPath();
        ctx.moveTo(land.x - 30 * u, yy);
        ctx.lineTo(land.x + 30 * u, yy);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    /* ---- the little one, arriving late ---- */
    const after = el - endAt;
    if (after < 1.4) {
      const k = Math.min(1, after / 0.8);
      const bx = land.x + 380 * u - k * 300 * u;
      const by = land.y - 2 * u;
      const walk = after < 0.8 ? after * 9 : 0;
      drawBuffalo(ctx, bx, by, u * 0.42, walk, 0.9);

      if (after > 0.8 && after < 1.3) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (1.3 - after) * 3);
        ctx.fillStyle = '#e6e6ee';
        ctx.font = `900 ${Math.round(13 * u)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('moo.', bx, by - 60 * u);
        ctx.restore();
      }
    }
  }
};

/* a side-on buffalo: body, head, horns, tail and four galloping legs */
function drawBuffalo(ctx, x, y, u, phase, depth) {
  const dark = depth > 0.5 ? '#2e2a26' : '#3a3530';
  const body = depth > 0.5 ? '#4a443c' : '#3f3a34';

  ctx.save();
  ctx.translate(x, y);

  /* shadow */
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 44 * u, 10 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* legs, two pairs out of phase */
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const front = i < 2;
    const off = front ? 22 : -22;
    const ph = Math.sin(phase + (i % 2) * Math.PI) * 0.6;
    ctx.lineWidth = 7 * u;
    ctx.beginPath();
    ctx.moveTo(off * u, -30 * u);
    ctx.lineTo(off * u + ph * 14 * u, -2 * u);
    ctx.stroke();
    /* hoof */
    ctx.fillStyle = '#1b1815';
    ctx.beginPath();
    ctx.ellipse(off * u + ph * 14 * u, -1 * u, 5 * u, 3 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* body */
  ctx.fillStyle = body;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.ellipse(0, -42 * u, 42 * u, 24 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  /* hump */
  ctx.beginPath();
  ctx.ellipse(-12 * u, -56 * u, 20 * u, 13 * u, -0.2, 0, Math.PI * 2);
  ctx.fill();

  /* head */
  ctx.beginPath();
  ctx.ellipse(40 * u, -46 * u, 16 * u, 13 * u, 0.15, 0, Math.PI * 2);
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.stroke();

  /* snout */
  ctx.beginPath();
  ctx.ellipse(53 * u, -42 * u, 8 * u, 6 * u, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#26221e';
  ctx.fill();

  /* horns, curving out and back */
  ctx.strokeStyle = '#d9d2c4';
  ctx.lineWidth = 3.4 * u;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(38 * u, -54 * u + dir * 3 * u);
    ctx.quadraticCurveTo(30 * u, -68 * u + dir * 6 * u, 20 * u, -60 * u + dir * 10 * u);
    ctx.stroke();
  }

  /* eye */
  ctx.fillStyle = '#0d0b09';
  ctx.beginPath();
  ctx.arc(44 * u, -50 * u, 2.4 * u, 0, Math.PI * 2);
  ctx.fill();

  /* tail with a swish */
  ctx.strokeStyle = dark;
  ctx.lineWidth = 3 * u;
  ctx.beginPath();
  ctx.moveTo(-40 * u, -50 * u);
  ctx.quadraticCurveTo(-54 * u, -40 * u, -50 * u + Math.sin(phase * 0.8) * 6 * u, -22 * u);
  ctx.stroke();

  ctx.restore();
}
