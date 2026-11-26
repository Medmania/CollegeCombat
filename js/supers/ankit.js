/* Ankit — Pinchu Stomp.

   A very large original panda falls out of the sky onto the spot the target was
   standing on when the super started, lands with a squash, belly-bounces once,
   notices the camera, waves shyly and hops away.

   The panda IS the attack: the warning ring on the floor is drawn at the same
   spot the hit box fires at, and at the same radius.

   Built from separate parts on a pivot skeleton — head, ears, torso, belly,
   jointed arms and paws — with round volume shading, fur strokes that follow
   each part, a broken fur edge, eye highlights, a soft nose and paw pads. The
   belly and ears jiggle on springs. Code only, no images. */

(globalThis.KK_SUPERS = globalThis.KK_SUPERS || {})['ankit'] = {
  name: 'Pinchu Stomp',
  banner: 'PINCHU STOMP',
  phases: { startup: 0.7, action: 1.5, impact: 0.5, aftermath: 1.0 },
  damage: 36,
  /* atTarget: lands where the target stood at activation, not where they are now */
  hits: [{ at: 2.2, radius: 210, damage: 36, knock: 780, knockdown: true, hitstun: 0.8, atTarget: true }],
  radius: 210,

  draw(g, s) {
    const ctx = g.ctx;
    const landAt = 2.2;
    const elapsed = s.elapsed;

    const landX = s.landX !== undefined ? s.landX : s.x;
    const ground = g.project(landX, 0);
    if (!ground) return;
    const u = ground.s;

    /* ---- warning shadow, growing as it falls ---- */
    if (elapsed < landAt + 0.1) {
      const k = Math.min(1, elapsed / landAt);
      const rad = 210 * u * (0.35 + 0.65 * k);
      ctx.save();
      ctx.globalAlpha = 0.14 + 0.2 * k;
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(ground.x, ground.y, rad, rad * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4 + 0.3 * Math.abs(Math.sin(elapsed * 9));
      ctx.strokeStyle = '#9fd6a8';
      ctx.lineWidth = Math.max(2, 3 * u);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- the fall ---- */
    if (elapsed < landAt) {
      const k = Math.pow(Math.max(0, elapsed - 0.5) / (landAt - 0.5), 2);
      const height = (1 - k) * 620;
      drawPanda(ctx, ground.x, ground.y - height * u, u, 1 + (1 - k) * 0.15, 0, elapsed);
      return;
    }

    /* ---- landing, bounce, wave, hop ---- */
    const after = elapsed - landAt;
    let yOff = 0;
    let squashY = 1;
    let hopX = 0;

    if (after < 0.18) {
      squashY = 0.72 + (after / 0.18) * 0.28;
    } else if (after < 0.55) {
      const b = Math.sin(((after - 0.18) / 0.37) * Math.PI);
      yOff = -b * 26;
      squashY = 1 + b * 0.12;
    } else if (after > 0.95) {
      const hop = (after - 0.95) / 0.6;
      yOff = -Math.sin(Math.min(1, hop) * Math.PI) * 60;
      hopX = Math.min(1, hop) * 190;
    }

    drawPanda(ctx, ground.x + hopX * u, ground.y + yOff * u, u, squashY, after, elapsed);

    /* dust ring on touchdown */
    if (after < 0.5) {
      const k = after / 0.5;
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.55;
      ctx.strokeStyle = '#e2ceb6';
      ctx.lineWidth = Math.max(2, 4 * u * (1 - k));
      ctx.beginPath();
      ctx.ellipse(ground.x, ground.y, (60 + k * 190) * u, (20 + k * 70) * u, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};

/* --------------------------------------------------------------- the panda */

const CREAM = '#f4efe4';
const CREAM_DARK = '#cfc6b4';
const INK = '#23252b';
const INK_SOFT = '#31343c';

/* a rounded volume: base fill, light-to-dark gradient, rim light, highlight */
function volume(ctx, x, y, rx, ry, base, lightAmt, rimAmt) {
  const g = ctx.createRadialGradient(x - rx * 0.38, y - ry * 0.42, rx * 0.08, x, y, rx * 1.06);
  g.addColorStop(0, shade(base, lightAmt));
  g.addColorStop(0.55, base);
  g.addColorStop(1, shade(base, -Math.abs(rimAmt)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  /* rim light along the lit edge */
  ctx.strokeStyle = 'rgba(255,250,240,0.22)';
  ctx.lineWidth = Math.max(0.8, rx * 0.07);
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.97, ry * 0.97, 0, Math.PI * 1.08, Math.PI * 1.86);
  ctx.stroke();
}

/* short curved fur strokes that follow the body direction */
function fur(ctx, x, y, rx, ry, tone, seed, count) {
  ctx.save();
  ctx.strokeStyle = tone;
  ctx.lineCap = 'round';
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280 / 233280;
    const a = s * Math.PI * 2;
    const rr = 0.35 + s * 0.6;
    const px = x + Math.cos(a) * rx * rr;
    const py = y + Math.sin(a) * ry * rr;
    const len = (2.4 + s * 3.4) * rx * 0.06;
    ctx.lineWidth = Math.max(0.5, rx * 0.018);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(
      px + Math.cos(a + 0.5) * len,
      py + Math.sin(a + 0.5) * len,
      px + Math.cos(a + 0.2) * len * 1.9,
      py + Math.sin(a + 0.2) * len * 1.9
    );
    ctx.stroke();
  }
  ctx.restore();
}

/* a broken, slightly shaggy outline instead of a clean ellipse */
function shaggyEdge(ctx, x, y, rx, ry, colour, seed) {
  const n = 26;
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 1 + Math.sin(a * 7 + seed) * 0.035 + Math.sin(a * 13 + seed * 2) * 0.02;
    const px = x + Math.cos(a) * rx * wob;
    const py = y + Math.sin(a) * ry * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const gg = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${gg},${b})`;
}

function drawPanda(ctx, x, y, u, squashY, after, elapsed) {
  /* springs: the belly and the ears settle after a landing */
  const settle = after > 0 && after < 0.9 ? Math.sin(after * 18) * Math.exp(-after * 5) : 0;
  const bellyJig = 1 + settle * 0.16;
  const earJig = 1 + settle * 0.22;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squashY);

  /* contact shadow */
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 54 * u, 13 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* ---- legs: two segments each, jointed at the knee ---- */
  for (const side of [-1, 1]) {
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    ctx.lineWidth = 26 * u;
    ctx.beginPath();
    ctx.moveTo(side * 24 * u, -44 * u);
    ctx.lineTo(side * 27 * u, -22 * u);
    ctx.stroke();
    ctx.lineWidth = 22 * u;
    ctx.beginPath();
    ctx.moveTo(side * 27 * u, -22 * u);
    ctx.lineTo(side * 26 * u, -4 * u);
    ctx.stroke();

    /* paw pad */
    ctx.fillStyle = '#15161a';
    ctx.beginPath();
    ctx.ellipse(side * 26 * u, -3 * u, 16 * u, 8 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,116,110,0.5)';
    for (let t = 0; t < 3; t++) {
      ctx.beginPath();
      ctx.arc(side * (20 + t * 6) * u, -2 * u, 2.2 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---- torso, built from a shaggy cream body plus shading ---- */
  shaggyEdge(ctx, 0, -66 * u, 56 * u, 48 * u, CREAM, 1.4);
  volume(ctx, 0, -66 * u, 54 * u, 46 * u, CREAM, 30, 30);
  fur(ctx, 0, -66 * u, 54 * u, 46 * u, 'rgba(190,182,166,0.5)', 7, 26);

  /* belly, on its own spring */
  ctx.save();
  ctx.translate(0, -54 * u);
  ctx.scale(bellyJig, 1 / bellyJig);
  volume(ctx, 0, 0, 36 * u, 30 * u, CREAM_DARK, 26, 24);
  fur(ctx, 0, 0, 36 * u, 30 * u, 'rgba(160,152,138,0.45)', 11, 12);
  ctx.restore();

  /* ---- arms: shoulder, elbow, paw, jointed ---- */
  for (const side of [-1, 1]) {
    const wave = after > 0.6 && after < 1.4 && side === 1 ? Math.sin(after * 22) * 0.5 : 0;
    ctx.save();
    ctx.translate(side * 46 * u, -86 * u);
    ctx.rotate(side * 0.32 + wave);

    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    ctx.lineWidth = 22 * u;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 22 * u);
    ctx.stroke();
    ctx.lineWidth = 19 * u;
    ctx.beginPath();
    ctx.moveTo(0, 22 * u);
    ctx.lineTo(side * 3 * u, 40 * u);
    ctx.stroke();

    /* paw with pads */
    ctx.fillStyle = INK_SOFT;
    ctx.beginPath();
    ctx.arc(side * 3 * u, 42 * u, 12 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(130,126,120,0.55)';
    ctx.beginPath();
    ctx.ellipse(side * 3 * u, 44 * u, 6 * u, 4.5 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let t = -1; t <= 1; t++) {
      ctx.beginPath();
      ctx.arc(side * 3 * u + t * 6 * u, 36 * u, 2.6 * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---- head: turns from front to three-quarter during the wave ---- */
  const turn = after > 0.5 && after < 1.6 ? Math.min(1, (after - 0.5) / 0.5) : 0;
  const hy = -132 * u;

  ctx.save();
  ctx.translate(0, hy);
  ctx.scale(1 - turn * 0.12, 1);

  /* ears, on their own spring */
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 30 * u, -26 * u);
    ctx.scale(earJig, 1 / earJig);
    volume(ctx, 0, 0, 15 * u, 15 * u, INK, 24, 20);
    ctx.restore();
  }

  /* skull */
  shaggyEdge(ctx, 0, 0, 41 * u, 37 * u, CREAM, 3.1);
  volume(ctx, 0, 0, 40 * u, 36 * u, CREAM, 30, 28);
  fur(ctx, 0, 0, 40 * u, 36 * u, 'rgba(196,188,172,0.45)', 5, 18);

  /* eye patches, shifted by the turn so the face is not symmetric */
  for (const side of [-1, 1]) {
    const px = side * (15 - turn * 3) * u;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(px, -2 * u, 13 * u, 16 * u, side * 0.3, 0, Math.PI * 2);
    ctx.fill();

    /* eye with a highlight */
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px + turn * side * 1.5 * u, -3 * u, 5.6 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(px + turn * side * 1.5 * u + 1.4 * u, -2 * u, 3.1 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(px + turn * side * 1.5 * u - 0.6 * u, -4.2 * u, 1.1 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  /* soft nose */
  const ng = ctx.createRadialGradient(0, 10 * u, 0.5, 0, 12 * u, 7 * u);
  ng.addColorStop(0, '#3a3d44');
  ng.addColorStop(1, '#15161a');
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.ellipse(0, 12 * u, 7 * u, 5 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  /* mouth */
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 17 * u);
  ctx.lineTo(0, 21 * u);
  ctx.moveTo(0, 21 * u);
  ctx.quadraticCurveTo(-7 * u, 27 * u, -11 * u, 21 * u);
  ctx.moveTo(0, 21 * u);
  ctx.quadraticCurveTo(7 * u, 27 * u, 11 * u, 21 * u);
  ctx.stroke();

  ctx.restore();

  ctx.restore();
}
