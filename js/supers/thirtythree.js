/* 33 — Scooty Express.

   He kick-starts a stubborn scooty. It coughs, fails, then roars into life and
   does a wheelie straight across the arena, headlight on, exhaust smoking,
   carrying whoever it hits. It skids to a stop and the horn goes peep peep.

   The scooty is built from separate shaded panels: body, front shield, seat,
   handle, forks, springs, spoked wheels that turn with the distance travelled,
   mirrors and an exhaust. Code only, no images. */

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
    const endAt = 2.9;

    /* ---- kick-starting ---- */
    if (el < goAt) {
      const failed = el > 0.55 && el < 0.85;
      const bob = failed ? Math.sin(el * 40) * 2 * u : 0;

      drawScooty(ctx, pr.x + 6 * u, pr.y + bob, u, 0, false, 0, el);

      if (failed) {
        for (let i = 0; i < 4; i++) {
          softPuff(ctx, pr.x - 24 * u - i * 9 * u, pr.y - 30 * u - i * 6 * u, (5 + i * 2.5) * u, 0.4 - i * 0.07, 'rgba(150,150,158,0.9)', i + 5);
        }
      }

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = failed ? '#ff8a6a' : '#ffd166';
      ctx.font = `900 ${Math.round(10 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(failed ? '...phus' : el > 0.9 ? 'VROOM' : '', pr.x, pr.y - 140 * u);
      ctx.restore();
      return;
    }

    /* ---- the wheelie charge ---- */
    if (el < endAt) {
      const k = Math.min(1, (el - goAt) / (endAt - goAt));
      const travel = Math.min(1.1, k * 1.5);
      const sx = pr.x + (land.x - pr.x) * travel + 120 * u * travel;
      const tilt = -0.45 - Math.sin(k * Math.PI) * 0.25;
      const rolled = travel * 900;          /* distance, for the wheels */

      /* dust and exhaust */
      for (let i = 0; i < 7; i++) {
        softPuff(ctx, sx - (44 + i * 34) * u, pr.y - (5 + (i % 3) * 6) * u, (12 + (i % 4) * 5) * u, 0.3, 'rgba(185,161,132,0.85)', i + 9);
      }

      drawScooty(ctx, sx, pr.y, u, tilt, true, rolled, el);
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
        ctx.lineTo(sx - (84 + i * 12) * u, land.y);
        ctx.stroke();
      }
      ctx.restore();

      drawScooty(ctx, sx, pr.y, u, 0, false, 900 + after * 40, el);

      if (after > 0.35 && after < 1.0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (1.0 - after) * 3);
        ctx.fillStyle = '#ffd166';
        ctx.font = `900 ${Math.round(11 * u)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('peep peep', sx, pr.y - 130 * u);
        ctx.restore();
      }
    }
  }
};

function paint(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

/* a shaded panel: light along the top edge, dark along the bottom */
function panel(ctx, x, y, w, h, r, base) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, paint(base, 34));
  g.addColorStop(0.45, base);
  g.addColorStop(1, paint(base, -38));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawScooty(ctx, x, y, u, tilt, lit, rolled, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt || 0);

  /* contact shadow */
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 48 * u, 10 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* ---- wheels: tyre, rim, spokes that turn with distance ---- */
  for (const wx of [-28, 30]) {
    const cx = wx * u;
    const cy = -13 * u;

    ctx.fillStyle = '#15171b';
    ctx.beginPath();
    ctx.arc(cx, cy, 13 * u, 0, Math.PI * 2);
    ctx.fill();

    /* rim */
    ctx.strokeStyle = '#9aa0a8';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.arc(cx, cy, 8 * u, 0, Math.PI * 2);
    ctx.stroke();

    /* spokes, turning with the distance travelled */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rolled || 0) / (13 * u));
    ctx.strokeStyle = 'rgba(210,214,220,0.75)';
    ctx.lineWidth = 1.4 * u;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(-7 * u, 0);
      ctx.lineTo(7 * u, 0);
      ctx.stroke();
    }
    ctx.restore();

    /* hub */
    ctx.fillStyle = '#c8ccd2';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.4 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- forks and front spring ---- */
  ctx.strokeStyle = '#2b2f36';
  ctx.lineWidth = 3 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(30 * u, -13 * u);
  ctx.lineTo(34 * u, -48 * u);
  ctx.stroke();

  ctx.strokeStyle = '#8a8f97';
  ctx.lineWidth = 2 * u;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(32 * u, (-26 - i * 4) * u);
    ctx.lineTo(36 * u, (-28 - i * 4) * u);
    ctx.stroke();
  }

  /* ---- main body ---- */
  panel(ctx, -32 * u, -40 * u, 60 * u, 24 * u, 9 * u, '#4a3b2a');

  /* glossy highlight along the top of the body */
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.roundRect(-26 * u, -37 * u, 40 * u, 5 * u, 3 * u);
  ctx.fill();

  /* ---- front shield ---- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(24 * u, -40 * u);
  ctx.quadraticCurveTo(42 * u, -54 * u, 34 * u, -70 * u);
  ctx.lineTo(21 * u, -64 * u);
  ctx.closePath();
  const shield = ctx.createLinearGradient(20 * u, -70 * u, 40 * u, -40 * u);
  shield.addColorStop(0, paint('#3a2f22', 40));
  shield.addColorStop(1, paint('#3a2f22', -20));
  ctx.fillStyle = shield;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();

  /* ---- seat ---- */
  panel(ctx, -30 * u, -47 * u, 34 * u, 9 * u, 4 * u, '#241d15');

  /* ---- handlebar, grips and mirrors ---- */
  ctx.strokeStyle = '#2b2f36';
  ctx.lineWidth = 3 * u;
  ctx.beginPath();
  ctx.moveTo(26 * u, -68 * u);
  ctx.lineTo(36 * u, -80 * u);
  ctx.stroke();

  ctx.fillStyle = '#1b1e24';
  ctx.beginPath();
  ctx.roundRect(30 * u, -84 * u, 12 * u, 4 * u, 2 * u);
  ctx.fill();

  /* mirror on a stalk */
  ctx.strokeStyle = '#3a3f47';
  ctx.lineWidth = 1.6 * u;
  ctx.beginPath();
  ctx.moveTo(34 * u, -82 * u);
  ctx.lineTo(40 * u, -92 * u);
  ctx.stroke();
  ctx.fillStyle = '#aeb6c0';
  ctx.beginPath();
  ctx.ellipse(41 * u, -93 * u, 4 * u, 3 * u, -0.3, 0, Math.PI * 2);
  ctx.fill();

  /* ---- headlight ---- */
  const lampGrad = ctx.createRadialGradient(30 * u, -60 * u, 1, 30 * u, -60 * u, 8 * u);
  lampGrad.addColorStop(0, lit ? '#fffbe0' : '#cfc8b0');
  lampGrad.addColorStop(1, lit ? '#ffe08a' : '#9d9788');
  ctx.fillStyle = lampGrad;
  ctx.beginPath();
  ctx.arc(30 * u, -60 * u, 6 * u, 0, Math.PI * 2);
  ctx.fill();

  /* the beam */
  if (lit) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    const beam = ctx.createLinearGradient(32 * u, -60 * u, 150 * u, -60 * u);
    beam.addColorStop(0, 'rgba(255,243,176,0.9)');
    beam.addColorStop(1, 'rgba(255,243,176,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(32 * u, -62 * u);
    ctx.lineTo(150 * u, -100 * u);
    ctx.lineTo(150 * u, -26 * u);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ---- exhaust and its smoke ---- */
  ctx.fillStyle = '#8a8f97';
  ctx.beginPath();
  ctx.roundRect(-40 * u, -30 * u, 14 * u, 6 * u, 3 * u);
  ctx.fill();

  if (lit) {
    for (let i = 0; i < 4; i++) {
      const t2 = ((t || 0) * 1.4 + i * 0.3) % 1;
      softPuff(ctx, -46 * u - t2 * 26 * u, -30 * u - t2 * 14 * u, (5 + t2 * 9) * u, (1 - t2) * 0.28, 'rgba(170,170,175,0.9)', i + 13);
    }
  }

  ctx.restore();
}
