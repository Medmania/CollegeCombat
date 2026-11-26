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
const ROUND_TIME = 150;
const SUPER_COST = 100;
/* global health multiplier — raise this to make fights last longer */
const HP_SCALE = 3.4;

const EMPTY_INPUT = {
  mx: 0,
  my: 0,
  punch: false,
  kick: false,
  dash: false,
  super: false
};

/* One knob for the pace of every attack. Bump it up to slow the fight down. */
const PACE = 1.56;

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
  backKick: { minH: 30, maxH: 98 },
  spinKick: { minH: 26, maxH: 104 },
  lungePunch: { minH: 46, maxH: 112 }
};

/* Each passive gets a body: how fast it drops into a crouch, how hard it
   dives, how much of its own momentum it keeps. */
const ARCHETYPE_STYLES = {
  tank:     { style: 'heavy', cDur: 1.22, aDur: 1.18, cLunge: 150, aVx: 180, diveVh: -260, knockMult: 1.30 },
  heavy:    { style: 'heavy', cDur: 1.20, aDur: 1.15, cLunge: 165, aVx: 195, diveVh: -240, knockMult: 1.25 },
  quick:    { style: 'agile', cDur: 0.78, aDur: 0.80, cLunge: 280, aVx: 300, diveVh: -90,  knockMult: 0.85 },
  slippery: { style: 'agile', cDur: 0.75, aDur: 0.78, cLunge: 310, aVx: 320, diveVh: -80,  knockMult: 0.85 },
  shover:   { style: 'tech',  cDur: 1.05, aDur: 1.00, cLunge: 210, aVx: 245, diveVh: -150, knockMult: 1.35 },
  charged:  { style: 'tech',  cDur: 0.95, aDur: 0.92, cLunge: 230, aVx: 255, diveVh: -140, knockMult: 1.00 },
  none:     { style: 'base',  cDur: 1.00, aDur: 1.00, cLunge: 210, aVx: 240, diveVh: -130, knockMult: 1.00 }
};

function buildAttacks(char) {
  const p = char.moves.punch;
  const k = char.moves.kick;
  const d = (v) => v * PACE;
  const arch = ARCHETYPE_STYLES[(char.passive && char.passive.id) || 'none'] || ARCHETYPE_STYLES.none;
  const heavy = arch.style === 'heavy';
  const agile = arch.style === 'agile';
  const tech = arch.style === 'tech';

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
      lunge: 95,
      ...BANDS.punch
    },
    crouchPunch: {
      style: arch.style,
      family: 'punch',
      type: 'crouchPunch',
      damage: p.damage * (heavy ? 1.32 : 1.15) * 1.2,
      /* must out-reach BODY_GAP or it can never connect */
      range: p.range * 1.0,
      dur: d(p.dur * 1.2 * arch.cDur),
      hitAt: p.hitAt * PACE * 1.1 * arch.cDur,
      knock: p.knock * 1.2 * 1.15 * arch.knockMult,
      cd: d(p.cd * 1.2),
      hitstun: heavy ? 0.28 : 0.2,
      ...BANDS.crouchPunch
    },
    airPunch: {
      style: arch.style,
      family: 'punch',
      type: 'airPunch',
      damage: p.damage * (heavy ? 1.25 : 1.05),
      range: p.range * 0.9,
      dur: d(p.dur * arch.aDur),
      hitAt: p.hitAt * PACE * 1.15 * arch.aDur,
      knock: p.knock * 1.1 * arch.knockMult,
      cd: d(0.4),
      hitstun: 0.22,
      air: true,
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
      lunge: 160,
      ...BANDS.kick
    },
    sweep: {
      style: arch.style,
      family: 'kick',
      type: 'sweep',
      damage: p.damage * (heavy ? 0.95 : 0.75),
      range: p.range * (tech ? 1.14 : 1.05),
      dur: d(p.dur * arch.cDur),
      hitAt: k.hitAt * PACE * 1.25 * arch.cDur,
      knock: p.knock * 0.75 * arch.knockMult,
      cd: d(k.cd * 1.25),
      hitstun: 0.5,
      knockdown: true,
      ...BANDS.sweep
    },
    airKick: {
      style: arch.style,
      family: 'kick',
      type: 'airKick',
      damage: p.damage * (heavy ? 1.28 : 1.08),
      range: p.range * (agile ? 0.98 : 0.9),
      dur: d(p.dur * arch.aDur),
      hitAt: p.hitAt * PACE * 1.1 * arch.aDur,
      knock: k.knock * 1.15,
      cd: d(0.45),
      hitstun: heavy ? 0.38 : 0.28,
      air: true,
      ...BANDS.airKick
    },
    spinKick: {
      family: 'kick',
      type: 'spinKick',
      damage: k.damage * 1.3,
      range: k.range * 1.08,
      dur: d(k.dur * 1.35),
      hitAt: k.hitAt * PACE * 1.3,
      knock: k.knock * 1.55,
      cd: d(k.cd * 1.5),
      hitstun: 0.4,
      lunge: 260,
      ...BANDS.spinKick
    },
    lungePunch: {
      family: 'punch',
      type: 'lungePunch',
      damage: p.damage * 1.25,
      range: p.range * 1.25,
      dur: d(p.dur * 1.3),
      hitAt: p.hitAt * PACE * 1.15,
      knock: p.knock * 1.3,
      cd: d(p.cd * 1.35),
      hitstun: 0.24,
      lunge: 310,
      ...BANDS.lungePunch
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
      lunge: 190,
      ...BANDS.backKick
    }
  };
}

function makePlayer({ id, name, char, isBot = false, slot = 0, count = 2 }) {
  const pm = PASSIVES[char.passive && char.passive.id] || PASSIVES.none;
  const maxHp = Math.round(char.stats.hp * (pm.hp || 1) * HP_SCALE);
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
    blocking: false,
    lastHit: null,
    iframes: 0,
    slowT: 0,
    weakT: 0,
    lockT: 0,
    flipT: 0,
    superLive: null,
    superDef: char.moves.super || {},
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

/* A cinematic super is one at a time: it owns the camera and the clock. */
function superModule(charId) {
  const all = globalThis.KK_SUPERS;
  return all && all[charId] ? all[charId] : null;
}

function createMatch({ fighters, seed = 12345, roundTime = ROUND_TIME }) {
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
    projectiles: [],
    projSeq: 1,
    superShow: null,
    hitstop: 0,
    outbox: [],
    rngState: (seed >>> 0) || 1,
    seed
  };
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

  /* impact freeze frames: the whole world holds still for a beat */
  if (m.hitstop > 0) {
    m.hitstop--;
    return m;
  }

  m.tick++;

  /* the intro close-up freezes everything, the round clock included */
  if (m.superShow && m.superShow.phase === 'startup') {
    stepSuperShow(m);
    m.events = m.events || [];
    for (const e of m.events) {
      m.outbox.push(e);
      if (m.outbox.length > 40) m.outbox.shift();
    }
    return m;
  }
  m.events = [];
  m.timeLeft = Math.max(0, m.timeLeft - TICK);

  for (const p of m.players) {
    if (!p.alive) continue;

    p.cd.punch = Math.max(0, p.cd.punch - TICK);
    p.cd.kick = Math.max(0, p.cd.kick - TICK);
    p.cd.dash = Math.max(0, p.cd.dash - TICK);
    p.iframes = Math.max(0, p.iframes - TICK);
    p.hitstun = Math.max(0, p.hitstun - TICK);
    p.slowT = Math.max(0, p.slowT - TICK);
    p.weakT = Math.max(0, p.weakT - TICK);
    p.lockT = Math.max(0, p.lockT - TICK);
    if (p.flipT > 0) p.flipT = Math.max(0, p.flipT - TICK);
    if (p.downT > 0) p.downT = Math.max(0, p.downT - TICK);

    const inp = inputs[p.id] || EMPTY_INPUT;

    if (p.onGround && p.hitstun <= 0 && p.downT <= 0 && !p.attack) faceOpponents(m, p);

    /* ---- stance, read off the stick ---- */
    const my = clamp(inp.my || 0, -1, 1);
    const upHeld = my < UP_THRESHOLD;
    const wantJump = upHeld && !p.wasUp && p.onGround && p.hitstun <= 0 && p.downT <= 0;
    p.wasUp = upHeld;
    const wantCrouch = my > DOWN_THRESHOLD && p.onGround;
    /* leaning away turns a kick into a back kick; leaning in turns it into a
       spinning kick and a jab into a stepping straight */
    const mxRaw = inp.mx || 0;
    const backward = mxRaw * p.facing < -0.3;
    const forward = mxRaw * p.facing > 0.3;

    /* holding away from your opponent is a guard */
    p.blocking = p.onGround && !p.attack && p.hitstun <= 0 && p.downT <= 0 && backward;

    if (p.hitstun > 0 || p.downT > 0 || p.lockT > 0) {
      /* no control */
    } else if (p.attack) {
      p.attack.t += TICK;

      /* a strike carries the body forward into the target */
      const def = p.attack.def || {};
      if (def.lunge && p.onGround) {
        const from = p.attack.hitAt * 0.45;
        if (p.attack.t >= from && p.attack.t <= p.attack.hitAt) {
          p.vx = p.facing * def.lunge;
        } else if (p.attack.t > p.attack.hitAt) {
          p.vx *= Math.pow(0.02, TICK);
        }
      }

      if (!p.attack.hit && p.attack.t >= p.attack.hitAt) {
        p.attack.hit = true;
        resolveHit(m, p, p.attack);
      }

      /* a jab that landed can be cancelled straight into the heavy option */
      if (p.attack && p.attack.connected && p.attack.type === 'punch' && p.attack.t >= p.attack.hitAt) {
        if (inp.punch && p.cd.punch <= 0) {
          p.attack = null;
          startAttack(p, p.attacks.lungePunch, m);
          p.cd.punch = p.attacks.lungePunch.cd;
          p.attack.connected = false;
        } else if (inp.kick && p.cd.kick <= 0) {
          p.attack = null;
          startAttack(p, p.crouching ? p.attacks.sweep : p.attacks.kick, m);
          p.cd.kick = p.attacks.kick.cd;
          p.attack.connected = false;
        }
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
      const ctx = { airborne, crouch: wantCrouch && p.onGround, backward, forward };

      if (inp.super && p.meter >= SUPER_COST && p.onGround && !m.superShow) {
        const mod = superModule(p.charId);
        if (mod) {
          startCinematic(m, p, mod);
          p.crouching = false;
          continue;
        }
        p.meter = 0;
        const sd = p.superDef || {};
        p.attack = {
          type: 'super',
          t: 0,
          dur: sd.dur || 0.66,
          hitAt: sd.hitAt || 0.22,
          hit: false,
          def: sd
        };
        p.vx = 0;
        m.events.push({ type: 'superstart', x: p.x, h: p.h, r: 40, id: p.id, kind: sd.kind || 'blast' });
      } else if (inp.punch && p.cd.punch <= 0) {
        startAttack(p, pickAttack(p, 'punch', ctx), m);
      } else if (inp.kick && p.cd.kick <= 0) {
        startAttack(p, pickAttack(p, 'kick', ctx), m);
      } else if (inp.dash && p.onGround && p.cd.dash <= 0) {
        p.cd.dash = p.moves.dash.cd * p.stats.dashCd;
        if (backward) {
          /* double-tap away: backflip out of trouble, briefly invincible */
          p.vh = JUMP_V * 0.95;
          p.vx = -p.facing * 430;
          p.onGround = false;
          p.crouching = false;
          p.iframes = Math.max(p.iframes, 0.42);
          p.flipT = 0.62;
          m.events.push({ type: 'flip', x: p.x, h: p.h, id: p.id });
        } else {
          const dir = Math.abs(inp.mx) > 0.1 ? sign(inp.mx) : -p.facing;
          p.dashT = 0.16;
          p.dashDir = dir;
          p.iframes = Math.max(p.iframes, 0.1);
        }
      }
    }

    /* ---- movement ---- */
    if (p.hitstun > 0 || p.downT > 0) {
      p.vx *= Math.pow(0.02, TICK);
    } else if (p.dashT > 0) {
      p.dashT -= TICK;
      p.vx = p.dashDir * p.moves.dash.speed * 0.85;
    } else if (p.flipT > 0) {
      /* keep the flip's momentum; steering is locked mid-air */
      p.vx *= Math.pow(0.25, TICK);
    } else if (p.attack) {
      p.vx *= Math.pow(0.05, TICK);
    } else {
      const mx = clamp(inp.mx || 0, -1, 1);
      const slow = p.slowT > 0 ? 0.45 : 1;
      const speed = p.stats.speed * 215 * slow * (p.crouching ? 0.3 : p.onGround ? 1 : 0.72);
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
        if (p.attack && p.attack.def && p.attack.def.air) p.attack = null;
        m.events.push({ type: 'land', x: p.x, h: 0, id: p.id });
      }
    }

    p.x += p.vx * TICK;
    p.x = clamp(p.x, LANE.min + PLAYER_R, LANE.max - PLAYER_R);
  }

  for (const p of m.players) {
    if (p.alive && p.superLive) stepSuperLive(m, p);
  }
  stepProjectiles(m);
  if (m.superShow) stepSuperShow(m);

  /* events are also queued for the next network broadcast */
  for (const e of m.events) {
    m.outbox.push(e);
    if (m.outbox.length > 40) m.outbox.shift();
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
  if (family === 'kick') {
    if (ctx.backward) return A.backKick;   /* turning back kick */
    if (ctx.forward) return A.spinKick;    /* turn and kick */
    return A.kick;
  }
  if (ctx.forward) return A.lungePunch;    /* stepping straight */
  return A.punch;
}

function startAttack(p, def, m) {
  p.attack = { type: def.type, t: 0, dur: def.dur, hitAt: def.hitAt, hit: false, def };
  if (m) m.events.push({ type: 'swing', x: p.x, h: p.h, id: p.id, kind: def.family });
  if (def.family === 'punch') p.cd.punch = def.cd;
  else p.cd.kick = def.cd;
  /* crouching moves keep you low; everything else stands you up */
  if (def.type !== 'crouchPunch' && def.type !== 'sweep') p.crouching = false;
  if (def.family === 'kick') p.vx *= 0.2;
  p.vx *= 0.4;
}


/* ---------------------------------------------------------------- supers

   Five shapes cover the whole roster:

     blast   instant hit in a radius around you
     shot    a projectile that travels and hits once
     beam    sustained damage in a line in front of you
     flurry  sustained multi-hit close range
     aura    sustained pulse around you that can debuff        */

function fireSuper(m, p, def) {
  const kind = (def && def.kind) || 'blast';
  const d = def || {};
  /* only a blast is a radial burst; other kinds draw their own shape */
  m.events.push({ type: 'super', x: p.x, h: p.h, r: kind === 'blast' ? d.range || 180 : 46, id: p.id, kind });

  if (kind === 'blast') {
    for (const t of m.players) {
      if (t === p || !t.alive) continue;
      if (Math.abs(t.x - p.x) <= (d.range || 180)) {
        applyDamage(m, p, t, { hitstun: 0.5, knockdown: d.knockdown !== false }, d.damage || 26, d.knock || 600, 'super');
      }
    }
    return;
  }

  if (kind === 'shot') {
    const n = d.count || 1;
    for (let i = 0; i < n; i++) {
      m.projectiles.push({
        id: `p${m.projSeq++}`,
        owner: p.id,
        x: p.x + p.facing * 34,
        h: d.h0 != null ? d.h0 : 62,
        vx: p.facing * (d.speed || 520) * (1 + i * 0.05),
        vh: d.arc ? 260 : 0,
        r: d.r || 22,
        damage: d.damage || 18,
        knock: d.knock || 320,
        life: d.life || 1.8,
        gravity: d.arc ? 1900 : 0,
        bounces: d.bounces || 0,
        hitIds: [],
        look: d.look || 'shot',
        facing: p.facing
      });
    }
    return;
  }

  /* beam / flurry / aura run for a while and tick damage */
  p.superLive = {
    kind,
    def: d,
    t: 0,
    dur: d.dur || 1.0,
    interval: d.interval || 0.16,
    next: 0
  };
}

function stepSuperLive(m, p) {
  const live = p.superLive;
  if (!live) return;
  const d = live.def;
  live.t += TICK;
  live.next -= TICK;

  if (live.next <= 0) {
    live.next = live.interval;

    for (const t of m.players) {
      if (t === p || !t.alive) continue;
      const dx = t.x - p.x;
      const dist = Math.abs(dx);

      let inRange = false;
      if (live.kind === 'beam') {
        inRange = dist <= (d.range || 260) && dx * p.facing > -PLAYER_R;
      } else if (live.kind === 'flurry') {
        inRange = dist <= (d.range || 150);
      } else {
        inRange = dist <= (d.range || 170);
      }
      if (!inRange) continue;

      const [hmin, hmax] = hurtBox(t);
      const band = live.kind === 'beam' ? [20, 120] : [0, 130];
      if (hmax <= band[0] || hmin >= band[1]) continue;

      applyDamage(m, p, t, { hitstun: 0.12 }, d.damage || 4, d.knock || 40, 'super');
      if (d.slow) t.slowT = Math.max(t.slowT, d.slow);
      if (d.weak) t.weakT = Math.max(t.weakT, d.weak);
      if (d.lock) t.lockT = Math.max(t.lockT, d.lock);
    }
  }

  if (live.t >= live.dur) p.superLive = null;
}

/* ---------------------------------------------------------- cinematic supers

   A module supplies: name, four phase durations, and hit windows expressed as
   absolute times from activation. The engine owns the clock, the freeze, the
   damage and the cleanup; the module owns only how it looks. */

function startCinematic(m, p, mod) {
  const ph = mod.phases;
  m.superShow = {
    owner: p.id,
    charId: p.charId,
    name: mod.name,
    banner: mod.banner || mod.name,
    phase: 'startup',
    t: 0,
    elapsed: 0,
    total: ph.startup + ph.action + ph.impact + ph.aftermath,
    phaseDur: ph,
    fired: [],
    hitIds: [],
    dealt: 0,
    data: { plantX: p.x, landX: p.x, plantFacing: p.facing, targetId: null },
    mod
  };

  p.meter = 0;
  p.attack = null;
  /* he has to be able to run from his own bomb */
  p.lockT = Math.max(p.lockT, ph.startup);

  const foe = m.players.find((q) => q !== p && q.alive);
  if (foe) {
    m.superShow.data.targetId = foe.id;
    m.superShow.data.landX = foe.x;
  }

  m.events.push({ type: 'superstart', x: p.x, h: p.h, id: p.id, kind: mod.name });
}

function stepSuperShow(m) {
  const s2 = m.superShow;
  if (!s2) return;
  const dt = TICK;
  s2.t += dt;
  s2.elapsed += dt;

  /* phase boundaries */
  const order = ['startup', 'action', 'impact', 'aftermath'];
  let acc = 0;
  let phase = 'aftermath';
  let local = 0;
  for (const name of order) {
    const dur = s2.phaseDur[name];
    if (s2.elapsed < acc + dur) {
      phase = name;
      local = s2.elapsed - acc;
      break;
    }
    acc += dur;
    local = s2.elapsed - acc;
  }
  if (phase !== s2.phase) {
    s2.phase = phase;
    m.events.push({ type: 'superphase', x: s2.data.plantX, h: 0, id: s2.owner, kind: phase });
  }

  /* hit windows, each target struck at most once per window */
  const hits = s2.mod.hits || [];
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if (s2.fired[i] || s2.elapsed < h.at) continue;
    s2.fired[i] = true;

    const origin = h.atTarget ? s2.data.landX : s2.data.plantX;
    const owner = playerById(m, s2.owner);
    for (const t of m.players) {
      if (t === owner || !t.alive) continue;
      if (Math.abs(t.x - origin) > (h.radius || 200)) continue;
      if (s2.hitIds.indexOf(t.id) >= 0) continue;
      s2.hitIds.push(t.id);
      const room = Math.max(0, (s2.mod.damage || 40) - s2.dealt);
      const dmg = Math.min(h.damage || 0, room);
      s2.dealt += dmg;
      if (owner) {
        applyDamage(m, owner, t, { hitstun: h.hitstun || 0.5, knockdown: !!h.knockdown }, dmg, h.knock || 600, 'super');
        /* a super can also leave a debuff behind */
        if (h.slow) t.slowT = Math.max(t.slowT, h.slow);
        if (h.weak) t.weakT = Math.max(t.weakT, h.weak);
        if (h.lock) t.lockT = Math.max(t.lockT, h.lock);
      }
    }
    m.events.push({ type: 'superhit', x: origin, h: 40, r: h.radius || 200, id: s2.owner, kind: 'super' });
  }

  if (s2.elapsed >= s2.total) {
    m.events.push({ type: 'superend', x: s2.data.plantX, h: 0, id: s2.owner });
    m.superShow = null;
  }
}

function originOf(m, id) {
  const p = playerById(m, id);
  return p ? p.x : 0;
}

function stepProjectiles(m) {
  for (let i = m.projectiles.length - 1; i >= 0; i--) {
    const pr = m.projectiles[i];
    pr.life -= TICK;
    pr.vh -= pr.gravity * TICK;
    pr.x += pr.vx * TICK;
    pr.h += pr.vh * TICK;

    if (pr.h <= 0) {
      pr.h = 0;
      if (pr.bounces > 0) {
        pr.bounces--;
        pr.vh = Math.abs(pr.vh) * 0.5;
        pr.vx *= 0.75;
      } else {
        pr.vh = 0;
        pr.vx *= 0.92;
      }
    }

    for (const t of m.players) {
      if (!t.alive || t.id === pr.owner || pr.hitIds.includes(t.id)) continue;
      const [hmin, hmax] = hurtBox(t);
      if (Math.abs(t.x - pr.x) > pr.r + PLAYER_R) continue;
      if (pr.h < hmin - pr.r || pr.h > hmax + pr.r) continue;
      pr.hitIds.push(t.id);
      const owner = playerById(m, pr.owner) || t;
      applyDamage(m, owner, t, { hitstun: 0.3 }, pr.damage, pr.knock, 'super');
      pr.life = Math.min(pr.life, 0.06);
    }

    if (pr.life <= 0 || pr.x < LANE.min - 140 || pr.x > LANE.max + 140) m.projectiles.splice(i, 1);
  }
}

function resolveHit(m, p, atk) {
  if (atk.type === 'super') {
    fireSuper(m, p, atk.def);
    return;
  }

  const def = atk.def;
  const offset = def.air ? p.h : 0;
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

  /* Guard: low hits need a crouching guard, overheads need a standing one,
     everything else can be blocked either way. */
  if (tgt.blocking && src !== tgt) {
    const low = kind === 'sweep';
    const overhead = kind === 'airPunch' || kind === 'airKick';
    const holds = low ? tgt.crouching : overhead ? !tgt.crouching : true;

    if (holds) {
      const chip = baseDmg * 0.15;
      tgt.hp = Math.max(0, tgt.hp - chip);
      tgt.vx = (sign(tgt.x - src.x) || src.facing) * (knockBase * src.stats.knock * 0.45) / (tgt.stats.weight || 1) * 2.4;
      tgt.hitstun = Math.max(tgt.hitstun, (def.hitstun || 0.18) * 0.65);
      tgt.blockFlash = 0.22;
      m.events.push({ type: 'block', x: tgt.x, h: tgt.h + 65, id: src.id, on: tgt.id, kind });
      return false;
    }
  }
  const dmg = baseDmg * src.stats.power * (src.weakT > 0 ? 0.6 : 1);
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
  tgt.lastHit = kind;
  /* what the renderer needs to pick a reaction: kind, side, and how hard */
  tgt.hitInfo = {
    kind,
    dir: tgt.x >= src.x ? 1 : -1,
    tier: dmg >= 16 ? 'heavy' : dmg >= 8 ? 'medium' : 'light',
    heavy: !!def.knockdown
  };
  tgt.iframes = 0.08;
  tgt.attack = null;

  src.meter = Math.min(SUPER_COST, src.meter + dmg * 1.5 * src.stats.meter);
  tgt.meter = Math.min(SUPER_COST, tgt.meter + dmg * 1.0 * tgt.stats.meter);

  const tier = dmg >= 16 ? 'heavy' : dmg >= 8 ? 'medium' : 'light';
  /* impact freeze frames, deterministic and identical for host and guest */
  m.hitstop = tier === 'heavy' ? 4 : tier === 'medium' ? 2 : 0;
  m.events.push({ type: 'hit', x: tgt.x, h: tgt.h + 60, dmg: Math.round(dmg), tier, id: src.id, on: tgt.id, kind });

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

/* Gameplay randomness must be reproducible: never Math.random here. */
/* Which part of the body an attack lands on. Drives the reaction pose. */
const HIT_HEIGHT = {
  punch: 'high',
  lungePunch: 'high',
  airPunch: 'high',
  crouchPunch: 'up',
  kick: 'body',
  spinKick: 'body',
  backKick: 'body',
  airKick: 'body',
  sweep: 'low',
  super: 'super'
};

function nextRandom(m) {
  m.rngState = (m.rngState * 1664525 + 1013904223) >>> 0;
  return m.rngState / 4294967296;
}

function playerById(m, id) {
  return m.players.find((p) => p.id === id) || null;
}

/* Compact wire format. Short keys keep the packet small on mobile; every field
   the renderer needs is here, so a guest can draw a frame without simulating. */
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
      bl: p.blocking ? 1 : 0,
      fl: p.flipT > 0 ? 1 : 0,
      sl: p.slowT > 0 ? 1 : 0,
      lk: p.lockT > 0 ? 1 : 0,
      at: p.attack ? p.attack.type : 0,
      ad: p.attack ? Math.round(p.attack.dur * 100) / 100 : 0,
      ap: p.attack ? Math.round((p.attack.t / p.attack.dur) * 100) / 100 : 0,
      su: p.superLive
        ? { k: p.superLive.kind, t: Math.round(p.superLive.t * 10) / 10, d: Math.round(p.superLive.dur * 10) / 10 }
        : 0
    })),
    sup: m.superShow
      ? {
          o: m.superShow.owner,
          c: m.superShow.charId,
          ph: m.superShow.phase,
          e: Math.round(m.superShow.elapsed * 100) / 100,
          x: Math.round(m.superShow.data.plantX),
          lx: Math.round(m.superShow.data.landX)
        }
      : 0,
    pr: m.projectiles.map((pr) => ({
      i: pr.id,
      o: pr.owner,
      x: Math.round(pr.x),
      h: Math.round(pr.h),
      r: Math.round(pr.r),
      l: pr.look,
      f: pr.facing
    })),
    e: m.outbox.map((e) => ({
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

/* Apply a snapshot to a local match. Returns the events for the caller to play;
   positions are also left as interpolation targets for smooth guest rendering. */
function unpackSnapshot(snap, match) {
  for (const sp of snap.p) {
    const p = playerById(match, sp.i);
    if (!p) continue;

    p.tx = sp.x;
    p.th = sp.h;
    p.tf = sp.f;

    p.x = sp.x;
    p.h = sp.h;
    p.facing = sp.f;
    p.hp = sp.hp;
    p.meter = sp.m;
    p.alive = !!sp.a;
    p.onGround = !!sp.g;
    p.blocking = !!sp.bl;
    p.crouching = !!sp.c;
    p.downT = sp.d ? 0.5 : 0;
    p.flipT = sp.fl ? 0.35 : 0;
    p.slowT = sp.sl ? 0.4 : 0;
    p.lockT = sp.lk ? 0.4 : 0;

    p.attack = sp.at
      ? {
          type: sp.at,
          t: (sp.ap || 0) * (sp.ad || 0.4),
          dur: sp.ad || 0.4,
          hitAt: 0,
          hit: true,
          def: (p.attacks && p.attacks[sp.at]) || null
        }
      : null;

    p.superLive = sp.su ? { kind: sp.su.k, t: sp.su.t, dur: sp.su.d, def: p.superDef || {} } : null;
  }

  match.projectiles = (snap.pr || []).map((pr) => ({
    id: pr.i,
    owner: pr.o,
    x: pr.x,
    h: pr.h,
    r: pr.r,
    vx: 0,
    vh: 0,
    gravity: 0,
    life: 1,
    damage: 0,
    knock: 0,
    bounces: 0,
    hitIds: ['*'],
    look: pr.l,
    facing: pr.f
  }));

  match.tick = snap.k;
  match.timeLeft = snap.tl;
  match.over = !!snap.ov;
  match.winner = snap.w || null;

  return (snap.e || []).map((e) => ({
    type: e.y,
    x: e.x,
    h: e.h,
    id: e.id,
    on: e.on,
    kind: e.k,
    r: e.r
  }));
}

  globalThis.KK_Engine = {
    TICK, LANE, PLAYER_R, BODY_GAP, STAND_H, CROUCH_H, GRAVITY, JUMP_V, ROUND_TIME, SUPER_COST, HP_SCALE,
    EMPTY_INPUT, makePlayer, createMatch, stepMatch, playerById, packSnapshot,
    unpackSnapshot, hurtBox, buildAttacks, HIT_HEIGHT, nextRandom
  };
})();
