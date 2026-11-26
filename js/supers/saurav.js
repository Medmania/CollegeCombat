/* Saurav — Thigh Drop.

   A squat charge, then he leaps off the top of the screen and comes down thighs
   first. A shadow on the floor grows while he is up there, so you can see
   exactly where it will land and run. The slam throws up floor tiles and office
   chairs; anyone caught is flattened and pops back.

   The crash lands on the spot the target stood on at activation. The fall is
   measured in screen heights, so it stays visible at any camera zoom. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['saurav'] = {
  name: 'Thigh Drop',
  banner: 'THIGH DROP',
  phases: { startup: 0.8, action: 1.2, impact: 0.5, aftermath: 0.9 },
  damage: 30,
  radius: 210,
  hits: [{ at: 2.0, radius: 210, damage: 30, knock: 700, knockdown: true, hitstun: 0.7, atTarget: true }],

  draw(g, s) {
    const ctx = g.ctx;
    const landX = s.landX !== undefined ? s.landX : s.x;
    const land = g.project(landX, 0);
    if (!land) return;
    const u = land.s;
    const el = s.elapsed;
    const jumpAt = 0.8;
    const landAt = 2.0;

    /* ---- the warning shadow, growing the whole way down ---- */
    if (el < landAt + 0.1) {
      const k = Math.min(1, Math.max(0, (el - jumpAt) / (landAt - jumpAt)));
      const rad = 210 * u * (0.3 + 0.7 * k);
      ctx.save();
      ctx.globalAlpha = 0.16 + 0.26 * k;
      ctx.fillStyle = '#120d10';
      ctx.beginPath();
      ctx.ellipse(land.x, land.y, rad, rad * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(el * 10));
      ctx.strokeStyle = '#ffb37a';
      ctx.lineWidth = Math.max(2, 3 * u);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- the leap: from above the screen down to the floor ---- */
    if (el >= jumpAt && el < landAt) {
      const k = (el - jumpAt) / (landAt - jumpAt);
      const fall = Math.pow(k, 1.6);
      const y = land.y - g.H * 0.95 * (1 - fall);
      drawThighs(ctx, land.x, y, u * (0.9 + (1 - k) * 0.35), k);
      return;
    }

    /* ---- impact ---- */
    if (el >= landAt) {
      const after = el - landAt;

      if (after < 0.55) {
        const k = after / 0.55;
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.6;
        ctx.fillStyle = '#d9c3a5';
        ctx.beginPath();
        ctx.ellipse(land.x, land.y, (90 + k * 230) * u, (30 + k * 90) * u, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (after < 0.9) {
        const k = after / 0.9;
        ctx.save();
        for (let i = 0; i < 9; i++) {
          const dir = i % 2 ? 1 : -1;
          const px = land.x + dir * (40 + k * (200 + i * 18)) * u;
          const py = land.y - Math.sin(k * Math.PI) * (70 + i * 12) * u;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(k * 7 * dir + i);
          if (i === 4) {
            ctx.fillStyle = '#4a3b2a';
            ctx.fillRect(-9 * u, -16 * u, 18 * u, 20 * u);
            ctx.fillRect(-9 * u, 2 * u, 18 * u, 5 * u);
          } else {
            ctx.fillStyle = i % 3 ? '#8a6a4a' : '#a8835c';
            ctx.fillRect(-8 * u, -6 * u, 16 * u, 12 * u);
          }
          ctx.restore();
        }
        ctx.restore();
      }

      if (after > 0.7) {
        const k = Math.min(1, (after - 0.7) / 0.4);
        ctx.save();
        ctx.globalAlpha = 0.9 * (1 - k);
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3 * u;
        ctx.beginPath();
        ctx.ellipse(land.x, land.y, (60 + k * 120) * u, (20 + k * 44) * u, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
};

/* the descending thighs: a big cartoon leg pair, drawn in code */
function drawThighs(ctx, x, y, u, k) {
  ctx.save();
  ctx.translate(x, y);

  for (const side of [-1, 1]) {
    ctx.fillStyle = '#5b4b8a';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.roundRect(side * 30 * u - 22 * u, -60 * u, 44 * u, 62 * u, 20 * u);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2f2547';
    ctx.beginPath();
    ctx.roundRect(side * 30 * u - 23 * u, -14 * u, 46 * u, 16 * u, 8 * u);
    ctx.fill();
    ctx.fillStyle = '#241d33';
    ctx.beginPath();
    ctx.ellipse(side * 30 * u, 4 * u, 24 * u, 10 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.ellipse(side * 30 * u - 6 * u, 0, 9 * u, 4 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* speed lines above, while falling */
  ctx.save();
  ctx.globalAlpha = 0.35 * (1 - k);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2 * u;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 22 * u, -78 * u);
    ctx.lineTo(i * 26 * u, -130 * u);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}
