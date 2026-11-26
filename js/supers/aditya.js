/* Aditya — Continuous Commentary.

   A microphone drops in from above. He launches into a non-stop rant and the
   rant becomes solid: speech bubbles fly out of his mouth, bonk the target and
   pile up on the floor. He runs out of breath, and one tiny last bubble
   delivers the final tap.

   The bubbles are comic-book censored symbols plus Hinglish slang — the joke is
   the volume and the pettiness, not the words. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['aditya'] = {
  name: 'Continuous Commentary',
  banner: 'CONTINUOUS COMMENTARY',
  phases: { startup: 0.7, action: 1.8, impact: 0.4, aftermath: 0.8 },
  damage: 18,
  radius: 190,
  hits: [
    { at: 1.0, radius: 190, damage: 4, knock: 60, hitstun: 0.14, atTarget: true },
    { at: 1.45, radius: 190, damage: 4, knock: 60, hitstun: 0.14, atTarget: true },
    { at: 1.9, radius: 190, damage: 4, knock: 70, hitstun: 0.16, atTarget: true },
    { at: 2.35, radius: 190, damage: 4, knock: 220, hitstun: 0.3, atTarget: true }
  ],

  /* comic-book symbols first, then clean Hinglish ranting */
  lines: [
    '@#$%!',
    'Yaar, sun na!',
    '!@#$',
    'Kya bakwaas hai!',
    'Time waste!',
    'Pagal ho gaye ho?',
    '@#$%!',
    'Kitni baar bola!',
    'Bas kar yaar!',
    'Sirf baatein!'
  ],

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    const landX = s.landX !== undefined ? s.landX : s.x;
    const target = g.project(landX, 0);
    if (!pr || !target) return;

    const u = pr.s;
    const el = s.elapsed;

    /* ---- the microphone drop ---- */
    if (el < 1.0) {
      const k = Math.min(1, el / 0.45);
      const y = pr.y - 260 * u + 260 * u * k * k;
      drawMic(ctx, pr.x + 46 * u, y, u);
      if (k >= 1) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - (el - 0.45) * 3);
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 2 * u;
        ctx.beginPath();
        ctx.ellipse(pr.x + 46 * u, pr.y, 26 * u, 9 * u, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* ---- the stream of bubbles ---- */
    const start = 0.75;
    const speed = 2.6;
    if (el > start) {
      const count = 10;
      for (let i = 0; i < count; i++) {
        const born = start + i * 0.17;
        const age = el - born;
        if (age < 0) continue;

        const travel = Math.min(1, age * speed * 0.9);
        const bx = pr.x + (target.x - pr.x) * travel;
        const by = pr.y - (92 + Math.sin(i * 1.7) * 22) * u - Math.sin(travel * Math.PI) * 26 * u;

        /* after it lands it settles on the floor as a pile */
        const landed = travel >= 1;
        const pileX = target.x + (i % 2 ? 1 : -1) * (18 + (i % 5) * 14) * u;
        const pileY = target.y - 6 * u - (i % 3) * 9 * u;
        const drawX = landed ? pileX : bx;
        const drawY = landed ? pileY : by;

        const text = this.lines[i % this.lines.length];
        const pop = landed ? Math.max(0.55, 1 - age * 0.25) : 1;
        drawBubble(ctx, drawX, drawY, text, u * pop * (landed ? 0.75 : 1), i);
      }
    }

    /* ---- out of breath, then the tiny last tap ---- */
    if (el > 2.6) {
      const k = Math.min(1, (el - 2.6) / 0.5);
      ctx.save();
      ctx.globalAlpha = 0.8 * (1 - k * 0.4);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `700 ${Math.round(9 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('...haa... haa...', pr.x, pr.y - 150 * u);
      ctx.restore();

      const tx = target.x + (1 - k) * 70 * u;
      drawBubble(ctx, tx, target.y - 60 * u, 'huh.', u * 0.6, 3);
    }
  }
};

function drawMic(ctx, x, y, u) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#2b2f36';
  ctx.beginPath();
  ctx.roundRect(-5 * u, -18 * u, 10 * u, 34 * u, 5 * u);
  ctx.fill();
  ctx.fillStyle = '#4a5058';
  ctx.beginPath();
  ctx.arc(0, -22 * u, 9 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1d22';
  ctx.lineWidth = 1.5 * u;
  ctx.stroke();
  ctx.restore();
}

function drawBubble(ctx, x, y, text, u, seed) {
  ctx.save();
  ctx.font = `800 ${Math.round(11 * u)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const w = ctx.measureText(text).width + 14 * u;
  const h = 20 * u;

  /* the side face first, so the bubble has thickness */
  ctx.fillStyle = 'rgba(150,150,165,0.55)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2 + 2.5 * u, y - h / 2 + 3 * u, w, h, 7 * u);
  ctx.fill();

  /* a soft drop shadow under it */
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y + h * 0.7, w * 0.4, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* the face of the bubble */
  const bg = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, seed % 3 === 0 ? '#f2e4c4' : '#e8e8ef');
  ctx.fillStyle = bg;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1.8 * u;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 7 * u);
  ctx.fill();
  ctx.stroke();

  /* a gloss along the top edge */
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2 + 3 * u, y - h / 2 + 2 * u, w - 6 * u, h * 0.22, 4 * u);
  ctx.fill();

  /* the tail, pointing down-left */
  ctx.beginPath();
  ctx.moveTo(x - w * 0.22, y + h / 2 - 1);
  ctx.lineTo(x - w * 0.3, y + h / 2 + 6 * u);
  ctx.lineTo(x - w * 0.06, y + h / 2 - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1b1e24';
  ctx.fillText(text, x, y + 0.5 * u);
  ctx.restore();
}
