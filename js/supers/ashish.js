/* Ashish — Emotional Damage.

   He holds up his phone. On the screen is an invented cartoon silhouette with a
   heart — never a real photo. Rose petals drift, his hair does a slow-motion
   flip, a banner reads MERE PAAS GF HAI, and a giant cracking heart drops on the
   target. Then his phone buzzes: "seen", no reply. He looks worried.

   Clear forward range, and it can be dodged. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['ashish'] = {
  name: 'Emotional Damage',
  banner: 'MERE PAAS GF HAI!',
  phases: { startup: 1.0, action: 1.2, impact: 0.5, aftermath: 1.3 },
  damage: 12,
  radius: 220,
  hits: [{ at: 2.2, radius: 220, damage: 12, knock: 40, hitstun: 0.5, lock: 0.5, atTarget: true }],

  petals: (() => {
    const out = [];
    let seed = 33;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 12; i++) out.push({ x: rnd(), sp: 0.4 + rnd() * 0.6, d: rnd() * 0.5, s: 0.6 + rnd() * 0.6 });
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
    const dropAt = 2.2;
    const endAt = 3.0;

    /* ---- rose petals drifting ---- */
    if (el < endAt) {
      ctx.save();
      for (const p of this.petals) {
        const t = (el * p.sp * 0.5 + p.d) % 1;
        const px = pr.x + (p.x - 0.5) * 260 * u + Math.sin(el * 2 + p.d * 9) * 20 * u;
        const py = pr.y - 300 * u + t * 320 * u;
        ctx.globalAlpha = 0.65 * (1 - Math.abs(t - 0.5) * 1.2);
        ctx.fillStyle = '#ff8fb0';
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(el * 2.6 + p.d * 6 + t * 4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7 * u * p.s, 4 * u * p.s, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    /* ---- the phone, held up ---- */
    if (el < dropAt + 0.2) {
      const k = Math.min(1, el / 0.3);
      ctx.save();
      ctx.translate(pr.x + 22 * u, pr.y - (110 + k * 12) * u);
      ctx.rotate(-0.15);

      /* phone body */
      ctx.fillStyle = '#15181d';
      ctx.beginPath();
      ctx.roundRect(-13 * u, -24 * u, 26 * u, 48 * u, 4 * u);
      ctx.fill();
      ctx.fillStyle = '#f4e9f2';
      ctx.beginPath();
      ctx.roundRect(-10 * u, -20 * u, 20 * u, 38 * u, 2 * u);
      ctx.fill();

      /* the invented cartoon silhouette with a heart — not a photo */
      ctx.fillStyle = '#f7b7cd';
      ctx.beginPath();
      ctx.arc(0, -10 * u, 5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-7 * u, 10 * u);
      ctx.quadraticCurveTo(0, -6 * u, 7 * u, 10 * u);
      ctx.closePath();
      ctx.fill();
      drawHeartSmall(ctx, 0, 2 * u, 4 * u);

      ctx.restore();
    }

    /* ---- the giant heart dropping ---- */
    if (el > 1.6 && el < dropAt + 0.7) {
      const k = Math.min(1, (el - 1.6) / (dropAt - 1.6));
      const hy = land.y - 340 * u + 340 * u * k * k;
      const size = 46 * u;

      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.translate(land.x, hy);
      drawHeartBig(ctx, 0, 0, size, '#ff6b9d');

      /* shards on the break */
      if (el > dropAt) {
        drawShards(ctx, land.x, hy + size * 0.2, size, Math.min(1, (el - dropAt) / 0.9));
      }

      /* the crack appears on contact */
      if (el > dropAt) {
        const c = Math.min(1, (el - dropAt) / 0.2);
        ctx.strokeStyle = '#7a1030';
        ctx.lineWidth = 2.5 * u;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);
        ctx.lineTo(-size * 0.18, 0);
        ctx.lineTo(size * 0.1, size * 0.2);
        ctx.lineTo(-size * 0.05, size * 0.5);
        ctx.globalAlpha = c;
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ---- "seen", and the worried face ---- */
    if (el > endAt) {
      const k = Math.min(1, (el - endAt) / 0.3);
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = '#cfe0ff';
      ctx.font = `800 ${Math.round(10 * u)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('seen', pr.x + 22 * u, pr.y - 150 * u);

      /* a small worried sweat drop */
      ctx.fillStyle = '#8ad4ff';
      ctx.beginPath();
      ctx.ellipse(pr.x + 14 * u, pr.y - 132 * u, 3 * u, 5 * u, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
};

function drawHeartSmall(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ff5a8a';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.bezierCurveTo(-r * 1.5, -r * 0.35, -r * 0.55, -r * 1.35, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.55, -r * 1.35, r * 1.5, -r * 0.35, 0, r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeartBig(ctx, x, y, r, colour) {
  ctx.save();
  ctx.translate(x, y);

  /* thick glass: a lit core, a darker rim, an edge highlight and a specular */
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.08, 0, 0, r * 1.6);
  g.addColorStop(0, '#ffd0e2');
  g.addColorStop(0.45, colour);
  g.addColorStop(1, '#a8224f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.75);
  ctx.bezierCurveTo(-r * 1.6, -r * 0.3, -r * 0.6, -r * 1.45, 0, -r * 0.5);
  ctx.bezierCurveTo(r * 0.6, -r * 1.45, r * 1.6, -r * 0.3, 0, r * 0.75);
  ctx.closePath();
  ctx.fill();

  /* thick edge */
  ctx.strokeStyle = 'rgba(255,220,235,0.85)';
  ctx.lineWidth = 4;
  ctx.stroke();

  /* inner edge, for the thickness of glass */
  ctx.strokeStyle = 'rgba(150,20,60,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.55);
  ctx.bezierCurveTo(-r * 1.3, -r * 0.28, -r * 0.5, -r * 1.2, 0, -r * 0.4);
  ctx.bezierCurveTo(r * 0.5, -r * 1.2, r * 1.3, -r * 0.28, 0, r * 0.55);
  ctx.stroke();

  /* specular highlights */
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.45, -r * 0.55, r * 0.26, r * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.34, -r * 0.5, r * 0.12, r * 0.08, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* shards thrown out when the heart breaks */
function drawShards(ctx, x, y, r, t) {
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const dist = r * (0.4 + t * 1.6);
    const px = x + Math.cos(a) * dist;
    const py = y + Math.sin(a) * dist * 0.8 + t * t * r * 0.9;
    ctx.globalAlpha = Math.max(0, 1 - t * 1.1);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a + t * 6);
    ctx.fillStyle = '#ff6b9d';
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, -r * 0.16);
    ctx.lineTo(r * 0.14, -r * 0.05);
    ctx.lineTo(-r * 0.03, r * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,235,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
