/* Priyank — Gym Ka Hisaab.

   He strains to lift an absurdly large dumbbell, spins it over his head and
   hurls it. It tumbles, cracks the floor where it lands, bounces once, then
   bursts into plates that scatter. He flexes; a late plate bonks his foot.

   The dumbbell lands on the spot the target stood on at activation, so the
   warning ring and the hit box are the same place. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['priyank'] = {
  name: 'Gym Ka Hisaab',
  banner: 'GYM KA HISAAB',
  phases: { startup: 0.9, action: 1.1, impact: 0.5, aftermath: 1.0 },
  damage: 24,
  radius: 160,
  hits: [{ at: 2.0, radius: 160, damage: 24, knock: 520, knockdown: false, hitstun: 0.45, atTarget: true }],

  draw(g, s) {
    const ctx = g.ctx;
    const landX = s.landX !== undefined ? s.landX : s.x;
    const owner = g.project(s.x, 0);
    const land = g.project(landX, 0);
    if (!owner || !land) return;

    const u = owner.s;
    const el = s.elapsed;
    const throwAt = 1.2;
    const landAt = 2.0;

    /* ---- strain, then the throw ---- */
    if (el < throwAt) {
      const strain = Math.sin(el * 26) * 2 * u * Math.min(1, el / 0.5);
      drawDumbbell(ctx, owner.x + strain, owner.y - 96 * u, u * 0.85, el * 6);
      if (Math.random() < 0.3) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#e8f0ff';
        ctx.beginPath();
        ctx.arc(owner.x + (Math.random() - 0.5) * 40 * u, owner.y - 120 * u, 3 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    /* ---- warning ring while it flies ---- */
    if (el < landAt) {
      const k = Math.min(1, (el - throwAt) / (landAt - throwAt));
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.25 * k;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = Math.max(2, 3 * u);
      ctx.beginPath();
      ctx.ellipse(land.x, land.y, 160 * u, 160 * u * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      /* the dumbbell on its arc: a shallow hop, kept on screen */
      const arc = Math.sin(k * Math.PI) * 60;
      const bx = owner.x + (land.x - owner.x) * k;
      const by = owner.y - 96 * u - arc * u;
      drawDumbbell(ctx, bx, by, u * (0.85 + k * 0.45), k * 22);
      return;
    }

    /* ---- landing ---- */
    const after = el - landAt;

    if (after < 0.16) {
      ctx.save();
      ctx.strokeStyle = 'rgba(30,24,20,0.75)';
      ctx.lineWidth = 2.5 * u;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(land.x, land.y);
        ctx.lineTo(land.x + Math.cos(a) * (60 + i * 9) * u, land.y + Math.sin(a) * (22 + i * 4) * u);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (after < 0.5) {
      const bounce = Math.abs(Math.sin((after / 0.5) * Math.PI * 2)) * 26;
      drawDumbbell(ctx, land.x, land.y - bounce * u, u, after * 18);
    } else if (after < 1.4) {
      const k = (after - 0.5) / 0.9;
      ctx.save();
      for (let i = 0; i < 8; i++) {
        const dir = i % 2 ? 1 : -1;
        const px = land.x + dir * (30 + k * (120 + i * 22)) * u;
        const py = land.y - Math.abs(Math.sin(k * 6 + i)) * 10 * u;
        ctx.fillStyle = '#3a4048';
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.5 * u;
        ctx.beginPath();
        ctx.ellipse(px, py, 13 * u, 5 * u, dir * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ---- the flex, and one late plate on the foot ---- */
    if (el > 3.0) {
      const k = Math.min(1, (el - 3.0) / 0.5);
      const px = owner.x + (1 - k) * 140 * u;
      const py = owner.y - Math.abs(Math.sin(k * Math.PI)) * 40 * u;
      ctx.save();
      ctx.fillStyle = '#3a4048';
      ctx.beginPath();
      ctx.ellipse(px, py, 13 * u, 5 * u, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (k > 0.92) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffd166';
        ctx.font = `900 ${Math.round(12 * u)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('OW', owner.x, owner.y - 130 * u);
        ctx.restore();
      }
    }
  }
};

function drawDumbbell(ctx, x, y, u, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);

  ctx.fillStyle = '#2b2f36';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.roundRect(-30 * u, -6 * u, 60 * u, 12 * u, 4 * u);
  ctx.fill();
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(side * 30 * u - 9 * u, -26 * u, 18 * u, 52 * u, 6 * u);
    ctx.fillStyle = '#3a4048';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.roundRect(side * 30 * u - 6 * u, -22 * u, 6 * u, 44 * u, 3 * u);
    ctx.fill();
  }
  ctx.restore();
}
