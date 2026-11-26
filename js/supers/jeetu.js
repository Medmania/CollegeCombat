/* Jeetu — Kaniya Beam.

   His eyes charge while loose pebbles lift off the floor, then twin beams fire
   with a hot white core, a glow, sparks and a scorch trail. Whoever is caught
   comes out with a smoking cartoon hairstyle. He blinks and rubs his eyes.

   The beam visually tracks the target so it always reads as a beam, and it is
   drawn a little past them so it never collapses into a smudge when the two
   fighters are standing close together. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['jeetu'] = {
  name: 'Kaniya Beam',
  banner: 'KANIYA BEAM',
  phases: { startup: 0.8, action: 1.4, impact: 0.4, aftermath: 0.8 },
  damage: 14,
  radius: 340,
  hits: [
    { at: 1.1, radius: 340, damage: 5, knock: 40, hitstun: 0.12, atTarget: true },
    { at: 1.55, radius: 340, damage: 5, knock: 40, hitstun: 0.12, atTarget: true },
    { at: 2.0, radius: 340, damage: 4, knock: 180, hitstun: 0.25, atTarget: true }
  ],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    if (!pr) return;

    /* track whoever is being hit right now, falling back to the planted spot */
    const aimX = s.targetX !== undefined ? s.targetX : s.landX !== undefined ? s.landX : s.x;
    const aim = g.project(aimX, 0);
    if (!aim) return;

    const u = pr.s;
    const el = s.elapsed;
    const eyeY = pr.y - 118 * u;
    const targetY = aim.y - 110 * u;
    const fireAt = 0.8;
    const stopAt = 2.2;

    /* direction of the beam, extended past the target so it reads */
    let dx = aim.x - pr.x;
    let dy = targetY - eyeY;
    const len = Math.hypot(dx, dy) || 1;
    const minLen = 150 * u;
    const reach = Math.max(len, minLen) + 40 * u;
    const ux = dx / len;
    const uy = dy / len;
    const endX = pr.x + ux * reach;
    const endY = eyeY + uy * reach;

    /* ---- charge: pebbles lift, eyes glow ---- */
    if (el < fireAt + 0.1) {
      const k = Math.min(1, el / fireAt);

      ctx.save();
      ctx.fillStyle = '#8a7a6a';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rad = (70 - k * 40) * u;
        const px = pr.x + Math.cos(a) * rad;
        const py = pr.y - 10 * u + Math.sin(a) * rad * 0.4 - k * 40 * u;
        ctx.globalAlpha = 0.5 + k * 0.4;
        ctx.beginPath();
        ctx.ellipse(px, py, 4 * u, 3 * u, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = 'rgba(160,220,255,0.85)';
      for (const d of [-6, 6]) {
        ctx.beginPath();
        ctx.arc(pr.x + d * u, eyeY + 6 * u, 4 * u * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    /* ---- the twin beams ---- */
    if (el < stopAt) {
      const fade = Math.min(1, Math.max(0, (stopAt - el) / 0.3));
      const pulse = 0.85 + 0.15 * Math.sin(el * 30);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      /* the beams start just outside each eye, so the face stays readable */
      for (const off of [-9, 9]) {
        const sx = pr.x + off * u * 0.5;
        const sy = eyeY + 2 * u;
        const ex = endX;
        const ey = endY + off * u * 0.35;

        ctx.globalAlpha = 0.35 * fade;
        ctx.strokeStyle = '#7ec8ff';
        ctx.lineWidth = 11 * u * pulse;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.globalAlpha = 0.95 * fade;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * u * pulse;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      /* sparks along the beam */
      ctx.globalAlpha = 0.8 * fade;
      ctx.fillStyle = '#cfeaff';
      for (let i = 0; i < 8; i++) {
        const t = (el * 2.2 + i * 0.13) % 1;
        const sx = pr.x + (endX - pr.x) * t;
        const sy = eyeY + (endY - eyeY) * t + Math.sin(i * 3 + el * 20) * 8 * u;
        ctx.beginPath();
        ctx.arc(sx, sy, (1.5 + (i % 3)) * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      /* scorch trail on the floor */
      ctx.save();
      ctx.globalAlpha = 0.22 * fade;
      ctx.strokeStyle = '#3a2a20';
      ctx.lineWidth = 5 * u;
      ctx.beginPath();
      ctx.moveTo(pr.x, pr.y);
      ctx.lineTo(endX, aim.y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    /* ---- smoking hair, and he rubs his eyes ---- */
    const after = el - stopAt;

    if (after < 1.2) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.5 - after * 0.35);
      ctx.fillStyle = '#5a5148';
      for (let i = 0; i < 4; i++) {
        const rise = (after * 1.4 + i * 0.3) % 1;
        ctx.beginPath();
        ctx.arc(
          aim.x + Math.sin(i * 2 + after * 3) * 12 * u,
          targetY - 18 * u - rise * 40 * u,
          (6 + rise * 10) * u,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    }

    if (after > 0.3) {
      const k = Math.min(1, (after - 0.3) / 0.4);
      ctx.save();
      ctx.globalAlpha = 0.75 * k;
      ctx.strokeStyle = '#9ecbff';
      ctx.lineWidth = 2 * u;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(pr.x, eyeY + 8 * u, (10 + i * 6) * u * (0.6 + k * 0.4), 0.3, Math.PI - 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
};
