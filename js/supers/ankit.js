/* Ankit — Pinchu Stomp.

   A very large original panda falls out of the sky onto the spot the target was
   standing on when the super started, lands with a squash, belly-bounces once,
   notices the camera, waves shyly and hops away.

   The panda IS the attack: the warning ring on the floor is drawn at the same
   spot the hit box fires at, and at the same radius. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['ankit'] = {
  name: 'Pinchu Stomp',
  banner: 'PINCHU STOMP',
  phases: { startup: 0.7, action: 1.5, impact: 0.5, aftermath: 1.0 },
  damage: 36,
  /* atTarget: lands where the target stood at activation, not where they are now */
  hits: [{ at: 2.2, radius: 210, damage: 36, knock: 780, knockdown: true, hitstun: 0.8, atTarget: true }],
  radius: 210,

  draw(g, s) {
    const ctx = g.ctx;
    const landAt = 2.2;
    const elapsed = s.elapsed;

    const landX = s.landX !== undefined ? s.landX : s.x;
    const ground = g.project(landX, 0);
    if (!ground) return;
    const u = ground.s;

    /* ---- warning shadow, growing as it falls ---- */
    if (elapsed < landAt + 0.1) {
      const k = Math.min(1, elapsed / landAt);
      const rad = 210 * u * (0.35 + 0.65 * k);
      ctx.save();
      ctx.globalAlpha = 0.14 + 0.2 * k;
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(ground.x, ground.y, rad, rad * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4 + 0.3 * Math.abs(Math.sin(elapsed * 9));
      ctx.strokeStyle = '#9fd6a8';
      ctx.lineWidth = Math.max(2, 3 * u);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- the fall ---- */
    if (elapsed < landAt) {
      const k = Math.pow(Math.max(0, elapsed - 0.5) / (landAt - 0.5), 2);
      const height = (1 - k) * 620;
      drawPanda(ctx, ground.x, ground.y - height * u, u, 1 + (1 - k) * 0.15, 0);
      return;
    }

    /* ---- landing, bounce, wave, hop ---- */
    const after = elapsed - landAt;
    let yOff = 0;
    let squashY = 1;
    let hopX = 0;

    if (after < 0.18) {
      squashY = 0.72 + (after / 0.18) * 0.28;
    } else if (after < 0.55) {
      const b = Math.sin(((after - 0.18) / 0.37) * Math.PI);
      yOff = -b * 26;
      squashY = 1 + b * 0.12;
    } else if (after > 0.95) {
      const hop = (after - 0.95) / 0.6;
      yOff = -Math.sin(Math.min(1, hop) * Math.PI) * 60;
      hopX = Math.min(1, hop) * 190;
    }

    drawPanda(ctx, ground.x + hopX * u, ground.y + yOff * u, u, squashY, after);

    /* dust ring on touchdown */
    if (after < 0.5) {
      const k = after / 0.5;
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.55;
      ctx.strokeStyle = '#e2ceb6';
      ctx.lineWidth = Math.max(2, 4 * u * (1 - k));
      ctx.beginPath();
      ctx.ellipse(ground.x, ground.y, (60 + k * 190) * u, (20 + k * 70) * u, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};

/* --------------------------------------------------------------- the panda */

function furEdge(ctx, x, y, rx, ry, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  const bumps = 22;
  for (let i = 0; i <= bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    const wob = 1 + Math.sin(i * 2.7) * 0.035;
    const px = x + Math.cos(a) * rx * wob;
    const py = y + Math.sin(a) * ry * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPanda(ctx, x, y, u, squashY, after) {
  const cream = '#f2ede3';
  const creamShade = '#ddd5c6';
  const ink = '#22242a';

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squashY);

  ctx.globalAlpha = 0.32;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 52 * u, 13 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* legs */
  for (const side of [-1, 1]) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.roundRect(side * 26 * u - 12 * u, -34 * u, 24 * u, 34 * u, 12 * u);
    ctx.fill();
    ctx.fillStyle = '#15161a';
    ctx.beginPath();
    ctx.ellipse(side * 26 * u, -2 * u, 15 * u, 8 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* belly */
  furEdge(ctx, 0, -62 * u, 54 * u, 46 * u, cream);
  ctx.fillStyle = creamShade;
  ctx.beginPath();
  ctx.ellipse(0, -50 * u, 34 * u, 28 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  /* arms */
  for (const side of [-1, 1]) {
    const wave = after > 0.6 && after < 1.4 && side === 1 ? Math.sin(after * 22) * 0.5 : 0;
    ctx.save();
    ctx.translate(side * 46 * u, -84 * u);
    ctx.rotate(side * 0.35 + wave);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.roundRect(-11 * u, 0, 22 * u, 40 * u, 11 * u);
    ctx.fill();
    ctx.fillStyle = '#15161a';
    ctx.beginPath();
    ctx.arc(0, 40 * u, 12 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* head */
  const hy = -128 * u;
  furEdge(ctx, 0, hy, 40 * u, 36 * u, cream);

  /* ears */
  for (const side of [-1, 1]) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(side * 30 * u, hy - 28 * u, 14 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  /* eye patches, eyes, nose, mouth */
  for (const side of [-1, 1]) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(side * 15 * u, hy - 2 * u, 13 * u, 16 * u, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(side * 15 * u, hy - 3 * u, 5.5 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(side * 15 * u + 1.5 * u, hy - 2 * u, 3 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, hy + 12 * u, 7 * u, 5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, hy + 17 * u);
  ctx.lineTo(0, hy + 21 * u);
  ctx.moveTo(0, hy + 21 * u);
  ctx.quadraticCurveTo(-7 * u, hy + 27 * u, -11 * u, hy + 21 * u);
  ctx.moveTo(0, hy + 21 * u);
  ctx.quadraticCurveTo(7 * u, hy + 27 * u, 11 * u, hy + 21 * u);
  ctx.stroke();

  ctx.restore();
}
