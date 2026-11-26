/* Adnan — Final Countdown.

   He plants a cartoon bomb where he stands: a twin-bell alarm clock strapped to
   a bundle of rolled office files, labelled DEADLINE. It ticks down, the danger
   ring on the floor shows exactly where it will hurt, and then it goes off.

   Gameplay lives in the `hits` table below; the engine owns the clock and the
   damage. Everything here is how it looks.

   Built from the shared art toolkit: 3D rolled files with paper edges, a metal
   clock with a glass face and moving hands, and a blast in layers — hot core,
   rolling fire lobes, ground shockwave, tumbling debris and creased paper,
   rising smoke, embers, then a scorch mark. Code only, no images. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['adnan'] = {
  name: 'Final Countdown',
  banner: 'DEADLINE',
  phases: { startup: 0.9, action: 2.3, impact: 0.5, aftermath: 0.9 },
  damage: 40,
  /* absolute seconds from activation; the ring radius matches this exactly */
  hits: [{ at: 3.35, radius: 230, damage: 40, knock: 800, knockdown: true, hitstun: 0.7 }],
  radius: 230,

  /* debris thrown out by the blast, generated once */
  debris: (() => {
    const out = [];
    let s = 17;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < 14; i++) {
      out.push({
        a: rnd() * Math.PI * 2,
        speed: 120 + rnd() * 260,
        up: 180 + rnd() * 240,
        spin: (rnd() - 0.5) * 12,
        size: 3 + rnd() * 5,
        kind: rnd() < 0.55 ? 'paper' : 'wood'
      });
    }
    return out;
  })(),

  draw(g, s) {
    const ctx = g.ctx;
    const soft = !!g.reduced;   /* reduce shake and flashes */
    const boomAt = 3.35;
    const pr = g.project(s.x, 0);
    if (!pr) return;
    const s0 = pr.s;
    const elapsed = s.elapsed;
    const dt = elapsed - boomAt;

    /* ---- danger ring: exactly the blast radius, from the start ---- */
    if (elapsed < boomAt + 0.05) {
      const left = Math.max(0, boomAt - elapsed);
      const urgency = 1 - Math.min(1, left / boomAt);
      const pulse = 0.45 + 0.55 * Math.abs(Math.sin(elapsed * (4 + urgency * 12)));
      const rad = 230 * s0;

      ctx.save();
      ctx.globalAlpha = 0.16 + 0.22 * pulse;
      ctx.fillStyle = '#ff4d3d';
      ctx.beginPath();
      ctx.ellipse(pr.x, pr.y, rad, rad * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55 + 0.35 * pulse;
      ctx.strokeStyle = '#ff8a6a';
      ctx.lineWidth = Math.max(2, 3.5 * s0);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- the bomb itself ---- */
    if (elapsed < boomAt) {
      drawBomb(ctx, pr.x, pr.y, s0, elapsed, boomAt);
    }

    /* ---- the blast, in layers ---- */
    if (dt >= 0 && dt < 2.4) {
      drawBlast(ctx, pr.x, pr.y, s0, dt, soft ? this.debris.slice(0, 6) : this.debris, soft);
    }

    /* ---- scorch mark, fading ---- */
    if (dt > 0.2) {
      const fade = Math.max(0, 1 - (dt - 0.2) / 2.2);
      scorchMark(ctx, pr.x, pr.y, 150 * s0, 0.55 * fade, 4.2);
    }
  },

  /* a burnt "Submit by EOD" sheet drifting down after the blast */
  overlay(g, s) {
    const dt = s.elapsed - 3.35;
    if (dt < 0.2 || dt > 2.6) return;
    const ctx = g.ctx;
    const fall = (dt - 0.2) * 60;
    const y = g.H * 0.18 + fall;
    if (y > g.H + 40) return;
    const x = g.W * 0.62 + Math.sin(dt * 2.2) * 40;
    const spin = Math.sin(dt * 1.6) * 0.4;

    ctx.save();
    ctx.globalAlpha = Math.min(1, (2.6 - dt) / 0.6);
    ctx.translate(x, y);
    ctx.rotate(spin);

    /* creased paper, with a curled corner */
    const grad = ctx.createLinearGradient(-26, -16, 26, 16);
    grad.addColorStop(0, '#4a4038');
    grad.addColorStop(0.6, '#332b25');
    grad.addColorStop(1, '#241e1a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-26, -16);
    ctx.lineTo(26, -16);
    ctx.lineTo(26, 16);
    ctx.lineTo(-26, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,140,80,0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#ffb37a';
    ctx.font = '900 8px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SUBMIT', 0, -3);
    ctx.fillText('BY EOD', 0, 8);
    ctx.restore();
  }
};

/* ------------------------------------------------------------- the bomb */

function drawBomb(ctx, x, y, u, elapsed, boomAt) {
  const jitter = elapsed > boomAt - 0.9 ? (Math.random() - 0.5) * 2.2 * u * (1 - (boomAt - elapsed)) : 0;
  const tick = elapsed * (elapsed > boomAt - 0.9 ? 26 : 7);

  ctx.save();
  ctx.translate(x + jitter, y);

  /* contact shadow */
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 46 * u, 12 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* ---- rolled files: cylinders with paper edges and string ---- */
  for (let i = 0; i < 4; i++) {
    const ox = (-24 + i * 16) * u;
    const h = 44 * u;
    const w = 16 * u;

    /* the roll */
    const g = ctx.createLinearGradient(ox - w / 2, 0, ox + w / 2, 0);
    g.addColorStop(0, '#efe3c8');
    g.addColorStop(0.45, '#e2d3b2');
    g.addColorStop(1, '#b9a882');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(ox - w / 2, -h, w, h, 5 * u);
    ctx.fill();

    /* the rolled end, an ellipse so it reads as paper wound up */
    ctx.fillStyle = '#f6ecd6';
    ctx.beginPath();
    ctx.ellipse(ox, -h, w / 2, 3.4 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,98,64,0.55)';
    ctx.lineWidth = 1 * u;
    ctx.beginPath();
    ctx.ellipse(ox, -h, w * 0.28, 1.9 * u, 0, 0, Math.PI * 2);
    ctx.stroke();

    /* string */
    ctx.strokeStyle = '#b03a2e';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(ox - w / 2, -h * 0.62);
    ctx.lineTo(ox + w / 2, -h * 0.62);
    ctx.stroke();
  }

  /* ---- metal clock ---- */
  const cy = -66 * u;

  /* bells, with a shine */
  for (const side of [-1, 1]) {
    const bx = side * 17 * u;
    const by = cy - 16 * u;
    const bg = ctx.createRadialGradient(bx - 3 * u, by - 3 * u, 1, bx, by, 10 * u);
    bg.addColorStop(0, '#f2ede2');
    bg.addColorStop(0.6, '#c3bbaa');
    bg.addColorStop(1, '#8d8677');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(bx, by, 9 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  /* body: metal band */
  const bodyGrad = ctx.createRadialGradient(-6 * u, cy - 6 * u, 2, 0, cy, 24 * u);
  bodyGrad.addColorStop(0, '#f0ebe0');
  bodyGrad.addColorStop(0.55, '#cdc5b4');
  bodyGrad.addColorStop(1, '#8b8476');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, cy, 22 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a5449';
  ctx.lineWidth = 1.6 * u;
  ctx.stroke();

  /* glass face */
  const face = ctx.createRadialGradient(-4 * u, cy - 5 * u, 1, 0, cy, 17 * u);
  face.addColorStop(0, '#ffffff');
  face.addColorStop(0.7, '#f7f2e6');
  face.addColorStop(1, '#ded6c4');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(0, cy, 16 * u, 0, Math.PI * 2);
  ctx.fill();

  /* hour marks */
  ctx.strokeStyle = 'rgba(60,56,48,0.5)';
  ctx.lineWidth = 1.2 * u;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 12.5 * u, cy + Math.sin(a) * 12.5 * u);
    ctx.lineTo(Math.cos(a) * 14.5 * u, cy + Math.sin(a) * 14.5 * u);
    ctx.stroke();
  }

  /* hands, sweeping faster as it gets close */
  ctx.strokeStyle = '#22262c';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(Math.sin(tick) * 10 * u, cy - Math.cos(tick) * 10 * u);
  ctx.stroke();
  ctx.lineWidth = 1.4 * u;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(Math.sin(tick / 12) * 7 * u, cy - Math.cos(tick / 12) * 7 * u);
  ctx.stroke();
  ctx.fillStyle = '#22262c';
  ctx.beginPath();
  ctx.arc(0, cy, 1.8 * u, 0, Math.PI * 2);
  ctx.fill();

  /* glass highlight */
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.6 * u;
  ctx.beginPath();
  ctx.arc(0, cy, 15 * u, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();

  /* DEADLINE label */
  ctx.fillStyle = '#ffd166';
  ctx.font = `900 ${Math.round(11 * u)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.lineWidth = 3 * u;
  ctx.strokeText('DEADLINE', 0, 16 * u);
  ctx.fillText('DEADLINE', 0, 16 * u);

  /* countdown digits */
  if (elapsed > boomAt - 2.3) {
    const left = boomAt - elapsed;
    const n = Math.max(1, Math.ceil(left / 0.8));
    const pop = 1 + 0.35 * Math.max(0, 1 - ((left % 0.8) / 0.8) * 3);
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.font = `900 ${Math.round(34 * u * pop)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 6 * u;
    ctx.strokeText(String(n), 0, -108 * u);
    ctx.fillStyle = '#ff5a45';
    ctx.fillText(String(n), 0, -108 * u);
    ctx.restore();
  }

  ctx.restore();
}

/* ------------------------------------------------------------ the blast */

function drawBlast(ctx, x, y, u, dt, debris, soft) {
  /* 1. short hot core — skipped when the player asked for fewer flashes */
  if (dt < 0.5 && !soft) {
    const k = dt / 0.5;
    const r = 90 * u * (0.5 + k * 0.8);
    const core = ctx.createRadialGradient(x, y - 40 * u, 2, x, y - 40 * u, r);
    core.addColorStop(0, `rgba(255,255,250,${0.95 * (1 - k)})`);
    core.addColorStop(0.4, `rgba(255,226,150,${0.8 * (1 - k)})`);
    core.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(x, y - 40 * u, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* 2. uneven rolling fire lobes, white to yellow to orange to dark red */
  if (dt < 1.5) {
    const k = Math.min(1, dt / 0.9);
    const heat = ['#fffdf0', '#ffe9a8', '#ffb14a', '#d9552a', '#8d2f18'];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.4;
      const spread = 210 * u * (0.35 + k * 0.65);
      const px = x + Math.cos(a) * spread * 0.75;
      const py = y - 40 * u + Math.sin(a) * spread * 0.42;
      const r = (26 + (i % 3) * 12) * u * (0.7 + k * 0.8);
      const col = heat[Math.min(heat.length - 1, Math.floor(k * 3) + (i % 2))];
      softPuff(ctx, px, py, r, (1 - k) * 0.55, col, i * 1.7);
    }
  }

  /* 3. ground shockwave, in floor perspective */
  if (dt < 0.7) {
    const k = dt / 0.7;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.8;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = Math.max(2, 6 * u * (1 - k));
    ctx.beginPath();
    ctx.ellipse(x, y, (60 + k * 300) * u, (20 + k * 105) * u, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* 4. tumbling debris and creased paper */
  if (dt < 1.8) {
    for (const d of debris) {
      const t = dt;
      const px = x + Math.cos(d.a) * d.speed * t * u * 0.55;
      const py = y - (d.up * t - 480 * t * t) * u * 0.55;
      if (py > y + 10 * u) continue;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(d.spin * t);
      ctx.globalAlpha = Math.max(0, 1 - t / 1.8);
      if (d.kind === 'paper') {
        ctx.fillStyle = '#efe3c8';
        ctx.fillRect(-d.size * u, -d.size * 0.7 * u, d.size * 2 * u, d.size * 1.4 * u);
      } else {
        ctx.fillStyle = '#6b5236';
        ctx.fillRect(-d.size * u, -d.size * 0.4 * u, d.size * 2 * u, d.size * 0.8 * u);
      }
      ctx.restore();
    }
  }

  /* 5. dark smoke rising and thinning */
  if (dt > 0.15 && dt < 2.2) {
    smokeColumn(ctx, x, y - 20 * u, 170 * u, dt, 'rgba(74,66,58,0.9)', 3.3);
  }

  /* 6. embers */
  if (dt > 0.1 && dt < 1.6) {
    ctx.save();
    ctx.fillStyle = '#ffb14a';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + dt;
      const t = dt * 0.8;
      const px = x + Math.cos(a) * (40 + t * 90) * u;
      const py = y - (60 + Math.sin(a) * 30 + t * 30) * u;
      ctx.globalAlpha = Math.max(0, 1 - dt / 1.6) * 0.9;
      ctx.beginPath();
      ctx.arc(px, py, (1.4 + (i % 3)) * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
