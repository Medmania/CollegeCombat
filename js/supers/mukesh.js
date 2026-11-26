/* Mukesh — Ambani Army.

   He snaps his fingers. Silence. A cup of chai on the floor trembles. Then a
   herd of buffalo charges across the arena at different depths, and carries
   whoever it hits along with it. The last, smallest buffalo arrives late,
   stops, moos, and wanders off.

   Each buffalo is one jointed rig: heavy shoulders, a low head with ridged
   curved horns, ears, a tail with a tuft, two-segment legs with hooves, hide
   shading and sparse hair strokes. Near animals are detailed; the ones at the
   back use a simpler pass. Code only, no images. */

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
      const cx = pr.x + 34 * u;
      const cy = pr.y - 8 * u;
      const shake = el > 0.6 ? Math.sin(el * 40) * 1.6 * u : 0;

      ctx.save();
      ctx.translate(cx + shake, cy);

      /* a glass of chai: see-through body, liquid inside, steam */
      const glass = ctx.createLinearGradient(-7 * u, 0, 7 * u, 0);
      glass.addColorStop(0, 'rgba(235,245,250,0.55)');
      glass.addColorStop(0.5, 'rgba(255,255,255,0.28)');
      glass.addColorStop(1, 'rgba(200,215,225,0.5)');
      ctx.fillStyle = glass;
      ctx.beginPath();
      ctx.roundRect(-7 * u, -15 * u, 14 * u, 15 * u, 2 * u);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1 * u;
      ctx.stroke();

      /* the tea */
      const tea = ctx.createLinearGradient(0, -13 * u, 0, 0);
      tea.addColorStop(0, '#c98a4b');
      tea.addColorStop(1, '#8c5626');
      ctx.fillStyle = tea;
      ctx.beginPath();
      ctx.ellipse(0, -8 * u, 6 * u, 2.4 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-6 * u, -8 * u, 12 * u, 8 * u);

      /* ripples */
      if (el > 0.6) {
        const r = ((el * 3) % 1) * 5 * u;
        ctx.strokeStyle = 'rgba(240,210,170,0.9)';
        ctx.lineWidth = 1 * u;
        ctx.beginPath();
        ctx.ellipse(0, -8 * u, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      /* steam */
      if (el > 0.3) {
        for (let i = 0; i < 3; i++) {
          const t = ((el * 0.8 + i * 0.33) % 1);
          softPuff(ctx, cx + Math.sin(t * 6 + i) * 4 * u, cy - (16 + t * 26) * u, (3 + t * 5) * u, (1 - t) * 0.25, 'rgba(240,240,240,0.9)', i + 1);
        }
      }

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

      /* hoof dust along the ground */
      for (let i = 0; i < 8; i++) {
        const px = land.x - 300 * u + ((k * 900 + i * 110) % 640) * u;
        softPuff(ctx, px, land.y - (2 + (i % 3) * 4) * u, (12 + (i % 4) * 6) * u, 0.3, 'rgba(185,161,132,0.85)', i + 2);
      }

      /* back to front so the near animals overlap the far ones */
      for (let i = count - 1; i >= 0; i--) {
        const depth = i / (count - 1);
        const scale = 0.62 + depth * 0.5;
        const travel = Math.min(1.15, k * 1.35 + i * 0.06);
        const bx = land.x - 620 * u + travel * 900 * u;
        const by = land.y - (6 + depth * 22) * u;
        drawBuffalo(ctx, bx, by, u * scale, el * 16 + i * 1.4, depth, depth > 0.45);
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
      drawBuffalo(ctx, bx, by, u * 0.42, walk, 0.9, true);

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

/* ------------------------------------------------------- the buffalo rig */

function hide(base, amt) {
  const h = base.replace('#', '');
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

/* sparse short hair strokes along the hide */
function hideHair(ctx, x, y, rx, ry, seed, count) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20,18,16,0.35)';
  ctx.lineCap = 'round';
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280 / 233280;
    const a = s * Math.PI * 2;
    const px = x + Math.cos(a) * rx * (0.2 + s * 0.7);
    const py = y + Math.sin(a) * ry * (0.2 + s * 0.7);
    ctx.lineWidth = Math.max(0.4, rx * 0.02);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(a) * rx * 0.09, py + Math.sin(a) * rx * 0.09);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBuffalo(ctx, x, y, u, phase, depth, detail) {
  const base = depth > 0.5 ? '#4a443c' : '#3f3a34';
  const dark = hide(base, -26);

  ctx.save();
  ctx.translate(x, y);

  /* contact shadow */
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 46 * u, 10 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* ---- legs: two segments each, with hooves ---- */
  for (let i = 0; i < 4; i++) {
    const front = i < 2;
    const off = (front ? 24 : -24) * u;
    const ph = Math.sin(phase + (i % 2) * Math.PI) * 0.55;

    ctx.strokeStyle = dark;
    ctx.lineCap = 'round';

    /* upper leg */
    ctx.lineWidth = 9 * u;
    const kneeX = off + ph * 10 * u;
    const kneeY = -20 * u;
    ctx.beginPath();
    ctx.moveTo(off, -34 * u);
    ctx.lineTo(kneeX, kneeY);
    ctx.stroke();

    /* lower leg */
    ctx.lineWidth = 7 * u;
    const hoofX = kneeX + ph * 6 * u;
    ctx.beginPath();
    ctx.moveTo(kneeX, kneeY);
    ctx.lineTo(hoofX, -2 * u);
    ctx.stroke();

    /* hoof */
    ctx.fillStyle = '#17140f';
    ctx.beginPath();
    ctx.ellipse(hoofX, -1 * u, 5.5 * u, 3.2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- body: heavy shoulders and a barrel chest ---- */
  const bodyGrad = ctx.createRadialGradient(-8 * u, -54 * u, 3 * u, 0, -44 * u, 48 * u);
  bodyGrad.addColorStop(0, hide(base, 30));
  bodyGrad.addColorStop(0.55, base);
  bodyGrad.addColorStop(1, hide(base, -34));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, -44 * u, 42 * u, 24 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  /* the shoulder hump */
  ctx.beginPath();
  ctx.ellipse(-10 * u, -58 * u, 21 * u, 14 * u, -0.18, 0, Math.PI * 2);
  ctx.fill();

  if (detail) hideHair(ctx, 0, -44 * u, 40 * u, 23 * u, 7, 26);

  /* ---- neck and head, low and forward ---- */
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(36 * u, -48 * u, 17 * u, 14 * u, 0.18, 0, Math.PI * 2);
  ctx.fill();

  /* muzzle */
  ctx.fillStyle = '#26221e';
  ctx.beginPath();
  ctx.ellipse(52 * u, -43 * u, 9 * u, 6.5 * u, 0.1, 0, Math.PI * 2);
  ctx.fill();

  /* nostril */
  ctx.fillStyle = '#0d0b09';
  ctx.beginPath();
  ctx.arc(56 * u, -43 * u, 1.4 * u, 0, Math.PI * 2);
  ctx.fill();

  /* ---- ridged, curved horns: one short curve each, tapering ---- */
  for (const dir of [-1, 1]) {
    const bx = 38 * u;
    const by = -56 * u + dir * 3 * u;
    const tipX = bx - 16 * u;
    const tipY = by - 14 * u - dir * 4 * u;

    ctx.strokeStyle = '#d9d2c4';
    ctx.lineCap = 'round';
    ctx.lineWidth = 4 * u;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 12 * u, by - 4 * u, tipX, tipY);
    ctx.stroke();

    /* ridges */
    ctx.lineWidth = 1.2 * u;
    ctx.strokeStyle = 'rgba(120,112,98,0.6)';
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const px = bx + (tipX - bx) * t;
      const py = by + (tipY - by) * t - Math.sin(t * Math.PI) * 3 * u;
      ctx.beginPath();
      ctx.moveTo(px - 2 * u, py);
      ctx.lineTo(px + 2 * u, py);
      ctx.stroke();
    }
  }

  /* ear */
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(28 * u, -58 * u, 6 * u, 3.5 * u, -0.5, 0, Math.PI * 2);
  ctx.fill();

  /* eye with a glint */
  ctx.fillStyle = '#0d0b09';
  ctx.beginPath();
  ctx.arc(44 * u, -50 * u, 2.6 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(44.8 * u, -50.8 * u, 0.9 * u, 0, Math.PI * 2);
  ctx.fill();

  /* ---- tail with a tuft ---- */
  const swish = Math.sin(phase * 0.8) * 7 * u;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 3 * u;
  ctx.beginPath();
  ctx.moveTo(-40 * u, -52 * u);
  ctx.quadraticCurveTo(-54 * u, -40 * u, -50 * u + swish, -22 * u);
  ctx.stroke();
  ctx.fillStyle = '#1b1815';
  ctx.beginPath();
  ctx.ellipse(-50 * u + swish, -20 * u, 3.4 * u, 6 * u, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

