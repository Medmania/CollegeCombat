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
      /* see-through glass with the liquid level falling as he drinks */
      const glassGrad = ctx.createLinearGradient(-7 * u, 0, 7 * u, 0);
      glassGrad.addColorStop(0, 'rgba(220,240,235,0.65)');
      glassGrad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      glassGrad.addColorStop(1, 'rgba(200,225,220,0.6)');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.roundRect(-7 * u, -26 * u, 14 * u, 40 * u, 5 * u);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.2 * u;
      ctx.stroke();

      /* the drink, draining as he chugs */
      const level = 14 - chug * 10;
      const drink = ctx.createLinearGradient(0, -26 * u + (26 - level) * u, 0, 14 * u);
      drink.addColorStop(0, '#7ddc8a');
      drink.addColorStop(1, '#2f6b3a');
      ctx.fillStyle = drink;
      ctx.beginPath();
      ctx.roundRect(-6 * u, (-26 + (14 - level)) * u, 12 * u, level * u, 4 * u);
      ctx.fill();

      /* bubbles rising through it */
      ctx.fillStyle = 'rgba(230,255,235,0.8)';
      for (let b = 0; b < 3; b++) {
        const by = (el * 22 + b * 9) % level;
        ctx.beginPath();
        ctx.arc(-2 * u + (b % 2) * 4 * u, (-26 + (14 - level) + by) * u, 1.2 * u, 0, Math.PI * 2);
        ctx.fill();
      }
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
    ctx.globalAlpha = Math.max(0, 0.6 - after * 0.18);
    /* a glossy puddle: bright core, darker rim, a specular streak */
    const pud = ctx.createRadialGradient(land.x - 40 * u, land.y - 8 * u, 4, land.x, land.y, 170 * u * spread);
    pud.addColorStop(0, '#a8f0b4');
    pud.addColorStop(0.55, '#5fc272');
    pud.addColorStop(1, '#2c6b3a');
    ctx.fillStyle = pud;
    ctx.beginPath();
    ctx.ellipse(land.x, land.y, 170 * u * spread, 170 * u * 0.34 * spread, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0, 0.5 - after * 0.15);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.ellipse(land.x - 40 * u, land.y - 6 * u, 46 * u * spread, 12 * u * spread, -0.15, 0, Math.PI * 2);
    ctx.stroke();
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
