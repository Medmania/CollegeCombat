/* Nikhil — Stomach Missile.

   His belly inflates like a balloon until a shirt button pings off, then it
   springs out on a cartoon elastic, bowls forward, jiggles on impact and sits
   there as a bouncy obstacle before snapping back with a BOING.

   No wounds, no gore — it is a rubbery joke, not a hit. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['nikhil'] = {
  name: 'Stomach Missile',
  banner: 'STOMACH MISSILE',
  phases: { startup: 0.9, action: 1.1, impact: 0.5, aftermath: 1.0 },
  damage: 26,
  radius: 150,
  hits: [{ at: 2.0, radius: 150, damage: 26, knock: 560, hitstun: 0.45, atTarget: true }],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    const landX = s.landX !== undefined ? s.landX : s.x;
    const land = g.project(landX, 0);
    if (!pr || !land) return;

    const u = pr.s;
    const el = s.elapsed;
    const launchAt = 1.2;
    const landAt = 2.0;

    /* ---- inflate ---- */
    if (el < launchAt) {
      const k = Math.min(1, el / 0.8);
      const r = (18 + k * 46) * u;
      const wob = 1 + Math.sin(el * 14) * 0.05 * k;

      ctx.save();
      ctx.translate(pr.x, pr.y - 62 * u);
      ctx.fillStyle = '#f0b45a';
      ctx.strokeStyle = 'rgba(90,50,10,0.5)';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * wob, r / wob, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      /* sheen */
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.28, r * 0.18, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* the button pinging off */
      if (el > 0.55) {
        const b = (el - 0.55) / 0.5;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - b);
        ctx.fillStyle = '#f7f3ec';
        ctx.beginPath();
        ctx.arc(pr.x + 40 * u + b * 90 * u, pr.y - 110 * u - Math.sin(b * 3) * 60 * u, 5 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    /* ---- the elastic stretch and the bowl ---- */
    if (el < landAt) {
      const k = Math.min(1, (el - launchAt) / (landAt - launchAt));
      const bx = pr.x + (land.x - pr.x) * k;
      const by = pr.y - 62 * u;

      /* the elastic band back to him */
      ctx.save();
      ctx.strokeStyle = 'rgba(240,180,90,0.55)';
      ctx.lineWidth = 6 * u;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pr.x, pr.y - 62 * u);
      ctx.quadraticCurveTo((pr.x + bx) / 2, pr.y - 100 * u, bx, by);
      ctx.stroke();
      ctx.restore();

      /* the belly itself */
      const stretch = 1 + (1 - k) * 0.25;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(k * 8);
      ctx.fillStyle = '#f0b45a';
      ctx.strokeStyle = 'rgba(90,50,10,0.5)';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.ellipse(0, 0, 52 * u / stretch, 46 * u * stretch, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.ellipse(-16 * u, -18 * u, 14 * u, 8 * u, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* warning ring under it */
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.2 * k;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3 * u;
      ctx.beginPath();
      ctx.ellipse(land.x, land.y, 150 * u * (0.5 + k * 0.5), 150 * u * 0.34 * (0.5 + k * 0.5), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    /* ---- jiggle, sit, snap back ---- */
    const after = el - landAt;

    if (after < 1.1) {
      const jig = Math.abs(Math.sin(after * 16)) * (1 - after / 1.1);
      const stretch = 1 + jig * 0.25;
      ctx.save();
      ctx.translate(land.x, land.y - (46 - jig * 8) * u);
      ctx.fillStyle = '#f0b45a';
      ctx.strokeStyle = 'rgba(90,50,10,0.5)';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.ellipse(0, 0, 52 * u * stretch, 46 * u / stretch, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    /* the snap-back with a BOING */
    if (after > 1.05) {
      const k = Math.min(1, (after - 1.05) / 0.35);
      const bx = land.x + (pr.x - land.x) * k;
      const by = land.y - 46 * u - Math.sin(k * Math.PI) * 60 * u;
      ctx.save();
      ctx.fillStyle = '#f0b45a';
      ctx.beginPath();
      ctx.ellipse(bx, by, 26 * u * (1 - k * 0.5), 24 * u * (1 - k * 0.5), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (k > 0.3) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - k);
        ctx.fillStyle = '#ffd166';
        ctx.font = `900 ${Math.round(15 * u)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('BOING', land.x, land.y - 120 * u);
        ctx.restore();
      }
    }
  }
};
