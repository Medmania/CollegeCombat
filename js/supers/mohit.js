/* Mohit — Paglu Vision.

   Filmi slow motion: a spotlight snaps on, the wind picks up, he winks
   enormously, and floating hearts gather into a beam. The target cringes and
   shields their face, moving in slow motion. A record scratch ends it, and a
   chappal drops on Mohit's head.

   The beam is a soft control tool: little damage, but it slows whoever it
   catches. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['mohit'] = {
  name: 'Paglu Vision',
  banner: 'PAGLU VISION',
  phases: { startup: 0.8, action: 1.6, impact: 0.4, aftermath: 0.8 },
  damage: 9,
  radius: 240,
  hits: [{ at: 1.5, radius: 240, damage: 9, knock: 30, hitstun: 0.25, slow: 2.0, atTarget: true }],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    const landX = s.landX !== undefined ? s.landX : s.x;
    const target = g.project(landX, 0);
    if (!pr || !target) return;

    const u = pr.s;
    const el = s.elapsed;
    const beamAt = 0.9;
    const endAt = 2.5;

    /* ---- the spotlight ---- */
    if (el < endAt) {
      const k = Math.min(1, el / 0.35);
      ctx.save();
      ctx.globalAlpha = 0.16 * k;
      ctx.fillStyle = '#ffe9b8';
      ctx.beginPath();
      ctx.moveTo(pr.x - 26 * u, pr.y - 230 * u);
      ctx.lineTo(pr.x + 26 * u, pr.y - 230 * u);
      ctx.lineTo(pr.x + 70 * u, pr.y);
      ctx.lineTo(pr.x - 70 * u, pr.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* ---- hearts gathering, then the beam ---- */
    if (el > 0.5) {
      const gather = Math.min(1, (el - 0.5) / 0.6);

      /* floating hearts around him */
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const ph = (el * 0.8 + i * 0.28) % 1;
        const hx = pr.x + Math.sin(i * 2.1 + el) * 40 * u;
        const hy = pr.y - (70 + ph * 120) * u;
        ctx.globalAlpha = 0.7 * (1 - ph) * gather;
        drawHeart(ctx, hx, hy, (7 + (i % 3) * 2) * u);
      }
      ctx.restore();

      /* the beam */
      if (el >= beamAt && el < endAt) {
        const k = Math.min(1, (el - beamAt) / 0.25);
        const fade = Math.min(1, Math.max(0, (endAt - el) / 0.3));
        const eyeY = pr.y - 118 * u;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.55 * k * fade;
        const grad = ctx.createLinearGradient(pr.x, eyeY, target.x, target.y - 90 * u);
        grad.addColorStop(0, 'rgba(255,190,220,0.9)');
        grad.addColorStop(0.5, 'rgba(255,120,180,0.7)');
        grad.addColorStop(1, 'rgba(255,120,180,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 16 * u * (0.7 + 0.3 * Math.abs(Math.sin(el * 18)));
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pr.x, eyeY);
        ctx.lineTo(target.x, target.y - 90 * u);
        ctx.stroke();

        /* hearts riding the beam */
        for (let i = 0; i < 5; i++) {
          const t = ((el * 1.6 + i * 0.2) % 1);
          const bx = pr.x + (target.x - pr.x) * t;
          const by = eyeY + (target.y - 90 * u - eyeY) * t;
          ctx.globalAlpha = 0.8 * (1 - t) * fade;
          drawHeart(ctx, bx, by, 8 * u);
        }
        ctx.restore();

        /* the target cringing */
        ctx.save();
        ctx.globalAlpha = 0.8 * fade;
        ctx.strokeStyle = '#ff9ecb';
        ctx.lineWidth = 2.5 * u;
        for (let i = 0; i < 3; i++) {
          const a = -1.9 + i * 0.55 + Math.sin(el * 6) * 0.1;
          ctx.beginPath();
          ctx.moveTo(target.x + Math.cos(a) * 26 * u, target.y - 100 * u + Math.sin(a) * 26 * u);
          ctx.lineTo(target.x + Math.cos(a) * 38 * u, target.y - 100 * u + Math.sin(a) * 38 * u);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* ---- record scratch ---- */
    if (el > endAt && el < endAt + 0.25) {
      const k = (el - endAt) / 0.25;
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, g.W, g.H);
      ctx.restore();
    }

    /* ---- the chappal ---- */
    if (el > 2.7) {
      const k = Math.min(1, (el - 2.7) / 0.35);
      const y = pr.y - 260 * u + 250 * u * k * k;
      ctx.save();
      ctx.translate(pr.x, y);
      ctx.rotate(0.5 + k * 1.6);
      /* thick sole, upper and straps */
      ctx.fillStyle = '#4a3322';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1.8 * u;
      ctx.beginPath();
      ctx.roundRect(-17 * u, -3 * u, 34 * u, 8 * u, 3 * u);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6b4c33';
      ctx.beginPath();
      ctx.roundRect(-16 * u, -9 * u, 32 * u, 7 * u, 4 * u);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#8a6a4a';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.moveTo(-10 * u, -4 * u);
      ctx.lineTo(2 * u, -12 * u);
      ctx.lineTo(12 * u, -4 * u);
      ctx.stroke();
      ctx.restore();

      if (k >= 1) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#ffd166';
        ctx.font = `900 ${Math.round(13 * u)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('THWACK', pr.x, pr.y - 190 * u);
        ctx.restore();
      }
    }
  }
};

function drawHeart(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);

  /* a glossy heart with a lit side and a specular spot */
  const g = ctx.createRadialGradient(-r * 0.4, -r * 0.5, r * 0.1, 0, 0, r * 1.4);
  g.addColorStop(0, '#ffc2dc');
  g.addColorStop(0.55, '#ff7fb8');
  g.addColorStop(1, '#c93f74');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.bezierCurveTo(-r * 1.5, -r * 0.35, -r * 0.55, -r * 1.35, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.55, -r * 1.35, r * 1.5, -r * 0.35, 0, r * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.22, r * 0.14, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
