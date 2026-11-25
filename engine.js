/* Simulation engine. Pure functions over a plain match object, so the same
   code runs on the host phone and in headless tests. Fixed 30 Hz timestep. */

export const TICK = 1 / 30;
export const ARENA = { cx: 300, cy: 300, r: 300 };
export const PLAYER_R = 26;
export const ROUND_TIME = 75;
export const SUPER_COST = 100;

export const EMPTY_INPUT = { mx: 0, my: 0, punch: false, kick: false, dash: false, super: false };

const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function norm(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

const PASSIVES = {
  none: {},
  tank: { hp: 1.3 },
  quick: { speed: 1.14 },
  heavy: { power: 1.18, speed: 0.92 },
  shover: { knock: 1.35 },
  charged: { meter: 1.5 },
  slippery: { dashCd: 0.55, speed: 1.05 }
};

function spawnPoint(slot, count) {
  const angle = -Math.PI / 2 + (TAU * slot) / Math.max(1, count);
  const dist = count <= 2 ? 190 : 230;
  return {
    x: ARENA.cx + Math.cos(angle) * dist,
    y: ARENA.cy + Math.sin(angle) * dist,
    face: Math.atan2(ARENA.cy - (ARENA.cy + Math.sin(angle) * dist), ARENA.cx - (ARENA.cx + Math.cos(angle) * dist))
  };
}

export function makePlayer({ id, name, char, isBot = false, slot = 0, count = 2 }) {
  const pm = PASSIVES[char.passive && char.passive.id] || PASSIVES.none;
  const maxHp = Math.round(char.stats.hp * (pm.hp || 1));
  const sp = spawnPoint(slot, count);
  return {
    id,
    name: name || char.name,
    charId: char.id,
    isBot: !!isBot,
    slot,
    x: sp.x,
    y: sp.y,
    vx: 0,
    vy: 0,
    kx: 0,
    ky: 0,
    face: Math.atan2(ARENA.cy - sp.y, ARENA.cx - sp.x),
    hp: maxHp,
    maxHp,
    meter: 0,
    alive: true,
    attack: null,
    dashT: 0,
    dashDx: 1,
    dashDy: 0,
    hitstun: 0,
    iframes: 0,
    cd: { punch: 0, kick: 0, dash: 0 },
    stats: {
      speed: char.stats.speed * (pm.speed || 1),
      power: char.stats.power * (pm.power || 1),
      weight: char.stats.weight || 1,
      knock: pm.knock || 1,
      meter: pm.meter || 1,
      dashCd: pm.dashCd || 1
    },
    colors: char.colors,
    moves: char.moves,
    taunts: char.taunts || [],
    ai: isBot ? { timer: 0, targetId: null } : null
  };
}

export function createMatch({ fighters, seed = 12345, roundTime = ROUND_TIME }) {
  const count = fighters.length;
  const players = fighters.map((f, i) =>
    makePlayer({ id: f.id, name: f.name, char: f.char, isBot: f.isBot, slot: i, count })
  );
  return {
    tick: 0,
    timeLeft: roundTime,
    roundTime,
    over: false,
    winner: null,
    players,
    events: [],
    seed
  };
}

export function stepMatch(m, inputs) {
  if (m.over) return m;
  m.tick++;
  m.events = [];
  m.timeLeft = Math.max(0, m.timeLeft - TICK);

  const list = m.players;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (!p.alive) continue;

    p.cd.punch = Math.max(0, p.cd.punch - TICK);
    p.cd.kick = Math.max(0, p.cd.kick - TICK);
    p.cd.dash = Math.max(0, p.cd.dash - TICK);
    p.iframes = Math.max(0, p.iframes - TICK);
    p.hitstun = Math.max(0, p.hitstun - TICK);

    const inp = inputs[p.id] || EMPTY_INPUT;

    if (p.hitstun > 0) {
      /* stunned: no actions */
    } else if (p.attack) {
      p.attack.t += TICK;
      if (!p.attack.hit && p.attack.t >= p.attack.hitAt) {
        p.attack.hit = true;
        resolveHit(m, p, p.attack);
      }
      if (p.attack.t >= p.attack.dur) p.attack = null;
    } else if (inp.super && p.meter >= SUPER_COST) {
      p.meter = 0;
      p.attack = { type: 'super', t: 0, dur: 0.55, hitAt: 0.16, hit: false };
      p.vx = 0;
      p.vy = 0;
      m.events.push({ type: 'superstart', x: p.x, y: p.y, id: p.id });
    } else if (inp.punch && p.cd.punch <= 0) {
      p.cd.punch = p.moves.punch.cd;
      p.attack = { type: 'punch', t: 0, dur: p.moves.punch.dur, hitAt: p.moves.punch.hitAt, hit: false };
      p.vx *= 0.2;
      p.vy *= 0.2;
      m.events.push({ type: 'swing', x: p.x, y: p.y, id: p.id, kind: 'punch' });
    } else if (inp.kick && p.cd.kick <= 0) {
      p.cd.kick = p.moves.kick.cd;
      p.attack = { type: 'kick', t: 0, dur: p.moves.kick.dur, hitAt: p.moves.kick.hitAt, hit: false };
      p.vx *= 0.15;
      p.vy *= 0.15;
      m.events.push({ type: 'swing', x: p.x, y: p.y, id: p.id, kind: 'kick' });
    } else if (inp.dash && p.cd.dash <= 0) {
      const mag = Math.hypot(inp.mx || 0, inp.my || 0);
      const dx = mag > 0.1 ? inp.mx / mag : Math.cos(p.face);
      const dy = mag > 0.1 ? inp.my / mag : Math.sin(p.face);
      p.dashT = p.moves.dash.dur;
      p.dashDx = dx;
      p.dashDy = dy;
      p.face = Math.atan2(dy, dx);
      p.cd.dash = p.moves.dash.cd * p.stats.dashCd;
      p.iframes = Math.max(p.iframes, 0.12);
    }

    if (p.dashT > 0) {
      p.dashT -= TICK;
      p.vx = p.dashDx * p.moves.dash.speed;
      p.vy = p.dashDy * p.moves.dash.speed;
    } else if (!p.attack && p.hitstun <= 0) {
      const mx = inp.mx || 0;
      const my = inp.my || 0;
      const mag = Math.hypot(mx, my);
      if (mag > 0.12) {
        const nx = mx / mag;
        const ny = my / mag;
        p.face = Math.atan2(ny, nx);
        const sp = p.stats.speed * 235 * Math.min(1, mag);
        p.vx = nx * sp;
        p.vy = ny * sp;
      } else {
        p.vx *= 0.55;
        p.vy *= 0.55;
      }
    } else {
      p.vx *= 0.55;
      p.vy *= 0.55;
    }

    p.x += (p.vx + p.kx) * TICK;
    p.y += (p.vy + p.ky) * TICK;
    p.kx *= 0.88;
    p.ky *= 0.88;
    if (Math.abs(p.kx) < 4) p.kx = 0;
    if (Math.abs(p.ky) < 4) p.ky = 0;

    const dx = p.x - ARENA.cx;
    const dy = p.y - ARENA.cy;
    const d = Math.hypot(dx, dy);
    const maxD = ARENA.r - PLAYER_R;
    if (d > maxD) {
      const nx = dx / (d || 1);
      const ny = dy / (d || 1);
      p.x = ARENA.cx + nx * maxD;
      p.y = ARENA.cy + ny * maxD;
      const radial = p.vx * nx + p.vy * ny;
      if (radial > 0) {
        p.vx -= radial * nx;
        p.vy -= radial * ny;
      }
      const kr = p.kx * nx + p.ky * ny;
      if (kr > 0) {
        p.kx -= kr * nx * 1.4;
        p.ky -= kr * ny * 1.4;
      }
    }
  }

  separate(list);
  checkEnd(m);
  return m;
}

function resolveHit(m, p, atk) {
  if (atk.type === 'super') {
    const s = p.moves.super;
    for (const t of m.players) {
      if (t === p || !t.alive) continue;
      if (Math.hypot(t.x - p.x, t.y - p.y) <= s.range) {
        applyDamage(m, p, t, { hitstun: 0.45 }, s.damage, s.knock, 'super');
      }
    }
    m.events.push({ type: 'super', x: p.x, y: p.y, r: s.range, id: p.id });
    return;
  }
  const mv = p.moves[atk.type];
  for (const t of m.players) {
    if (t === p || !t.alive) continue;
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > mv.range + PLAYER_R) continue;
    const ang = Math.atan2(dy, dx);
    if (Math.abs(norm(ang - p.face)) > mv.arc / 2) continue;
    applyDamage(m, p, t, mv, mv.damage, mv.knock, atk.type);
  }
}

function applyDamage(m, src, tgt, mv, baseDmg, knockBase, kind) {
  if (tgt.iframes > 0) return false;
  const dmg = baseDmg * src.stats.power;
  tgt.hp = Math.max(0, tgt.hp - dmg);
  const ang = Math.atan2(tgt.y - src.y, tgt.x - src.x);
  const kb = (knockBase * src.stats.knock) / (tgt.stats.weight || 1);
  tgt.kx += Math.cos(ang) * kb;
  tgt.ky += Math.sin(ang) * kb;
  tgt.hitstun = Math.max(tgt.hitstun, mv.hitstun || 0.16);
  tgt.iframes = 0.1;
  tgt.attack = null;
  src.meter = Math.min(SUPER_COST, src.meter + dmg * 1.5 * src.stats.meter);
  tgt.meter = Math.min(SUPER_COST, tgt.meter + dmg * 1.0 * tgt.stats.meter);
  m.events.push({ type: 'hit', x: tgt.x, y: tgt.y, dmg, id: src.id, on: tgt.id, kind });
  if (tgt.hp <= 0) {
    tgt.alive = false;
    tgt.attack = null;
    tgt.vx = 0;
    tgt.vy = 0;
    tgt.dashT = 0;
    m.events.push({ type: 'ko', x: tgt.x, y: tgt.y, id: tgt.id });
  }
  return true;
}

function separate(list) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (!a.alive || !b.alive) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const min = PLAYER_R * 2;
      if (d > 0.001 && d < min) {
        const push = (min - d) / 2;
        const nx = dx / d;
        const ny = dy / d;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

function checkEnd(m) {
  if (m.over) return;
  const alive = m.players.filter((p) => p.alive);
  const timedOut = m.timeLeft <= 0;
  if (!timedOut && alive.length > 1) return;

  m.over = true;
  if (alive.length === 1) {
    m.winner = alive[0].id;
  } else if (alive.length === 0) {
    m.winner = null;
  } else {
    const sorted = alive.slice().sort((a, b) => b.hp - a.hp);
    const tie = sorted.length > 1 && Math.abs(sorted[0].hp - sorted[1].hp) < 0.01;
    m.winner = tie ? null : sorted[0].id;
  }
}

export function playerById(m, id) {
  return m.players.find((p) => p.id === id) || null;
}

/* Compact wire format for a snapshot, to keep packets small on mobile. */
export function packSnapshot(m) {
  return {
    t: 'snap',
    k: m.tick,
    tl: Math.round(m.timeLeft * 10) / 10,
    ov: m.over ? 1 : 0,
    w: m.winner,
    p: m.players.map((p) => ({
      i: p.id,
      x: Math.round(p.x),
      y: Math.round(p.y),
      f: Math.round(p.face * 100) / 100,
      h: Math.round(p.hp),
      m: Math.round(p.meter),
      a: p.alive ? 1 : 0,
      at: p.attack ? p.attack.type : 0,
      ap: p.attack ? Math.round((p.attack.t / p.attack.dur) * 100) / 100 : 0,
      d: p.dashT > 0 ? 1 : 0
    })),
    e: m.events.map((e) => ({
      y: e.type,
      x: Math.round(e.x),
      y2: Math.round(e.y),
      id: e.id,
      on: e.on,
      k: e.kind,
      r: e.r ? Math.round(e.r) : 0
    }))
  };
}

export function unpackSnapshot(snap, match) {
  for (const sp of snap.p) {
    const p = playerById(match, sp.i);
    if (!p) continue;
    p.x = sp.x;
    p.y = sp.y;
    p.face = sp.f;
    p.hp = sp.h;
    p.meter = sp.m;
    p.alive = !!sp.a;
    p.dashT = sp.d ? 0.1 : 0;
    p.attack = sp.at ? { type: sp.at, t: sp.ap * 0.4, dur: 0.4, hit: true } : null;
  }
  match.tick = snap.k;
  match.timeLeft = snap.tl;
  match.over = !!snap.ov;
  match.winner = snap.w || null;
  match.events = snap.e.map((e) => ({
    type: e.y,
    x: e.x,
    y: e.y2,
    id: e.id,
    on: e.on,
    kind: e.k,
    r: e.r
  }));
  return match;
}
