/* Adnan — Final Countdown.

   He plants a cartoon bomb where he stands: a twin-bell alarm clock strapped to
   a bundle of rolled office files, labelled DEADLINE. It ticks down, the danger
   ring on the floor shows exactly where it will hurt, and then it goes off.

   Gameplay lives in the `hits` table below; the engine owns the clock and the
   damage. Everything in this file is how it looks. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['adnan'] = {
  name: 'Final Countdown',
  banner: 'DEADLINE',
  phases: { startup: 0.9, action: 2.3, impact: 0.5, aftermath: 0.9 },
  damage: 40,
  /* absolute seconds from activation; the ring radius matches this exactly */
  hits: [{ at: 3.35, radius: 230, damage: 40, knock: 800, knockdown: true, hitstun: 0.7 }],
  radius: 230,

  draw(g, s) {
    const ctx = g.ctx;
    const boomAt = 3.35;
    const pr = g.project(s.x, 0);
    if (!pr) return;
    const s0 = pr.s;
    const elapsed = s.elapsed;

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
      const bx = pr.x;
      const by = pr.y;
      const u = s0;
      const jitter = elapsed > boomAt - 0.9 ? (Math.random() - 0.5) * 2.2 * u * (1 - (boomAt - elapsed)) : 0;

      ctx.save();
      ctx.translate(bx + jitter, by);

      /* shadow */
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(0, 0, 44 * u, 12 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      /* bundle of rolled files */
      for (let i = 0; i < 4; i++) {
        const ox = (-24 + i * 16) * u;
        ctx.fillStyle = i % 2 ? '#e8dcc0' : '#d9c9a6';
        ctx.strokeStyle = 'rgba(60,45,25,0.6)';
        ctx.lineWidth = 1.4 * u;
        ctx.beginPath();
        ctx.roundRect(ox - 8 * u, -46 * u, 16 * u, 44 * u, 5 * u);
        ctx.fill();
        ctx.stroke();
        /* file band */
        ctx.fillStyle = '#b03a2e';
        ctx.fillRect(ox - 8 * u, -30 * u, 16 * u, 6 * u);
      }

      /* alarm clock body */
      const cx = 0;
      const cy = -62 * u;
      ctx.fillStyle = '#d8d2c4';
      ctx.strokeStyle = '#4a4238';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      /* bells */
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + side * 17 * u, cy - 16 * u, 9 * u, 0, Math.PI * 2);
        ctx.fillStyle = '#b8b0a0';
        ctx.fill();
        ctx.stroke();
      }

      /* face + hands, sweeping faster as it gets close */
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.arc(cx, cy, 16 * u, 0, Math.PI * 2);
      ctx.fill();
      const tick = elapsed * (elapsed > boomAt - 0.9 ? 26 : 7);
      ctx.strokeStyle = '#22262c';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.sin(tick) * 11 * u, cy - Math.cos(tick) * 11 * u);
      ctx.stroke();
      ctx.lineWidth = 1.4 * u;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.sin(tick / 12) * 7 * u, cy - Math.cos(tick / 12) * 7 * u);
      ctx.stroke();

      /* DEADLINE label */
      ctx.fillStyle = '#ffd166';
      ctx.font = `900 ${Math.round(11 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3 * u;
      ctx.strokeText('DEADLINE', 0, 14 * u);
      ctx.fillText('DEADLINE', 0, 14 * u);

      /* countdown digits, big, above the bomb */
      if (elapsed > boomAt - 2.3) {
        const left = boomAt - elapsed;
        const n = Math.max(1, Math.ceil(left / 0.8));
        const pop = 1 + 0.35 * Math.max(0, 1 - ((left % 0.8) / 0.8) * 3);
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.font = `900 ${Math.round(34 * u * pop)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 6 * u;
        ctx.strokeText(String(n), 0, -104 * u);
        ctx.fillStyle = '#ff5a45';
        ctx.fillText(String(n), 0, -104 * u);
        ctx.restore();
      }

      ctx.restore();
    }

    /* ---- the blast ---- */
    const dt = elapsed - boomAt;
    if (dt >= 0 && dt < 1.5) {
      const k = Math.min(1, dt / 0.55);
      const rad = 230 * s0 * (0.35 + 0.65 * k);

      ctx.save();
      /* soft core, no strobe */
      const core = ctx.createRadialGradient(pr.x, pr.y - 30 * s0, 2, pr.x, pr.y - 30 * s0, rad);
      core.addColorStop(0, `rgba(255,255,240,${0.85 * (1 - k * 0.7)})`);
      core.addColorStop(0.35, `rgba(255,190,80,${0.6 * (1 - k * 0.6)})`);
      core.addColorStop(1, 'rgba(120,40,10,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(pr.x, pr.y - 30 * s0, rad, rad * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();

      /* shockwave ring on the floor */
      ctx.globalAlpha = Math.max(0, 0.7 - dt);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = Math.max(2, 5 * s0 * (1 - k * 0.6));
      ctx.beginPath();
      ctx.ellipse(pr.x, pr.y, rad * 1.15, rad * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- aftermath: rolling smoke and drifting papers ---- */
    if (dt > 0.1) {
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const t = (dt * 0.9 + i * 0.37) % 1.6;
        const rise = t * 90 * s0;
        const drift = Math.sin(i * 2.1 + dt) * 26 * s0;
        const r = (26 + t * 40) * s0;
        ctx.globalAlpha = Math.max(0, 0.28 * (1 - t / 1.6));
        ctx.fillStyle = i % 2 ? '#5a5148' : '#6d6155';
        ctx.beginPath();
        ctx.arc(pr.x + drift, pr.y - rise - 20 * s0, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
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
    ctx.fillStyle = '#3a322a';
    ctx.fillRect(-26, -16, 52, 32);
    ctx.fillStyle = '#ffb37a';
    ctx.font = '900 8px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SUBMIT', 0, -3);
    ctx.fillText('BY EOD', 0, 8);
    ctx.restore();
  }
};
