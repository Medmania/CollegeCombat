/* 33 — Scooty Express.

   He kick-starts a stubborn scooty. It coughs, fails, then roars into life and
   does a wheelie straight across the arena, headlight on, exhaust smoking,
   carrying whoever it hits and bumping anyone else once. It skids to a stop and
   the horn goes peep peep.

   Big, slow, and jumpable if you time it. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['thirtythree'] = {
  name: 'Scooty Express',
  banner: 'SCOOTY EXPRESS',
  phases: { startup: 1.0, action: 1.5, impact: 0.5, aftermath: 1.0 },
  damage: 30,
  radius: 200,
  hits: [{ at: 2.15, radius: 200, damage: 30, knock: 600, knockdown: true, hitstun: 0.6, atTarget: true }],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    const landX = s.landX !== undefined ? s.landX : s.x;
    const land = g.project(landX, 0);
    if (!pr || !land) return;

    const u = pr.s;
    const el = s.elapsed;
    const goAt = 1.3;
    const hitAt = 2.15;
    const endAt = 2.9;

    /* ---- kick-starting ---- */
    if (el < goAt) {
      const failed = el > 0.55 && el < 0.85;
      const bob = failed ? Math.sin(el * 40) * 2 * u : 0;

      drawScooty(ctx, pr.x + 6 * u, pr.y + bob, u, 0, false);

      /* the failed kick puff */
      if (failed) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#8a8a92';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(pr.x - 20 * u - i * 8 * u, pr.y - 30 * u - i * 5 * u, (4 + i * 2) * u, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      /* the label */
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = failed ? '#ff8a6a' : '#ffd166';
      ctx.font = `900 ${Math.round(10 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(failed ? '...phus' : el > 0.9 ? 'VROOM' : '', pr.x, pr.y - 130 * u);
      ctx.restore();
      return;
    }

    /* ---- the wheelie charge ---- */
    if (el < endAt) {
      const k = Math.min(1, (el - goAt) / (endAt - goAt));
      const travel = Math.min(1.1, k * 1.5);
      const sx = pr.x + (land.x - pr.x) * travel + 120 * u * travel;
      const tilt = -0.45 - Math.sin(k * Math.PI) * 0.25;   /* nose up */

      /* dust and exhaust */
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#b9a184';
      for (let i = 0; i < 8; i++) {
        const px = sx - (40 + i * 30) * u;
        const py = pr.y - (6 + (i % 3) * 6) * u;
        ctx.beginPath();
        ctx.arc(px, py, (8 + (i % 4) * 4) * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      drawScooty(ctx, sx, pr.y, u, tilt, true, el);
      return;
    }

    /* ---- skid stop and the horn ---- */
    const after = el - endAt;
    if (after < 1.2) {
      const stop = Math.min(1, after / 0.35);
      const sx = land.x + 120 * u + (1 - stop) * 60 * u;

      /* skid marks */
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#2a2420';
      ctx.lineWidth = 3 * u;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(sx - (20 + i * 8) * u, land.y);
        ctx.lineTo(sx - (80 + i * 10) * u, land.y);
        ctx.stroke();
      }
      ctx.restore();

      drawScooty(ctx, sx, pr.y, u, 0, false);

      if (after > 0.35 && after < 1.0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (1.0 - after) * 3);
        ctx.fillStyle = '#ffd166';
        ctx.font = `900 ${Math.round(11 * u)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('peep peep', sx, pr.y - 120 * u);
        ctx.restore();
      }
    }
  }
};

/* a small side-on scooty with wheels, headlight and suspension */
function drawScooty(ctx, x, y, u, tilt, lit, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt || 0);

  /* shadow */
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 46 * u, 10 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* wheels */
  for (const wx of [-28, 30]) {
    ctx.fillStyle = '#191c21';
    ctx.beginPath();
    ctx.arc(wx * u, -12 * u, 13 * u, 0, Math.PI * 2);
    ctx.fill();
    /* spinning spokes */
    ctx.save();
    ctx.translate(wx * u, -12 * u);
    ctx.rotate((t || 0) * 14);
    ctx.strokeStyle = 'rgba(200,200,210,0.5)';
    ctx.lineWidth = 1.6 * u;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-9 * u, 0);
      ctx.lineTo(9 * u, 0);
      ctx.rotate(Math.PI / 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* body */
  ctx.fillStyle = '#4a3b2a';
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.roundRect(-32 * u, -40 * u, 60 * u, 24 * u, 10 * u);
  ctx.fill();
  ctx.stroke();

  /* front shield */
  ctx.beginPath();
  ctx.moveTo(24 * u, -40 * u);
  ctx.quadraticCurveTo(40 * u, -52 * u, 34 * u, -66 * u);
  ctx.lineTo(22 * u, -62 * u);
  ctx.closePath();
  ctx.fillStyle = '#3a2f22';
  ctx.fill();
  ctx.stroke();

  /* seat */
  ctx.fillStyle = '#241d15';
  ctx.beginPath();
  ctx.roundRect(-30 * u, -46 * u, 34 * u, 10 * u, 5 * u);
  ctx.fill();

  /* handlebar */
  ctx.strokeStyle = '#2b2f36';
  ctx.lineWidth = 3 * u;
  ctx.beginPath();
  ctx.moveTo(26 * u, -66 * u);
  ctx.lineTo(34 * u, -78 * u);
  ctx.stroke();

  /* headlight */
  ctx.fillStyle = lit ? '#fff3b0' : '#c9c2a8';
  ctx.beginPath();
  ctx.arc(30 * u, -58 * u, 6 * u, 0, Math.PI * 2);
  ctx.fill();

  /* the beam */
  if (lit) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(30 * u, -60 * u);
    ctx.lineTo(130 * u, -96 * u);
    ctx.lineTo(130 * u, -34 * u);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
