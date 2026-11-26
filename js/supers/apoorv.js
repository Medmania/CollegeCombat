/* Apoorv — Mood Swing Protocol.

   His face cycles angry, crying, blank, grinning while the whole scene shifts
   colour, and he attacks in a matching style each time: furious jabs, a sobbing
   windmill, a bored single kick, wild flailing. He ends by politely adjusting
   his collar.

   The colour wash is a screen-space overlay, and the mood icon is placed at a
   fixed screen height above the feet, so neither is clipped at any camera zoom. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['apoorv'] = {
  name: 'Mood Swing Protocol',
  banner: 'MOOD SWING',
  phases: { startup: 0.6, action: 1.9, impact: 0.4, aftermath: 0.8 },
  damage: 22,
  radius: 150,
  hits: [
    { at: 0.95, radius: 150, damage: 8, knock: 140, hitstun: 0.22, atTarget: true },
    { at: 1.55, radius: 160, damage: 8, knock: 120, hitstun: 0.22, atTarget: true },
    { at: 2.2, radius: 170, damage: 8, knock: 300, knockdown: true, hitstun: 0.4, atTarget: true }
  ],

  moods: [
    { name: 'angry', tint: 'rgba(200,40,40,0.22)', icon: 'anger' },
    { name: 'crying', tint: 'rgba(50,90,200,0.24)', icon: 'tears' },
    { name: 'blank', tint: 'rgba(120,120,130,0.18)', icon: 'blank' },
    { name: 'grin', tint: 'rgba(150,60,180,0.22)', icon: 'grin' }
  ],

  moodAt(el) {
    const beat = Math.floor((el - 0.6) / 0.5);
    return this.moods[Math.max(0, Math.min(3, beat))];
  },

  /* screen-space colour wash */
  overlay(g, s) {
    const mood = this.moodAt(s.elapsed);
    const fade = Math.min(1, s.elapsed / 0.5) * Math.min(1, Math.max(0, (3.5 - s.elapsed) / 0.4));
    if (fade <= 0) return;
    g.ctx.save();
    g.ctx.globalAlpha = fade;
    g.ctx.fillStyle = mood.tint;
    g.ctx.fillRect(0, 0, g.W, g.H);
    g.ctx.restore();
  },

  draw(g, s) {
    const ctx = g.ctx;
    const pr = g.project(s.x, 0);
    if (!pr) return;
    const u = pr.s;
    const el = s.elapsed;
    const mood = this.moodAt(el);

    /* the mood icon: a fixed height above the feet, so it never clips */
    if (el > 0.6 && el < 3.1) {
      const pop = Math.max(0, 1 - ((el - 0.6) % 0.5) / 0.5);
      const ix = pr.x;
      const iy = pr.y - 190;
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.4 * pop;
      ctx.translate(ix, iy);
      ctx.scale(1 + pop * 0.25, 1 + pop * 0.25);

      if (mood.icon === 'anger') {
        ctx.strokeStyle = '#ff3b30';
        ctx.lineWidth = 4 * u;
        ctx.lineCap = 'round';
        for (const a of [-0.6, 0, 0.6]) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a - 0.5) * 14 * u, Math.sin(a - 0.5) * 14 * u);
          ctx.lineTo(Math.cos(a) * 22 * u, Math.sin(a) * 22 * u);
          ctx.stroke();
        }
      } else if (mood.icon === 'tears') {
        ctx.fillStyle = '#5aa9ff';
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(side * 13 * u, 6 * u + Math.sin(el * 12) * 3 * u, 4.5 * u, 9 * u, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mood.icon === 'blank') {
        ctx.fillStyle = 'rgba(235,235,245,0.9)';
        ctx.font = `900 ${Math.round(20 * u)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('...', 0, 8 * u);
      } else {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(0, 0, 16 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7a4a00';
        ctx.lineWidth = 3 * u;
        ctx.beginPath();
        ctx.arc(0, 2 * u, 9 * u, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* flailing arcs in front of him during the action */
    if (el > 0.6 && el < 2.6) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = mood.icon === 'anger' ? '#ff6a5a' : '#9ecbff';
      ctx.lineWidth = 5 * u;
      ctx.globalAlpha = 0.35 + 0.3 * Math.abs(Math.sin(el * 20));
      for (let i = 0; i < 3; i++) {
        const a0 = -0.9 + Math.sin(el * 14 + i * 2) * 0.5;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y - 70 * u, (46 + i * 16) * u, a0, a0 + 0.9);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* the polite collar adjust at the end */
    if (el > 3.0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (el - 3.0) / 0.2) * 0.9;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(pr.x + 16 * u, pr.y - 100 * u, 5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
};
