/* 31 — Level Niklenge.

   He chugs from a cartoon bottle, turns green, his cheeks balloon and he
   wobbles, then launches a big green slime arc that splashes down and leaves a
   slow puddle. He wipes his mouth and gives a proud thumbs-up.

   Everything is cartoon: no detail, just a fat green blob with a wobble. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['thirtyone'] = {
  name: 'Level Niklenge',
  banner: 'LEVEL SABKE NIKLENGE',
  phases: { startup: 1.0, action: 1.2, impact: 0.5, aftermath: 1.0 },
  damage: 20,
  radius: 170,
  hits: [{ at: 2.2, radius: 170, damage: 20, knock: 360, hitstun: 0.4, slow: 1.6, atTarget: true }],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    const landX = s.landX !== undefined ? s.landX : s.x;
    const land = g.project(landX, 0);
    if (!pr || !land) return;

    const u = pr.s;
    const el = s.elapsed;
    const throwAt = 1.4;
    const landAt = 2.2;

    /* ---- chug, then green cheeks ---- */
    if (el < throwAt) {
      const chug = Math.min(1, el / 0.9);

      /* the bottle tipping into his mouth */
      ctx.save();
      ctx.translate(pr.x - 22 * u, pr.y - 118 * u);
      ctx.rotate(-0.7 - chug * 0.5);
      ctx.fillStyle = '#3f7d4a';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.8 * u;
      ctx.beginPath();
      ctx.roundRect(-7 * u, -26 * u, 14 * u, 40 * u, 5 * u);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e8f0ff';
      ctx.fillRect(-7 * u, -18 * u, 14 * u, 12 * u);
      ctx.fillStyle = '#2b2f36';
      ctx.beginPath();
      ctx.roundRect(-4 * u, -32 * u, 8 * u, 8 * u, 2 * u);
      ctx.fill();
      ctx.restore();

      /* green rising in his face */
      ctx.save();
      ctx.globalAlpha = 0.55 * chug;
      ctx.fillStyle = '#7ddc8a';
      ctx.beginPath();
      ctx.ellipse(pr.x, pr.y - 112 * u, 17 * u, 19 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* ballooning cheeks */
      const puff = Math.max(0, (chug - 0.45) / 0.55);
      if (puff > 0) {
        ctx.save();
        ctx.fillStyle = '#8ee89a';
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1.4 * u;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(pr.x + side * 15 * u, pr.y - 104 * u, 9 * u * puff, 8 * u * puff, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      /* wobble */
      if (chug > 0.6) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#a7f3b8';
        ctx.lineWidth = 2 * u;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(pr.x, pr.y - 112 * u, (26 + i * 9) * u, -0.6, 0.6);
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }

    /* ---- the green arc ---- */
    if (el < landAt) {
      const k = Math.min(1, (el - throwAt) / (landAt - throwAt));
      const bx = pr.x + (land.x - pr.x) * k;
      const by = pr.y - (110 + Math.sin(k * Math.PI) * 120) * u;

      /* splash zone warning */
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.2 * k;
      ctx.fillStyle = '#7ddc8a';
      ctx.beginPath();
      ctx.ellipse(land.x, land.y, 170 * u * (0.4 + k * 0.6), 170 * u * 0.34 * (0.4 + k * 0.6), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* the blob, wobbling as it flies */
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(k * 5);
      const wob = 1 + Math.sin(el * 22) * 0.12;
      ctx.fillStyle = '#6fd07f';
      ctx.strokeStyle = 'rgba(30,80,40,0.5)';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26 * u * wob, 22 * u / wob, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(-8 * u, -8 * u, 8 * u, 5 * u, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* droplets trailing behind */
      ctx.save();
      ctx.fillStyle = '#6fd07f';
      for (let i = 1; i <= 4; i++) {
        const kk = Math.max(0, k - i * 0.07);
        const dx = pr.x + (land.x - pr.x) * kk;
        const dy = pr.y - (110 + Math.sin(kk * Math.PI) * 120) * u;
        ctx.globalAlpha = 0.5 - i * 0.1;
        ctx.beginPath();
        ctx.arc(dx, dy, (6 - i) * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    /* ---- splash and the slow puddle ---- */
    const after = el - landAt;
    ctx.save();
    const spread = Math.min(1, after / 0.35);
    ctx.globalAlpha = Math.max(0, 0.55 - after * 0.18);
    ctx.fillStyle = '#5fc272';
    ctx.beginPath();
    ctx.ellipse(land.x, land.y, 170 * u * spread, 170 * u * 0.34 * spread, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* puddle bubbles */
    if (after < 1.2) {
      ctx.save();
      ctx.fillStyle = 'rgba(160,240,170,0.6)';
      for (let i = 0; i < 6; i++) {
        const ph = (after * 1.6 + i * 0.4) % 1;
        ctx.globalAlpha = 0.5 * (1 - ph);
        ctx.beginPath();
        ctx.arc(land.x + Math.sin(i * 2.3) * 90 * u, land.y - ph * 26 * u, (3 + ph * 4) * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /* ---- proud thumbs-up ---- */
    if (el > 3.2) {
      const k = Math.min(1, (el - 3.2) / 0.3);
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.roundRect(pr.x + 30 * u, pr.y - 150 * u, 16 * u, 20 * u, 5 * u);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(pr.x + 30 * u, pr.y - 136 * u, 8 * u, 8 * u);
      ctx.restore();
    }
  }
};
