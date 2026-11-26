/* Ansh — Haze Cloud.

   A dramatic inhale, then a layered rolling cloud with real depth rolls out and
   wraps around both fighters. Everything inside moves lazily, with wobbly stars
   and a lo-fi wobble on the screen. Ansh calmly says "I am completely fine"
   while facing the wrong way.

   Soft control: little damage, but whoever is caught moves and hits slower. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['ansh'] = {
  name: 'Haze Cloud',
  banner: 'HAZE CLOUD',
  phases: { startup: 1.0, action: 1.2, impact: 0.4, aftermath: 1.0 },
  damage: 8,
  radius: 220,
  hits: [
    { at: 1.35, radius: 220, damage: 4, knock: 10, hitstun: 0.1, slow: 1.6, weak: 1.6, atTarget: true },
    { at: 1.95, radius: 220, damage: 4, knock: 10, hitstun: 0.1, slow: 2.0, weak: 2.0, atTarget: true }
  ],

  /* rolling puffs, generated once so they drift rather than jitter */
  puffs: (() => {
    const out = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 14; i++) {
      out.push({
        ox: (rnd() - 0.5) * 2,
        oy: rnd(),
        r: 0.5 + rnd() * 0.7,
        drift: 0.3 + rnd() * 0.7,
        depth: rnd()
      });
    }
    return out;
  })(),

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    const landX = s.landX !== undefined ? s.landX : s.x;
    const land = g.project(landX, 0);
    if (!pr || !land) return;

    const u = pr.s;
    const el = s.elapsed;
    const cloudAt = 1.0;
    const endAt = 2.8;

    /* ---- the inhale ---- */
    if (el < cloudAt) {
      const k = Math.min(1, el / 0.9);
      ctx.save();
      ctx.globalAlpha = 0.5 * k;
      ctx.strokeStyle = '#cfe8d8';
      ctx.lineWidth = 2 * u;
      for (let i = 0; i < 5; i++) {
        const a = -0.9 + i * 0.45;
        const r0 = (60 - k * 34) * u;
        ctx.beginPath();
        ctx.moveTo(pr.x + Math.cos(a) * r0 * 1.6, pr.y - 110 * u + Math.sin(a) * r0);
        ctx.lineTo(pr.x + Math.cos(a) * (r0 * 1.6 - 18 * u), pr.y - 110 * u + Math.sin(a) * (r0 - 12 * u));
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    /* ---- the rolling cloud ---- */
    if (el < endAt) {
      const grow = Math.min(1, (el - cloudAt) / 0.6);
      const fade = Math.min(1, Math.max(0, (endAt - el) / 0.5));
      const spread = 220 * u * grow;

      ctx.save();
      for (const p of this.puffs) {
        const drift = ((el - cloudAt) * p.drift * 0.6) % 1;
        const px = land.x + p.ox * spread * (0.5 + drift * 0.8);
        const py = land.y - (p.oy * 130 + 20) * u;
        const r = (26 + p.r * 44) * u * grow;
        const depthFade = 0.12 + p.depth * 0.16;

        ctx.globalAlpha = depthFade * fade;
        ctx.fillStyle = p.depth > 0.55 ? '#8fbf9a' : '#a9d6b3';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* wobbly stars inside the haze */
      ctx.globalAlpha = 0.7 * fade;
      ctx.fillStyle = '#f7f3c8';
      for (let i = 0; i < 6; i++) {
        const a = el * 0.7 + i * 1.05;
        const sx = land.x + Math.cos(a) * 90 * u;
        const sy = land.y - 80 * u + Math.sin(a * 1.3) * 50 * u;
        drawStar(ctx, sx, sy, 6 * u, a);
      }

      /* lo-fi notes */
      ctx.globalAlpha = 0.55 * fade;
      ctx.fillStyle = '#cfe8d8';
      ctx.font = `900 ${Math.round(13 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const t = (el * 0.6 + i * 0.33) % 1;
        ctx.fillText('\u266A', land.x + (i - 1) * 50 * u, land.y - (60 + t * 90) * u);
      }
      ctx.restore();
      return;
    }

    /* ---- "I am completely fine", facing the wrong way ---- */
    const after = el - endAt;
    if (after < 1.2) {
      const k = Math.min(1, after / 0.25);
      const fade = Math.min(1, (1.2 - after) / 0.3);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(pr.x - 70 * u, pr.y - 170 * u);
      ctx.scale(0.85 + k * 0.15, 0.85 + k * 0.15);

      ctx.font = `800 ${Math.round(11 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = 'I am completely fine';
      const w = ctx.measureText(text).width + 18 * u;
      const h = 22 * u;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1.8 * u;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8 * u);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1b1e24';
      ctx.fillText(text, 0, 0.5 * u);
      ctx.restore();
    }
  }
};

function drawStar(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
