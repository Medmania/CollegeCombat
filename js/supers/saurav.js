/* Saurav — Thigh Drop.

   He squats, leaps off the top of the screen and comes down thighs first. A
   shadow on the floor grows while he is up there, so you can see exactly where
   it will land and run. The slam throws up floor tiles and an office chair;
   anyone caught is flattened and pops back.

   He is drawn as his whole self — head, torso, both arms and both legs, jointed
   at the knees — never as a pair of detached legs. Code only, no images. */

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

    /* ---- warning shadow, growing the whole way down ---- */
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

    /* ---- the leap: he rises, then drops, measured in screen heights ---- */
    if (el >= jumpAt && el < landAt) {
      const k = (el - jumpAt) / (landAt - jumpAt);
      /* a clean arc: on the floor at both ends, highest in the middle */
      const height = Math.sin(k * Math.PI) * 150;
      drawSaurav(ctx, land.x, land.y - height * u, u * (0.95 + (1 - k) * 0.25), k, el);
      return;
    }

    /* ---- impact ---- */
    if (el >= landAt) {
      const after = el - landAt;

      /* he is on the floor, crouched over the landing */
      if (after < 0.9) {
        drawSaurav(ctx, land.x, land.y, u, 1, el, after);
      }

      if (after < 0.55) {
        const k = after / 0.55;
        for (let i = 0; i < 7; i++) {
          const a = -0.2 + (i / 7) * (Math.PI + 0.4);
          softPuff(ctx, land.x + Math.cos(a) * (60 + k * 200) * u, land.y - Math.sin(a) * (20 + k * 60) * u, (18 + k * 34) * u, (1 - k) * 0.5, 'rgba(217,195,165,0.9)', i + 4);
        }
      }

      /* floor tiles and an office chair thrown out */
      if (after < 0.9) {
        const k = after / 0.9;
        for (let i = 0; i < 9; i++) {
          const dir = i % 2 ? 1 : -1;
          const px = land.x + dir * (40 + k * (200 + i * 18)) * u;
          const py = land.y - Math.sin(k * Math.PI) * (70 + i * 12) * u;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(k * 7 * dir + i);
          if (i === 4) drawChair(ctx, u);
          else {
            /* a floor tile with thickness */
            ctx.fillStyle = i % 3 ? '#8a6a4a' : '#a8835c';
            ctx.fillRect(-8 * u, -6 * u, 16 * u, 12 * u);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(-8 * u, 4 * u, 16 * u, 2 * u);
          }
          ctx.restore();
        }
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

/* an office chair: seat, back, post, base and wheels */
function drawChair(ctx, u) {
  ctx.fillStyle = '#3a3f47';
  ctx.beginPath();
  ctx.roundRect(-10 * u, -6 * u, 20 * u, 6 * u, 2 * u);   /* seat */
  ctx.fill();
  ctx.fillRect(-10 * u, -20 * u, 6 * u, 15 * u);          /* back */
  ctx.fillStyle = '#5a616b';
  ctx.fillRect(-1.5 * u, 0, 3 * u, 10 * u);               /* post */
  ctx.beginPath();
  ctx.moveTo(-9 * u, 10 * u);
  ctx.lineTo(9 * u, 10 * u);
  ctx.strokeStyle = '#5a616b';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  ctx.fillStyle = '#1b1e24';
  for (const wx of [-9, 0, 9]) {
    ctx.beginPath();
    ctx.arc(wx * u, 12 * u, 2.4 * u, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* the whole fighter, jointed: head, torso, both arms, both legs */
function drawSaurav(ctx, x, y, u, k, el, after) {
  const shirt = '#5b4b8a';
  const shorts = '#2f2547';
  const skin = '#e3b489';

  /* crouch on landing, tuck in the air */
  const crouch = after !== undefined ? Math.max(0, 1 - after * 3) : 0;
  const tuck = after === undefined ? 1 : 0;

  ctx.save();
  ctx.translate(x, y);

  /* contact shadow */
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34 * u, 9 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const hipY = (-56 + crouch * 20) * u;
  const shoulderY = hipY - 34 * u;

  /* legs, jointed at the knee */
  for (const side of [-1, 1]) {
    const hipX = side * 11 * u;
    const kneeX = side * (13 + tuck * 4) * u;
    const kneeY = hipY + (tuck ? 26 : 22) * u;
    const footX = side * (12 - tuck * 5) * u;
    const footY = tuck ? hipY + 34 * u : -2 * u;

    ctx.strokeStyle = shorts;
    ctx.lineCap = 'round';
    ctx.lineWidth = 17 * u;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.stroke();

    ctx.strokeStyle = skin;
    ctx.lineWidth = 13 * u;
    ctx.beginPath();
    ctx.moveTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();

    /* shoe */
    ctx.fillStyle = '#241d33';
    ctx.beginPath();
    ctx.ellipse(footX, footY, 10 * u, 5 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* torso */
  const g = ctx.createLinearGradient(-14 * u, shoulderY, 14 * u, hipY);
  g.addColorStop(0, '#7a68ad');
  g.addColorStop(0.5, shirt);
  g.addColorStop(1, '#3f3363');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-15 * u, shoulderY, 30 * u, hipY - shoulderY + 6 * u, 10 * u);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.4 * u;
  ctx.stroke();

  /* arms, up in the air, down on landing */
  for (const side of [-1, 1]) {
    const ax = side * 14 * u;
    const elbowY = shoulderY + (tuck ? -16 : 20) * u;
    const handY = shoulderY + (tuck ? -30 : 34) * u;
    ctx.strokeStyle = shirt;
    ctx.lineWidth = 10 * u;
    ctx.beginPath();
    ctx.moveTo(ax, shoulderY + 4 * u);
    ctx.lineTo(ax + side * 8 * u, elbowY);
    ctx.stroke();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 8 * u;
    ctx.beginPath();
    ctx.moveTo(ax + side * 8 * u, elbowY);
    ctx.lineTo(ax + side * 6 * u, handY);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(ax + side * 6 * u, handY, 5 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  /* head */
  const headY = shoulderY - 16 * u;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, headY, 13 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(0, headY - 2 * u, 13 * u, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();

  /* eyes and a determined mouth */
  ctx.fillStyle = '#181a1f';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * 4.5 * u, headY + 1 * u, 1.8 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(120,60,50,0.8)';
  ctx.lineWidth = 1.4 * u;
  ctx.beginPath();
  ctx.moveTo(-3 * u, headY + 7 * u);
  ctx.lineTo(3 * u, headY + 7 * u);
  ctx.stroke();

  ctx.restore();
}
