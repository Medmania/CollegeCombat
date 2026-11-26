/* 32 — Player 2 Has Entered.

   He pulls out a handheld console and starts playing. A pixel portal opens and a
   second 32 assembles itself out of voxels, runs in, lands a three-hit combo on
   its own, then complains about lag and dissolves.

   The clone is the attack: it lands the three hits, then it is gone. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['thirtytwo'] = {
  name: 'Player 2 Has Entered',
  banner: 'PLAYER 2 HAS ENTERED',
  phases: { startup: 1.0, action: 1.6, impact: 0.4, aftermath: 1.0 },
  damage: 15,
  radius: 170,
  hits: [
    { at: 1.55, radius: 170, damage: 5, knock: 80, hitstun: 0.14, atTarget: true },
    { at: 1.9, radius: 170, damage: 5, knock: 80, hitstun: 0.14, atTarget: true },
    { at: 2.35, radius: 170, damage: 5, knock: 260, hitstun: 0.3, atTarget: true }
  ],

  /* the voxel cube offsets that build the clone, generated once */
  voxels: (() => {
    const out = [];
    let seed = 91;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 26; i++) {
      out.push({
        x: (rnd() - 0.5) * 0.9,
        y: rnd(),
        d: rnd(),
        s: 0.55 + rnd() * 0.5,
        delay: rnd() * 0.35
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
    const portalAt = 0.55;
    const runAt = 1.3;
    const endAt = 2.9;

    /* ---- the console ---- */
    if (el < runAt) {
      ctx.save();
      ctx.translate(pr.x - 26 * u, pr.y - 96 * u);
      ctx.rotate(-0.25);
      ctx.fillStyle = '#1b1e24';
      ctx.beginPath();
      ctx.roundRect(-14 * u, -9 * u, 28 * u, 18 * u, 4 * u);
      ctx.fill();
      ctx.fillStyle = '#8ad4ff';
      ctx.beginPath();
      ctx.roundRect(-9 * u, -6 * u, 18 * u, 12 * u, 2 * u);
      ctx.fill();
      /* blinking pixel */
      ctx.fillStyle = '#e6362e';
      ctx.fillRect(6 * u, -5 * u, 2 * u, 2 * u);
      ctx.restore();
    }

    /* ---- the portal ---- */
    if (el > portalAt && el < endAt) {
      const k = Math.min(1, (el - portalAt) / 0.4);
      const fade = Math.min(1, Math.max(0, (endAt - el) / 0.4));
      ctx.save();
      ctx.globalAlpha = 0.75 * k * fade;
      ctx.strokeStyle = '#8ad4ff';
      ctx.lineWidth = 3 * u;
      const hgt = 150 * u * k;
      ctx.strokeRect(land.x - 46 * u, land.y - hgt, 92 * u, hgt);
      ctx.globalAlpha = 0.25 * k * fade;
      ctx.fillStyle = '#8ad4ff';
      ctx.fillRect(land.x - 46 * u, land.y - hgt, 92 * u, hgt);
      ctx.restore();
    }

    /* ---- the clone assembling, then running ---- */
    if (el > portalAt && el < endAt) {
      const assemble = Math.min(1, (el - portalAt) / 0.5);
      const running = el > runAt;
      const runK = running ? Math.min(1, (el - runAt) / 0.5) : 0;
      const cx = land.x + (running ? (1 - runK) * 150 * u : 0);
      const cy = land.y;

      /* the body: stacked voxels that settle into a figure */
      ctx.save();
      for (const v of this.voxels) {
        const a = Math.min(1, Math.max(0, (assemble - v.delay) / 0.25));
        if (a <= 0) continue;
        const jitter = (1 - a) * 40 * u;
        const bx = cx + v.x * 34 * u + Math.sin(el * 9 + v.d) * jitter;
        const by = cy - v.y * 110 * u - (1 - a) * 60 * u;
        const size = 9 * u * v.s;

        ctx.globalAlpha = a;
        ctx.fillStyle = v.d > 0.6 ? '#3f7fbf' : v.d > 0.3 ? '#5aa0e0' : '#2f5f8f';
        ctx.fillRect(bx - size / 2, by - size / 2, size, size);
        /* pixel outline */
        ctx.strokeStyle = 'rgba(180,225,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - size / 2, by - size / 2, size, size);
      }

      /* the punch arms, snapping out on each hit window */
      if (running) {
        const swing = Math.abs(Math.sin(el * 18));
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#8ad4ff';
        ctx.fillRect(cx + 14 * u, cy - 74 * u, (12 + swing * 16) * u, 7 * u);
        ctx.fillRect(cx - 26 * u - swing * 16 * u, cy - 60 * u, (12 + swing * 16) * u, 7 * u);
      }
      ctx.restore();
    }

    /* ---- lag, then dissolve ---- */
    if (el > 2.6) {
      const k = Math.min(1, (el - 2.6) / 0.4);
      ctx.save();
      ctx.globalAlpha = 0.85 * (1 - k * 0.5);
      ctx.fillStyle = '#ffd166';
      ctx.font = `900 ${Math.round(12 * u)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('lag...', land.x, land.y - 130 * u);
      ctx.fillStyle = 'rgba(138,212,255,0.7)';
      for (let i = 0; i < 10; i++) {
        const px = land.x + Math.sin(i * 2.3 + el * 6) * 40 * u;
        const py = land.y - (20 + i * 9) * u - k * 30 * u;
        ctx.fillRect(px, py, 4 * u, 4 * u);
      }
      ctx.restore();
    }
  }
};
