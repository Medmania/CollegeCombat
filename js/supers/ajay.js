/* Ajay — Content Creator Special.

   He sets up a tripod, a ring light and a phone, strikes a pose, and a REC dot
   starts blinking in the corner. Then he shouts and throws the entire rig at
   the target. The screen flashes the target's freeze-frame as a thumbnail, and
   a LIKE & SUBSCRIBE card pops up over them.

   The rig lands on the spot the target stood on at activation. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['ajay'] = {
  name: 'Content Creator Special',
  banner: 'CONTENT CREATOR SPECIAL',
  phases: { startup: 1.0, action: 1.0, impact: 0.5, aftermath: 0.9 },
  damage: 22,
  radius: 140,
  hits: [{ at: 2.0, radius: 140, damage: 22, knock: 480, hitstun: 0.4, atTarget: true }],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    const landX = s.landX !== undefined ? s.landX : s.x;
    const land = g.project(landX, 0);
    if (!pr || !land) return;

    const u = pr.s;
    const el = s.elapsed;
    const throwAt = 1.5;
    const landAt = 2.0;

    /* ---- setting up, posing ---- */
    if (el < throwAt) {
      const k = Math.min(1, el / 0.7);
      drawRig(ctx, pr.x - 46 * u, pr.y, u * (0.85 + k * 0.15), el, false);

      /* the pose: one arm out, chin up */
      ctx.save();
      ctx.globalAlpha = Math.min(1, el * 2);
      ctx.fillStyle = '#ffd166';
      ctx.font = `900 ${Math.round(10 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('SCENE AA GAYA!', pr.x, pr.y - 168 * u);
      ctx.restore();
      return;
    }

    /* ---- the rig in flight ---- */
    if (el < landAt) {
      const k = Math.min(1, (el - throwAt) / (landAt - throwAt));
      const bx = pr.x + (land.x - pr.x) * k;
      const by = pr.y - 70 * u - Math.sin(k * Math.PI) * 55 * u;
      drawRig(ctx, bx, by + 70 * u, u * 0.8, el, true);
      return;
    }

    /* ---- impact: the thumbnail and the card ---- */
    const after = el - landAt;

    if (after < 0.45) {
      const k = after / 0.45;
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.7;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 4 * u * (1 - k);
      ctx.beginPath();
      ctx.ellipse(land.x, land.y, (50 + k * 140) * u, (18 + k * 50) * u, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    /* freeze-frame thumbnail of the victim */
    if (after > 0.15 && after < 1.1) {
      const k = Math.min(1, (after - 0.15) / 0.2);
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1.1 - after) / 0.3);
      const w = 54 * u;
      const h = 40 * u;
      const x = land.x;
      const y = land.y - 150 * u;
      ctx.translate(x, y);
      ctx.scale(k, k);
      ctx.fillStyle = '#1b1e24';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = '#4a5058';
      ctx.fillRect(-w / 2 + 3 * u, -h / 2 + 3 * u, w - 6 * u, h - 10 * u);
      /* a tiny stunned face */
      ctx.fillStyle = '#e3b489';
      ctx.beginPath();
      ctx.arc(0, -2 * u, 9 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-3.5 * u, -3 * u, 1.6 * u, 0, Math.PI * 2);
      ctx.arc(3.5 * u, -3 * u, 1.6 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* LIKE & SUBSCRIBE card */
    if (after > 0.35 && after < 1.4) {
      const k = Math.min(1, (after - 0.35) / 0.2);
      const fade = Math.min(1, (1.4 - after) / 0.3);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(land.x, land.y - 190 * u);
      ctx.scale(0.7 + k * 0.3, 0.7 + k * 0.3);
      ctx.fillStyle = '#e6362e';
      ctx.beginPath();
      ctx.roundRect(-58 * u, -13 * u, 116 * u, 26 * u, 6 * u);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${Math.round(11 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LIKE & SUBSCRIBE', 0, 1 * u);
      ctx.restore();
    }
  },

  /* the REC overlay lives in screen space */
  overlay(g, s) {
    if (s.elapsed > 2.6) return;
    const ctx = g.ctx;
    ctx.save();
    ctx.globalAlpha = s.elapsed < 1.5 ? 0.9 : Math.max(0, (2.6 - s.elapsed) / 1.1);
    const x = 26;
    const y = g.H * 0.16;
    ctx.fillStyle = '#e6362e';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 12px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('REC', x + 12, y + 1);
    ctx.restore();
  }
};

/* tripod, ring light and phone, drawn small and cheap */
function drawRig(ctx, x, y, u, t, flying) {
  ctx.save();
  ctx.translate(x, y);

  /* tripod legs */
  ctx.strokeStyle = '#2b2f36';
  ctx.lineWidth = Math.max(1.5, 3 * u);
  ctx.lineCap = 'round';
  for (const side of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -54 * u);
    ctx.lineTo(side * 16 * u, 0);
    ctx.stroke();
  }

  /* ring light */
  ctx.strokeStyle = '#f7f3ec';
  ctx.lineWidth = Math.max(2, 4 * u);
  ctx.beginPath();
  ctx.arc(0, -74 * u, 16 * u, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 9);
  ctx.strokeStyle = '#fff8dc';
  ctx.lineWidth = Math.max(1.5, 2 * u);
  ctx.beginPath();
  ctx.arc(0, -74 * u, 20 * u, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  /* phone */
  ctx.fillStyle = '#111318';
  ctx.beginPath();
  ctx.roundRect(-8 * u, -70 * u, 16 * u, 26 * u, 3 * u);
  ctx.fill();
  ctx.fillStyle = flying ? '#8ad4ff' : '#3a4048';
  ctx.beginPath();
  ctx.roundRect(-6 * u, -68 * u, 12 * u, 20 * u, 2 * u);
  ctx.fill();

  ctx.restore();
}
