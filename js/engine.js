/* global IIFE: keeps this file's names off the window */
(function () {
'use strict';

/* Side-view fight engine.

   The fight happens on a single lane: x runs left to right, h is height above
   the floor. Gravity, jumping, crouching and height-based hit boxes mean a
   punch goes over a crouching opponent, a sweep goes under a jumping one, and
   an air kick only connects while you are off the ground.

   Fixed 30 Hz timestep. Pure functions over a plain match object. */

const TICK = 1 / 30;
const LANE = { min: 0, max: 1500 };
const PLAYER_R = 26;
const BODY_GAP = 78;
const STAND_H = 122;
const CROUCH_H = 50;
const GRAVITY = 2400;
const JUMP_V = 760;
const ROUND_TIME = 75;
const SUPER_COST = 100;

const EMPTY_INPUT = {
  mx: 0,
  my: 0,
  punch: false,
  kick: false,
  dash: false,
  super: false
};

/* One knob for the pace of every attack. Bump it up to slow the fight down. */
const PACE = 1.14;

/* How far the stick has to travel before it counts as up or down. */
const UP_THRESHOLD = -0.55;
const DOWN_THRESHOLD = 0.5;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sign = (v) => (v < 0 ? -1 : 1);

const PASSIVES = {
  none: {},
  tank: { hp: 1.3 },
  quick: { speed: 1.14 },
  heavy: { power: 1.18, speed: 0.92 },
  shover: { knock: 1.35 },
  charged: { meter: 1.5 },
  slippery: { dashCd: 0.55, speed: 1.05 }
};

/* Vertical bands each attack sweeps through. An air attack's band is relative
   to the attacker's own height, so it travels with them. */
const BANDS = {
  punch: { minH: 52, maxH: 110 },
  crouchPunch: { minH: 18, maxH: 80 },
  airPunch: { minH: -45, maxH: 35 },
  kick: { minH: 16, maxH: 86 },
  sweep: { minH: 0, maxH: 34 },
  airKick: { minH: -55, maxH: 25 },
  backKick: { minH: 30, maxH: 98 }
};

function buildAttacks(char) {
  const p = char.moves.punch;
  const k = char.moves.kick;
  const d = (v) => v * PACE;

  return {
    /* --- punches: jab, uppercut from a crouch, overhead from the air --- */
    punch: {
      family: 'punch',
      type: 'punch',
      damage: p.damage,
      /* a touch more reach so a jab comfortably clears BODY_GAP */
      range: p.range * 1.05,
      dur: d(p.dur),
      hitAt: p.hitAt * PACE,
      knock: p.knock,
      cd: d(p.cd),
      hitstun: 0.16,
      ...BANDS.punch
    },
    crouchPunch: {
      family: 'punch',
      type: 'crouchPunch',
      damage: p.damage * 1.2,
      /* must out-reach BODY_GAP or it can never connect */
      range: p.range * 1.0,
      dur: d(p.dur * 1.2),
      hitAt: p.hitAt * PACE * 1.1,
      knock: p.knock * 1.2,
      cd: d(p.cd * 1.2),
      hitstun: 0.22,
      ...BANDS.crouchPunch
    },
    airPunch: {
      family: 'punch',
      type: 'airPunch',
      damage: p.damage * 1.1,
      range: p.range * 0.9,
      dur: d(0.3),
      hitAt: 0.1 * PACE,
      knock: p.knock * 1.1,
      cd: d(0.4),
      hitstun: 0.22,
      ...BANDS.airPunch
    },

    /* --- kicks: roundhouse, sweep, flying kick, turning back kick --- */
    kick: {
      family: 'kick',
      type: 'kick',
      damage: k.damage,
      range: k.range,
      dur: d(k.dur),
      hitAt: k.hitAt * PACE,
      knock: k.knock,
      cd: d(k.cd),
      hitstun: 0.26,
      ...BANDS.kick
    },
    sweep: {
      family: 'kick',
      type: 'sweep',
      damage: k.damage * 0.8,
      range: k.range * 1.05,
      dur: d(k.dur * 1.15),
      hitAt: k.hitAt * PACE * 1.25,
      knock: k.knock * 0.7,
      cd: d(k.cd * 1.25),
      hitstun: 0.5,
      knockdown: true,
      ...BANDS.sweep
    },
    airKick: {
      family: 'kick',
      type: 'airKick',
      damage: k.damage * 1.1,
      range: k.range * 0.9,
      dur: d(0.36),
      hitAt: 0.12 * PACE,
      knock: k.knock * 1.15,
      cd: d(0.45),
      hitstun: 0.32,
      ...BANDS.airKick
    },
    backKick: {
      family: 'kick',
      type: 'backKick',
      damage: k.damage * 1.35,
      range: k.range * 1.05,
      dur: d(k.dur * 1.3),
      hitAt: k.hitAt * PACE * 1.2,
      knock: k.knock * 1.7,
      cd: d(k.cd * 1.5),
      hitstun: 0.36,
      ...BANDS.backKick
    }
  };
}

function makePlayer({ id, name, char, isBot = false, slot = 0, count = 2 }) {
  const pm = PASSIVES[char.passive && char.passive.id] || PASSIVES.none;
  const maxHp = Math.round(char.stats.hp * (pm.hp || 1));
  const gap = 190;
  const mid = (LANE.min + LANE.max) / 2;
  const x = mid + (slot - (count - 1) / 2) * gap;

  return {
    id,
    name: name || char.name,
    charId: char.id,
    passiveId: (char.passive && char.passive.id) || 'none',
    isBot: !!isBot,
    slot,
    x,
    h: 0,
    vx: 0,
    vh: 0,
    facing: slot % 2 === 0 ? 1 : -1,
    hp: maxHp,
    maxHp,
    meter: 0,
    alive: true,
    onGround: true,
    crouching: false,
    wasUp: false,
    attack: null,
    downT: 0,
    hitstun: 0,
    iframes: 0,
    dashT: 0,
    dashDir: 1,
    cd: { punch: 0, kick: 0, dash: 0 },
    stats: {
      speed: char.stats.speed * (pm.speed || 1),
      power: char.stats.power * (pm.power || 1),
      weight: char.stats.weight || 1,
      knock: pm.knock || 1,
      meter: pm.meter || 1,
      dashCd: pm.dashCd || 1
    },
    moves: char.moves,
    attacks: buildAttacks(char),
    colors: char.colors,
    taunts: char.taunts || [],
    ai: isBot ? { timer: 0, actTimer: 0, actionT: 0, action: null, targetId: null } : null
  };
}

function createMatch({ fighters, seed = 12345, roundTime = ROUND_TIME }) {
  const count = fighters.length;
  const players = fighters.map((f, i) =>
    makePlayer({ id: f.id, name: f.name, char: f.char, isBot: f.isBot, slot: i, count })
  );
  return { tick: 0, timeLeft: roundTime, roundTime, over: false, winner: null, players, events: [], seed };
}

function hurtBox(p) {
  if (p.downT > 0) return [0, 36];
  const height = p.crouching && p.onGround ? CROUCH_H : STAND_H;
  return [p.h, p.h + height];
}

function faceOpponents(m, p) {
  let best = null;
  let bd = Infinity;
  for (const q of m.players) {
    if (q === p || !q.alive) continue;
    const d = Math.abs(q.x - p.x);
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  if (best && Math.abs(best.x - p.x) > 2) p.facing = sign(best.x - p.x);
}

function stepMatch(m, inputs) {
  if (m.over) return m;
  m.tick++;
  m.events = [];
  m.timeLeft = Math.max(0, m.timeLeft - TICK);

  for (const p of m.players) {
    if (!p.alive) continue;

    p.cd.punch = Math.max(0, p.cd.punch - TICK);
    p.cd.kick = Math.max(0, p.cd.kick - TICK);
    p.cd.dash = Math.max(0, p.cd.dash - TICK);
    p.iframes = Math.max(0, p.iframes - TICK);
    p.hitstun = Math.max(0, p.hitstun - TICK);
    if (p.downT > 0) p.downT = Math.max(0, p.downT - TICK);

    const inp = inputs[p.id] || EMPTY_INPUT;

    if (p.onGround && p.hitstun <= 0 && p.downT <= 0 && !p.attack) faceOpponents(m, p);

    /* ---- stance, read off the stick ---- */
    const my = clamp(inp.my || 0, -1, 1);
    const upHeld = my < UP_THRESHOLD;
    const wantJump = upHeld && !p.wasUp && p.onGround && p.hitstun <= 0 && p.downT <= 0;
    p.wasUp = upHeld;
    const wantCrouch = my > DOWN_THRESHOLD && p.onGround;
    /* holding away from your opponent turns a kick into a back kick */
    const backward = (inp.mx || 0) * p.facing < -0.3;

    if (p.hitstun > 0 || p.downT > 0) {
      /* no control */
    } else if (p.attack) {
      p.attack.t += TICK;
      if (!p.attack.hit && p.attack.t >= p.attack.hitAt) {
        p.attack.hit = true;
        resolveHit(m, p, p.attack);
      }
      if (p.attack.t >= p.attack.dur) p.attack = null;
    } else {
      p.crouching = wantCrouch;

      if (wantJump) {
        p.vh = JUMP_V;
        p.onGround = false;
        p.crouching = false;
        p.wasUp = true;
        m.events.push({ type: 'jump', x: p.x, h: p.h, id: p.id });
      }

      const airborne = !p.onGround;
      const ctx = { airborne, crouch: wantCrouch && p.onGround, backward };

      if (inp.super && p.meter >= SUPER_COST && p.onGround) {
        p.meter = 0;
        p.attack = { type: 'super', t: 0, dur: 0.66, hitAt: 0.22, hit: false, def: p.moves.super };
        p.vx = 0;
        m.events.push({ type: 'superstart', x: p.x, h: p.h, id: p.id });
      } else if (inp.punch && p.cd.punch <= 0) {
        startAttack(p, pickAttack(p, 'punch', ctx));
      } else if (inp.kick && p.cd.kick <= 0) {
        startAttack(p, pickAttack(p, 'kick', ctx));
      } else if (inp.dash && p.onGround && p.cd.dash <= 0) {
        const dir = Math.abs(inp.mx) > 0.1 ? sign(inp.mx) : -p.facing;
        p.dashT = 0.16;
        p.dashDir = dir;
        p.cd.dash = p.moves.dash.cd * p.stats.dashCd;
        p.iframes = Math.max(p.iframes, 0.1);
      }
    }

    /* ---- movement ---- */
    if (p.hitstun > 0 || p.downT > 0) {
      p.vx *= Math.pow(0.02, TICK);
    } else if (p.dashT > 0) {
      p.dashT -= TICK;
      p.vx = p.dashDir * p.moves.dash.speed * 0.85;
    } else if (p.attack) {
      p.vx *= Math.pow(0.05, TICK);
    } else {
      const mx = clamp(inp.mx || 0, -1, 1);
      const speed = p.stats.speed * 300 * (p.crouching ? 0.3 : p.onGround ? 1 : 0.72);
      p.vx = mx * speed;
    }

    /* ---- vertical ---- */
    if (!p.onGround) {
      p.vh -= GRAVITY * TICK;
      p.h += p.vh * TICK;
      if (p.h <= 0) {
        p.h = 0;
        p.vh = 0;
        p.onGround = true;
        if (p.attack && p.attack.type === 'air') p.attack = null;
        m.events.push({ type: 'land', x: p.x, h: 0, id: p.id });
      }
    }

    p.x += p.vx * TICK;
    p.x = clamp(p.x, LANE.min + PLAYER_R, LANE.max - PLAYER_R);
  }

  separate(m);
  checkEnd(m);
  return m;
}

/* Which move a button produces depends on stance: air, crouch, or turning away. */
function pickAttack(p, family, ctx) {
  const A = p.attacks;
  if (ctx.airborne) return family === 'punch' ? A.airPunch : A.airKick;
  if (ctx.crouch) return family === 'punch' ? A.crouchPunch : A.sweep;
  if (ctx.backward && family === 'kick') return A.backKick;
  return family === 'punch' ? A.punch : A.kick;
}

function startAttack(p, def) {
  p.attack = { type: def.type, t: 0, dur: def.dur, hitAt: def.hitAt, hit: false, def };
  if (def.family === 'punch') p.cd.punch = def.cd;
  else p.cd.kick = def.cd;
  /* crouching moves keep you low; everything else stands you up */
  if (def.type !== 'crouchPunch' && def.type !== 'sweep') p.crouching = false;
  if (def.family === 'kick') p.vx *= 0.2;
  p.vx *= 0.4;
}

function resolveHit(m, p, atk) {
  if (atk.type === 'super') {
    const s = atk.def;
    for (const t of m.players) {
      if (t === p || !t.alive) continue;
      if (Math.abs(t.x - p.x) <= s.range) {
        applyDamage(m, p, t, { hitstun: 0.5, knockdown: true }, s.damage, s.knock, 'super');
      }
    }
    m.events.push({ type: 'super', x: p.x, h: p.h, r: s.range, id: p.id });
    return;
  }

  const def = atk.def;
  const offset = def.type === 'air' ? p.h : 0;
  const bandMin = def.minH + offset;
  const bandMax = def.maxH + offset;

  for (const t of m.players) {
    if (t === p || !t.alive) continue;
    const dx = t.x - p.x;
    if (Math.abs(dx) > def.range + PLAYER_R) continue;
    if (dx * p.facing < -PLAYER_R) continue; /* target must be in front */
    const [hmin, hmax] = hurtBox(t);
    if (bandMax <= hmin || bandMin >= hmax) continue;
    applyDamage(m, p, t, def, def.damage, def.knock, def.type);
  }
}

function applyDamage(m, src, tgt, def, baseDmg, knockBase, kind) {
  if (tgt.iframes > 0) return false;
  const dmg = baseDmg * src.stats.power;
  tgt.hp = Math.max(0, tgt.hp - dmg);

  const dir = sign(tgt.x - src.x) || src.facing;
  const kb = (knockBase * src.stats.knock) / (tgt.stats.weight || 1);
  tgt.vx = dir * kb * 2.4;
  if (def.knockdown) {
    tgt.downT = 1.1;
    tgt.vh = 300;
    tgt.onGround = false;
    tgt.crouching = false;
  }
  tgt.hitstun = Math.max(tgt.hitstun, def.hitstun || 0.18);
  tgt.iframes = 0.08;
  tgt.attack = null;

  src.meter = Math.min(SUPER_COST, src.meter + dmg * 1.5 * src.stats.meter);
  tgt.meter = Math.min(SUPER_COST, tgt.meter + dmg * 1.0 * tgt.stats.meter);

  m.events.push({ type: 'hit', x: tgt.x, h: tgt.h + 60, dmg, id: src.id, on: tgt.id, kind });

  if (tgt.hp <= 0) {
    tgt.alive = false;
    tgt.attack = null;
    tgt.vx = 0;
    tgt.downT = 99;
    m.events.push({ type: 'ko', x: tgt.x, h: tgt.h, id: tgt.id });
  }
  return true;
}

function separate(m) {
  const list = m.players;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (!a.alive || !b.alive) continue;
      const dx = b.x - a.x;
      const min = BODY_GAP;
      if (Math.abs(dx) < min) {
        const push = (min - Math.abs(dx)) / 2;
        const dir = dx >= 0 ? 1 : -1;
        a.x -= dir * push;
        b.x += dir * push;
        a.x = clamp(a.x, LANE.min + PLAYER_R, LANE.max - PLAYER_R);
        b.x = clamp(b.x, LANE.min + PLAYER_R, LANE.max - PLAYER_R);
      }
    }
  }
}

function checkEnd(m) {
  if (m.over) return;
  const alive = m.players.filter((p) => p.alive);
  if (alive.length > 1 && m.timeLeft > 0) return;

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

function playerById(m, id) {
  return m.players.find((p) => p.id === id) || null;
}

/* Compact wire format — short keys keep the packet small on mobile. */
function packSnapshot(m) {
  return {
    t: 'snap',
    k: m.tick,
    tl: Math.round(m.timeLeft * 10) / 10,
    ov: m.over ? 1 : 0,
    w: m.winner,
    p: m.players.map((p) => ({
      i: p.id,
      x: Math.round(p.x),
      h: Math.round(p.h),
      f: p.facing,
      hp: Math.round(p.hp),
      m: Math.round(p.meter),
      a: p.alive ? 1 : 0,
      g: p.onGround ? 1 : 0,
      c: p.crouching ? 1 : 0,
      d: p.downT > 0 ? 1 : 0,
      at: p.attack ? p.attack.type : 0,
      ap: p.attack ? Math.round((p.attack.t / p.attack.dur) * 100) / 100 : 0
    })),
    e: m.events.map((e) => ({
      y: e.type,
      x: Math.round(e.x),
      h: Math.round(e.h || 0),
      id: e.id,
      on: e.on,
      k: e.kind,
      r: e.r ? Math.round(e.r) : 0
    }))
  };
}

function unpackSnapshot(snap, match) {
  for (const sp of snap.p) {
    const p = playerById(match, sp.i);
    if (!p) continue;
    p.x = sp.x;
    p.h = sp.h;
    p.facing = sp.f;
    p.hp = sp.hp;
    p.meter = sp.m;
    p.alive = !!sp.a;
    p.onGround = !!sp.g;
    p.crouching = !!sp.c;
    p.downT = sp.d ? 0.5 : 0;
    p.attack = sp.at ? { type: sp.at, t: sp.ap * 0.4, dur: 0.4, hit: true } : null;
  }
  match.tick = snap.k;
  match.timeLeft = snap.tl;
  match.over = !!snap.ov;
  match.winner = snap.w || null;
  match.events = snap.e.map((e) => ({
    type: e.y,
    x: e.x,
    h: e.h,
    id: e.id,
    on: e.on,
    kind: e.k,
    r: e.r
  }));
  return match;
}

  globalThis.KK_Engine = {
    TICK, LANE, PLAYER_R, BODY_GAP, STAND_H, CROUCH_H, GRAVITY, JUMP_V, ROUND_TIME, SUPER_COST,
    EMPTY_INPUT, makePlayer, createMatch, stepMatch, playerById, packSnapshot,
    unpackSnapshot, hurtBox, buildAttacks
  };
})();
