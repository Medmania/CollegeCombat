/* Anmol — Lanka Mode.

   The lights dim, a giant theatrical shadow rises behind him wearing a crown,
   its cape flying, and an enormous laugh rolls out. Visible air ripples shove
   the target into a panicked cartoon run. The laugh ends in a coughing fit.

   The shadow is sized against the screen, so the crown always stays in frame. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['anmol'] = {
  name: 'Lanka Mode',
  banner: 'LANKA MODE',
  phases: { startup: 1.0, action: 1.4, impact: 0.4, aftermath: 1.0 },
  damage: 10,
  radius: 260,
  hits: [
    { at: 1.3, radius: 260, damage: 4, knock: 420, hitstun: 0.2, atTarget: true },
    { at: 1.8, radius: 260, damage: 4, knock: 420, hitstun: 0.2, atTarget: true },
    { at: 2.3, radius: 260, damage: 2, knock: 300, hitstun: 0.2, atTarget: true }
  ],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    if (!pr) return;

    const u = pr.s;
    const el = s.elapsed;
    const riseAt = 0.35;
    const endAt = 2.8;

    /* ---- the shadow rising behind him ---- */
    if (el > riseAt && el < endAt + 0.4) {
      const k = Math.min(1, (el - riseAt) / 0.7);
      const fade = Math.min(1, Math.max(0, (endAt + 0.4 - el) / 0.5));
      /* sized to the screen so the crown never leaves the frame */
      const hgt = g.H * 0.56 * k;
      const bx = pr.x;
      const by = pr.y;

      ctx.save();
      ctx.globalAlpha = 0.55 * fade;
      ctx.fillStyle = '#0d0a12';

      /* body: a huge tapered silhouette */
      ctx.beginPath();
      ctx.moveTo(bx - 34 * u, by);
      ctx.quadraticCurveTo(bx - 74 * u, by - hgt * 0.5, bx - 48 * u, by - hgt * 0.84);
      ctx.quadraticCurveTo(bx, by - hgt * 1.0, bx + 48 * u, by - hgt * 0.84);
      ctx.quadraticCurveTo(bx + 74 * u, by - hgt * 0.5, bx + 34 * u, by);
      ctx.closePath();
      ctx.fill();

      /* head */
      ctx.beginPath();
      ctx.arc(bx, by - hgt * 0.9, 24 * u, 0, Math.PI * 2);
      ctx.fill();

      /* crown with spikes */
      ctx.fillStyle = '#c9a227';
      ctx.globalAlpha = 0.75 * fade;
      ctx.beginPath();
      ctx.moveTo(bx - 26 * u, by - hgt * 0.95);
      ctx.lineTo(bx - 17 * u, by - hgt * 1.02);
      ctx.lineTo(bx - 8 * u, by - hgt * 0.96);
      ctx.lineTo(bx, by - hgt * 1.04);
      ctx.lineTo(bx + 8 * u, by - hgt * 0.96);
      ctx.lineTo(bx + 17 * u, by - hgt * 1.02);
      ctx.lineTo(bx + 26 * u, by - hgt * 0.95);
      ctx.closePath();
      ctx.fill();

      /* glowing eyes */
      ctx.globalAlpha = 0.9 * fade;
      ctx.fillStyle = '#ff5a45';
      for (const dx of [-9, 9]) {
        ctx.beginPath();
        ctx.ellipse(bx + dx * u, by - hgt * 0.91, 4.5 * u, 2.8 * u, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      /* cape, flying */
      ctx.globalAlpha = 0.45 * fade;
      ctx.fillStyle = '#2a1f38';
      const flap = Math.sin(el * 7) * 20 * u;
      ctx.beginPath();
      ctx.moveTo(bx - 42 * u, by - hgt * 0.8);
      ctx.quadraticCurveTo(bx - 118 * u + flap, by - hgt * 0.5, bx - 96 * u + flap, by - hgt * 0.1);
      ctx.quadraticCurveTo(bx - 62 * u, by - hgt * 0.3, bx - 30 * u, by - hgt * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* ---- the ripples ---- */
    if (el > 1.0 && el < endAt) {
      const landX = s.landX !== undefined ? s.landX : s.x;
      const land = g.project(landX, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const t = ((el - 1.0) * 1.4 + i * 0.25) % 1;
        ctx.globalAlpha = (1 - t) * 0.35;
        ctx.strokeStyle = '#b48bff';
        ctx.lineWidth = (4 - i * 0.6) * u;
        ctx.beginPath();
        if (land) {
          ctx.ellipse(land.x, land.y - 70 * u, (60 + t * 260) * u, (40 + t * 190) * u, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(pr.x, pr.y - 70 * u, (60 + t * 260) * u, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ---- the cough ---- */
    const after = el - endAt;
    if (after > 0 && after < 1.0) {
      const k = Math.min(1, after / 0.2);
      ctx.save();
      ctx.globalAlpha = (1 - after) * k;
      ctx.fillStyle = '#e6e6ee';
      ctx.font = `900 ${Math.round(11 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      const bob = Math.sin(after * 22) * 3 * u;
      ctx.fillText('cough  cough', pr.x, pr.y - 160 * u + bob);
      ctx.restore();
    }
  },

  /* the lights going down */
  overlay(g, s) {
    const el = s.elapsed;
    if (el < 0.3 || el > 3.2) return;
    const dim = Math.min(1, (el - 0.3) / 0.4) * Math.min(1, Math.max(0, (3.2 - el) / 0.6));
    const ctx = g.ctx;
    ctx.save();
    ctx.globalAlpha = 0.45 * dim;
    ctx.fillStyle = '#06040a';
    ctx.fillRect(0, 0, g.W, g.H);
    ctx.restore();
  }
};
