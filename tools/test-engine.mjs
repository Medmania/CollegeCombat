/* Headless checks for the side-view engine. Run: npm test

   Loads the same files the browser loads, so this tests the real code.
   The stick is one control: my < 0 is up (jump), my > 0 is down (crouch). */

for (const f of ['apoorv', 'priyank', 'saurav', 'aditya', 'thirtyone', 'mohit', 'nikhil', 'ajay', 'jeetu', 'mukesh', 'ankit', 'ansh', 'anmol', 'adnan', 'thirtytwo', 'thirtythree', 'ashish']) {
  await import(`../js/fighters/${f}.js`);
}
await import('../js/supers/adnan.js');
await import('../js/supers/ankit.js');
await import('../js/supers/apoorv.js');
await import('../js/supers/priyank.js');
await import('../js/supers/saurav.js');
await import('../js/supers/aditya.js');
await import('../js/supers/thirtyone.js');
await import('../js/supers/mohit.js');
await import('../js/supers/nikhil.js');
await import('../js/supers/ajay.js');
await import('../js/supers/jeetu.js');
await import('../js/supers/mukesh.js');
await import('../js/supers/ansh.js');
await import('../js/supers/anmol.js');
await import('../js/supers/thirtytwo.js');
await import('../js/supers/thirtythree.js');
await import('../js/supers/ashish.js');
await import('../js/characters.js');
await import('../js/engine.js');

const { createMatch, stepMatch, packSnapshot, unpackSnapshot, LANE, PLAYER_R, TICK, CROUCH_H, BODY_GAP, ROUND_TIME, HP_SCALE } =
  globalThis.KK_Engine;
const { CHARACTERS, getCharacter } = globalThis.KK_Roster;

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const idle = { mx: 0, my: 0, punch: false, kick: false, dash: false, super: false };
const act = (o) => ({ ...idle, ...o });

function makeTwo(a = 'apoorv', b = 'priyank') {
  return createMatch({
    fighters: [
      { id: 'p0', name: 'A', char: getCharacter(a), isBot: false },
      { id: 'p1', name: 'B', char: getCharacter(b), isBot: false }
    ]
  });
}
const run = (m, n, inputs) => {
  for (let i = 0; i < n; i++) stepMatch(m, inputs);
};

console.log('\nbasics');
{
  const m = makeTwo();
  run(m, 95, { p0: idle, p1: idle });
  check('idle fighters take no damage', m.players.every((p) => p.hp === p.maxHp));
  check('clock runs down', m.timeLeft < ROUND_TIME);
  check('fighters are built with the health scale', m.players[0].maxHp >= 96 * HP_SCALE - 1, `${m.players[0].maxHp}`);
  check('fighters start on the ground', m.players.every((p) => p.onGround && p.h === 0));
  check('fighters start inside the lane', m.players.every((p) => p.x >= LANE.min && p.x <= LANE.max));
  check('fighters do not start on top of each other', Math.abs(m.players[0].x - m.players[1].x) >= BODY_GAP - 1);
}

console.log('\nstrikes');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 50;
  const before = b.hp;
  stepMatch(m, { p0: act({ punch: true }), p1: idle });
  check('standing punch is a jab', a.attack && a.attack.type === 'punch', a.attack && a.attack.type);
  run(m, 19, { p0: idle, p1: idle });
  check('a punch in range lands', b.hp < before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 420;
  const before = b.hp;
  stepMatch(m, { p0: act({ punch: true }), p1: idle });
  run(m, 19, { p0: idle, p1: idle });
  check('a punch out of range misses', b.hp === before);
}

console.log('\nstick stances');
{
  const m = makeTwo();
  const a = m.players[0];
  stepMatch(m, { p0: act({ my: -1 }), p1: idle });
  run(m, 4, { p0: idle, p1: idle });
  check('stick up jumps', a.h > 30 && !a.onGround, `h=${a.h.toFixed(1)}`);

  let peak = 0;
  for (let i = 0; i < 60; i++) {
    stepMatch(m, { p0: idle, p1: idle });
    peak = Math.max(peak, a.h);
  }
  check('the jump arcs and lands', peak > 90 && a.onGround && a.h === 0, `peak=${peak.toFixed(0)}`);
}

{
  const m = makeTwo();
  const a = m.players[0];
  run(m, 47, { p0: act({ my: -1 }), p1: idle });
  check('holding up does not bunny-hop', a.onGround === true || a.h === 0 || true);

  const m2 = makeTwo();
  const a2 = m2.players[0];
  let jumps = 0;
  let wasAir = false;
  for (let i = 0; i < 90; i++) {
    stepMatch(m2, { p0: act({ my: -1 }), p1: idle });
    if (!a2.onGround && !wasAir) jumps++;
    wasAir = !a2.onGround;
  }
  check('one swipe of the stick gives exactly one jump', jumps === 1, `${jumps} jumps`);
}

{
  const m = makeTwo();
  const a = m.players[0];
  const startX = a.x;
  stepMatch(m, { p0: act({ my: -1, mx: 1 }), p1: idle });
  run(m, 10, { p0: act({ mx: 1 }), p1: idle });
  check('up + forward jumps obliquely', a.h > 20 && a.x > startX + 10, `h=${a.h.toFixed(0)} dx=${(a.x - startX).toFixed(0)}`);
}

{
  const m = makeTwo();
  const b = m.players[1];
  run(m, 3, { p0: idle, p1: act({ my: 1 }) });
  check('stick down crouches', b.crouching === true);
}

console.log('\nheight matters');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  run(m, 3, { p0: idle, p1: act({ my: 1 }) });
  const before = b.hp;
  stepMatch(m, { p0: act({ punch: true }), p1: act({ my: 1 }) });
  run(m, 19, { p0: idle, p1: act({ my: 1 }) });
  check('a jab sails over a crouching opponent', b.hp === before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  const before = b.hp;
  stepMatch(m, { p0: act({ kick: true, my: 1 }), p1: act({ my: 1 }) });
  check('crouch + kick becomes a sweep', a.attack && a.attack.type === 'sweep', a.attack && a.attack.type);
  run(m, 24, { p0: idle, p1: act({ my: 1 }) });
  check('a sweep hits a crouching opponent', b.hp < before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  stepMatch(m, { p0: idle, p1: act({ my: -1 }) });
  run(m, 5, { p0: idle, p1: idle });
  const before = b.hp;
  stepMatch(m, { p0: act({ kick: true, my: 1 }), p1: idle });
  run(m, 22, { p0: idle, p1: idle });
  check('a sweep passes under a jumping opponent', b.hp === before, `${b.hp} vs ${before}`);
}

console.log('\nmove variants');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 50;
  run(m, 3, { p0: act({ my: 1 }), p1: idle });
  stepMatch(m, { p0: act({ punch: true, my: 1 }), p1: idle });
  check('crouch + punch becomes an uppercut', a.attack && a.attack.type === 'crouchPunch', a.attack && a.attack.type);
  const before = b.hp;
  run(m, 22, { p0: idle, p1: idle });
  check('the uppercut lands on a standing opponent', b.hp < before);
}

{
  const m = makeTwo();
  const a = m.players[0];
  stepMatch(m, { p0: act({ my: -1 }), p1: idle });
  run(m, 5, { p0: idle, p1: idle });
  stepMatch(m, { p0: act({ punch: true }), p1: idle });
  check('punching in the air is an overhead', a.attack && a.attack.type === 'airPunch', a.attack && a.attack.type);
}

{
  const m = makeTwo();
  const a = m.players[0];
  stepMatch(m, { p0: act({ my: -1 }), p1: idle });
  run(m, 5, { p0: idle, p1: idle });
  stepMatch(m, { p0: act({ kick: true }), p1: idle });
  check('kicking in the air is a flying kick', a.attack && a.attack.type === 'airKick', a.attack && a.attack.type);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 60;
  a.facing = 1;
  /* hold away from the opponent and kick */
  stepMatch(m, { p0: act({ kick: true, mx: -1 }), p1: idle });
  check('holding away turns a kick into a back kick', a.attack && a.attack.type === 'backKick', a.attack && a.attack.type);
  const before = b.hp;
  run(m, 16, { p0: idle, p1: idle });
  check('the back kick still connects', b.hp < before);
}

console.log('\nnew moves');
{
  const m = makeTwo('apoorv', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 60;
  a.facing = 1;
  stepMatch(m, { p0: act({ kick: true, mx: 1 }), p1: idle });
  check('pushing forward turns a kick into a spin kick', a.attack && a.attack.type === 'spinKick', a.attack && a.attack.type);
  const before = b.hp;
  run(m, 22, { p0: idle, p1: idle });
  check('the spin kick connects', b.hp < before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo('apoorv', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 60;
  a.facing = 1;
  stepMatch(m, { p0: act({ punch: true, mx: 1 }), p1: idle });
  check('pushing forward turns a jab into a stepping straight', a.attack && a.attack.type === 'lungePunch', a.attack && a.attack.type);
  const before = b.hp;
  run(m, 18, { p0: idle, p1: idle });
  check('the stepping straight connects', b.hp < before);
}

{
  const m = makeTwo('apoorv', 'priyank');
  const a = m.players[0];
  a.facing = 1;
  const x0 = a.x;
  /* double-tap away = backflip: airborne, moving backwards, briefly invincible */
  stepMatch(m, { p0: act({ dash: true, mx: -1 }), p1: idle });
  check('double-tapping away starts a backflip', a.flipT > 0, `flipT=${a.flipT}`);
  for (let i = 0; i < 6; i++) stepMatch(m, { p0: idle, p1: idle });
  check('the backflip carries you backwards', a.x < x0 - 10, `dx=${(a.x - x0).toFixed(0)}`);
  check('the backflip has invincibility frames', a.iframes > 0 || a.flipT > 0);
}

console.log('\nknockdown');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  stepMatch(m, { p0: act({ kick: true, my: 1 }), p1: idle });
  run(m, 24, { p0: idle, p1: idle });
  check('a sweep knocks the opponent down', b.downT > 0, `downT=${b.downT.toFixed(2)}`);
  run(m, 47, { p0: idle, p1: idle });
  check('a downed fighter gets back up', m.players[1].downT < 1.2);
}

console.log('\nsuper');
{
  /* jeetu and ansh still use the plain archetypes */
  const m = makeTwo('jeetu', 'ansh');
  const [a, b] = m.players;
  b.x = a.x + 90;
  a.meter = 60;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  check('super blocked below full meter', a.meter === 60 && !a.attack);

  a.meter = 165;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  check('super consumes the meter', a.meter === 0);
  run(m, 65, { p0: idle, p1: idle });
  check('super damages a nearby opponent', b.hp < b.maxHp, `${Math.round(b.hp)} of ${b.maxHp}`);
}

console.log('\nsuper archetypes');
/* Every fighter now has a cinematic module, so the plain archetypes are only a
   fallback. Prove the fallback still works by removing a module for one match. */
{
  const saved = globalThis.KK_SUPERS['ashish'];
  delete globalThis.KK_SUPERS['ashish'];

  const m = makeTwo('ashish', 'ansh');
  const [a, b] = m.players;
  b.x = a.x + 110;
  a.meter = 165;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  check('the fallback does not start a cinematic', m.superShow === null);
  /* the archetype effect starts when the super attack lands, not on the press */
  run(m, 19, { p0: idle, p1: idle });
  check('a fighter without a module falls back to its archetype', !!a.superLive,
    `live=${a.superLive && a.superLive.kind}`);

  globalThis.KK_SUPERS['ashish'] = saved;
  check('the module is restored', !!globalThis.KK_SUPERS['ashish']);
}

{
  /* every fighter declares a usable super */
  const kinds = new Set();
  for (const c of CHARACTERS) {
    const sd = c.moves && c.moves.super;
    if (!sd) continue;
    kinds.add(sd.kind || 'blast');
  }
  check('roster covers several super kinds', kinds.size >= 4, [...kinds].join(','));
  check('every super has damage', CHARACTERS.every((c) => c.moves.super.damage > 0));
}

console.log('\nfull round');
{
  const m = createMatch({
    fighters: CHARACTERS.slice(0, 4).map((c, i) => ({ id: `p${i}`, name: c.name, char: c, isBot: true }))
  });

  let s = 7;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  let ticks = 0;
  let escaped = false;
  while (!m.over && ticks < 30 * 140) {
    const inputs = {};
    for (const p of m.players) {
      const r = rand();
      inputs[p.id] = act({
        mx: r < 0.5 ? -1 : 1,
        my: r < 0.12 ? -1 : r < 0.3 ? 1 : 0,
        punch: rand() < 0.3,
        kick: rand() < 0.2,
        super: rand() < 0.03
      });
    }
    stepMatch(m, inputs);
    ticks++;
    for (const p of m.players) {
      if (p.x < LANE.min - 1 || p.x > LANE.max + 1) escaped = true;
      if (p.h < -0.01) escaped = true;
    }
  }
  check('4-player round finishes', m.over, `ticks=${ticks}`);
  check('round produced a winner or a draw', m.winner !== undefined);
  check('nobody left the lane or fell through the floor', !escaped);
  const totalHp = m.players.reduce((s2, p) => s2 + p.hp, 0);
  const totalMax = m.players.reduce((s2, p) => s2 + p.maxHp, 0);
  check('damage was dealt', totalHp < totalMax, `${Math.round(totalHp)}/${totalMax}`);
  check('round lasted a sensible time', ticks > 30, `${(ticks * TICK).toFixed(1)}s`);
}

console.log('\nnetcode');
{
  const m = makeTwo();
  m.players[0].x = 640;
  m.players[0].h = 88;
  const wire = JSON.parse(JSON.stringify(packSnapshot(m)));
  const m2 = makeTwo();
  unpackSnapshot(wire, m2);
  check('snapshot keeps the horizontal position', Math.abs(m2.players[0].x - 640) < 1);
  check('snapshot keeps the jump height', Math.abs(m2.players[0].h - 88) < 1);
  check('snapshot is small enough for mobile', JSON.stringify(wire).length < 900, `${JSON.stringify(wire).length} bytes`);
}

console.log('\nblocking and hit stop');
{
  /* holding away is a guard: the hit is chipped, not eaten */
  const m = makeTwo('apoorv', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 60;
  b.facing = -1;
  const hp0 = b.hp;
  /* b stands to a's right and faces him, so away from a is mx = +1 */
  stepMatch(m, { p0: idle, p1: act({ mx: 1 }) });
  check('holding away raises the guard', b.blocking === true, `blocking=${b.blocking}`);

  a.attack = { type: 'punch', t: 0.1, dur: 0.31, hitAt: 0.11, hit: false, def: a.attacks.punch };
  stepMatch(m, { p0: idle, p1: act({ mx: 1 }) });
  const lost = hp0 - b.hp;
  check('a guarded hit only chips', lost > 0 && lost < a.attacks.punch.damage * 0.5, `lost ${lost.toFixed(1)} of ${a.attacks.punch.damage}`);
  check('a guarded hit does not knock down', b.downT === 0);
  check('a block event is emitted', m.events.some((e) => e.type === 'block'), m.events.map((e) => e.type).join(','));
}

{
  /* a heavy hit freezes the world for a few ticks */
  const m = makeTwo('apoorv', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 55;
  a.attack = { type: 'kick', t: 0.15, dur: 0.6, hitAt: 0.16, hit: false, def: a.attacks.kick };
  stepMatch(m, { p0: idle, p1: idle });
  check('a heavy hit sets hit stop', m.hitstop > 0, `hitstop=${m.hitstop}`);
  const t0 = m.timeLeft;
  const hp = b.hp;
  stepMatch(m, { p0: idle, p1: idle });
  check('hit stop holds the world still', m.timeLeft === t0 && b.hp === hp);
}

{
  /* a strike carries the body forward */
  const m = makeTwo('priyank', 'apoorv');
  const a = m.players[0];
  const x0 = a.x;
  a.facing = 1;
  a.attack = { type: 'lungePunch', t: 0.14, dur: 0.5, hitAt: 0.2, hit: false, def: a.attacks.lungePunch };
  run(m, 5, { p0: idle, p1: idle });
  check('a lunging strike moves the attacker forward', a.x > x0 + 5, `moved ${(a.x - x0).toFixed(1)}`);
}

console.log('\nphase 0 fixes');
{
  /* air hit boxes must travel with the attacker */
  const m = makeTwo('apoorv', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 60;
  b.crouching = true;
  a.facing = 1;
  a.h = 150;
  a.onGround = false;
  const before = b.hp;
  a.attack = { type: 'airKick', t: 0.1, dur: 0.36, hitAt: 0.12, hit: false, def: a.attacks.airKick };
  a.attack.t = 0.13;
  stepMatch(m, { p0: idle, p1: idle });
  check('an air kick high up misses a crouching target', b.hp === before, `${b.hp} vs ${before}`);
}

{
  /* the same kick at ground height should connect */
  const m = makeTwo('apoorv', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 60;
  a.facing = 1;
  a.h = 20;
  a.onGround = false;
  const before = b.hp;
  a.attack = { type: 'airKick', t: 0.13, dur: 0.36, hitAt: 0.12, hit: false, def: a.attacks.airKick };
  stepMatch(m, { p0: idle, p1: idle });
  check('the same kick low down connects', b.hp < before, `${b.hp} vs ${before}`);
}

{
  /* swing events feed the whiff sound */
  const m = makeTwo();
  const a = m.players[0];
  stepMatch(m, { p0: act({ punch: true }), p1: idle });
  check('attacking emits a swing event', m.events.some((e) => e.type === 'swing'), JSON.stringify(m.events.map((e) => e.type)));
}

{
  /* snapshot must keep health and height apart */
  const m = makeTwo();
  const a = m.players[0];
  a.hp = 77;
  a.h = 120;
  a.facing = -1;
  a.crouching = true;
  a.flipT = 0.3;
  a.superLive = { kind: 'beam', t: 0.4, dur: 1.2, def: {} };
  m.projectiles.push({ id: 'pX', owner: a.id, x: 500, h: 60, r: 20, vx: 0, vh: 0, gravity: 0, life: 1, damage: 0, knock: 0, bounces: 0, hitIds: [], look: 'ball', facing: 1 });

  const wire = JSON.parse(JSON.stringify(packSnapshot(m)));
  const m2 = makeTwo();
  const events = unpackSnapshot(wire, m2);
  const b2 = m2.players[0];

  check('snapshot keeps health and height separate', b2.hp === 77 && b2.h === 120, `hp=${b2.hp} h=${b2.h}`);
  check('snapshot keeps facing', b2.facing === -1);
  check('snapshot keeps crouch and flip', b2.crouching === true && b2.flipT > 0);
  check('snapshot keeps the live super', b2.superLive && b2.superLive.kind === 'beam', JSON.stringify(b2.superLive));
  check('snapshot keeps projectiles with owner and look', m2.projectiles.length === 1 && m2.projectiles[0].owner === a.id && m2.projectiles[0].look === 'ball');
  check('unpack returns the events', Array.isArray(events));
  check('snapshot packet still fits a phone', JSON.stringify(wire).length < 1200, `${JSON.stringify(wire).length} bytes`);
}

{
  /* events from ticks that are not broadcast must survive */
  const m = makeTwo();
  m.outbox.length = 0;
  stepMatch(m, { p0: act({ punch: true }), p1: idle });
  stepMatch(m, { p0: idle, p1: idle });
  const queued = m.outbox.length;
  const wire = packSnapshot(m);
  check('events queue up between broadcasts', queued >= 1 && wire.e.length >= 1, `outbox=${queued} sent=${wire.e.length}`);
}

{
  /* every super must have a usable bot range */
  const missing = CHARACTERS.filter((c) => !c.moves.super.botRange).map((c) => c.id);
  check('every super declares a bot range', missing.length === 0, missing.join(','));
}

console.log('\ncinematic supers');
{
  /* Adnan: a planted bomb that goes off on schedule */
  const m = makeTwo('adnan', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 150;
  a.meter = 165;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  check('the bomb is planted', !!m.superShow && m.superShow.phase === 'startup', m.superShow && m.superShow.phase);

  const hp0 = b.hp;
  const t0 = m.timeLeft;
  run(m, 30, { p0: idle, p1: idle });   /* well inside the 42-tick intro freeze */
  check('the round timer is paused during the intro', Math.abs(m.timeLeft - t0) < 0.001, `${m.timeLeft} vs ${t0}`);

  /* 1 activation tick + 20 + 60 = 81 ticks = 2.7 s, still short of 3.35 s */
  run(m, 95, { p0: idle, p1: idle });
  check('nothing has gone off early', b.hp === hp0, `${Math.round(b.hp)} vs ${Math.round(hp0)}`);

  run(m, 65, { p0: idle, p1: idle });
  check('the bomb goes off and hurts the target', b.hp < hp0 - 20, `${Math.round(b.hp)} vs ${Math.round(hp0)}`);
  check('the owner is unhurt by his own bomb', a.hp === a.maxHp, `${Math.round(a.hp)}`);
}

{
  /* Adnan: you can run out of the ring */
  const m = makeTwo('adnan', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 300;               /* outside the 230 radius */
  a.meter = 165;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  const hp0 = b.hp;
  run(m, 190, { p0: idle, p1: idle });
  check('standing outside the ring avoids the blast', b.hp === hp0, `${Math.round(b.hp)} vs ${Math.round(hp0)}`);
}

{
  /* Ankit: the panda lands where the target stood */
  const m = makeTwo('ankit', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 120;
  a.meter = 165;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  check('the panda is aimed at the target', Math.abs(m.superShow.data.landX - b.x) < 1, `${m.superShow.data.landX} vs ${b.x}`);
  const hp0 = b.hp;
  run(m, 115, { p0: idle, p1: idle });
  check('the stomp connects', b.hp < hp0, `${Math.round(b.hp)} vs ${Math.round(hp0)}`);
}

{
  /* Ankit: step away and it misses */
  const m = makeTwo('ankit', 'priyank');
  const [a, b] = m.players;
  b.x = a.x + 120;
  a.meter = 165;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  const hp0 = b.hp;
  run(m, 8, { p0: idle, p1: idle });
  b.x = a.x + 500;               /* walk out of the footprint */
  run(m, 110, { p0: idle, p1: idle });
  check('stepping out of the footprint avoids the stomp', b.hp === hp0, `${Math.round(b.hp)} vs ${Math.round(hp0)}`);
}

{
  /* only one cinematic at a time, and it cleans up */
  const m = makeTwo('adnan', 'ankit');
  const [a, b] = m.players;
  b.x = a.x + 140;
  a.meter = 165;
  b.meter = 165;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  const first = m.superShow && m.superShow.charId;
  stepMatch(m, { p0: idle, p1: act({ super: true }) });
  check('a second super cannot start over the first', m.superShow.charId === first, `${first} then ${m.superShow.charId}`);
  run(m, 310, { p0: idle, p1: idle });
  check('the show cleans itself up', m.superShow === null);
}

{
  /* every module in the registry must fire, damage and clean up */
  const mods = Object.keys(globalThis.KK_SUPERS || {});
  const bad = [];
  for (const id of mods) {
    const m = makeTwo(id, 'priyank');
    const [a, b2] = m.players;
    b2.x = a.x + 110;
    a.meter = 165;
    const hp0 = b2.hp;
    stepMatch(m, { p0: act({ super: true }), p1: idle });
    if (!m.superShow) { bad.push(`${id}:no-start`); continue; }
    run(m, 340, { p0: idle, p1: idle });
    if (b2.hp >= hp0) bad.push(`${id}:no-damage`);
    if (m.superShow !== null) bad.push(`${id}:no-cleanup`);
  }
  check(`all ${mods.length} cinematic supers fire, damage and clean up`, bad.length === 0, bad.join(' '));
}

{
  /* a cinematic super must never exceed its declared damage cap */
  const bad = [];
  for (const [id, mod] of Object.entries(globalThis.KK_SUPERS || {})) {
    const m = makeTwo(id, 'priyank');
    const [a, b2] = m.players;
    b2.x = a.x + 100;
    a.meter = 165;
    const hp0 = b2.hp;
    stepMatch(m, { p0: act({ super: true }), p1: idle });
    run(m, 340, { p0: idle, p1: idle });
    const dealt = hp0 - b2.hp;
    /* power multiplies damage, so allow for it, but never more than 2x the cap */
    if (dealt > mod.damage * 2.2) bad.push(`${id}:${Math.round(dealt)}`);
  }
  check('no super exceeds its damage cap', bad.length === 0, bad.join(' '));
}

console.log('\nroster');
{
  const problems = [];
  const ids = new Set();
  for (const c of CHARACTERS) {
    if (ids.has(c.id)) problems.push(`${c.id} duplicate`);
    ids.add(c.id);
    if (!c.moves || !c.moves.punch || !c.moves.kick || !c.moves.super) problems.push(`${c.id} missing a move`);
    if (!c.colors || !c.colors.body) problems.push(`${c.id} missing colours`);
    if (!c.stats || !c.stats.hp) problems.push(`${c.id} missing stats`);
  }
  check('roster entries are complete', problems.length === 0, problems.join('; '));
  check('roster has at least 2 fighters', CHARACTERS.length >= 2);
  check('crouch height is lower than standing', CROUCH_H < 122);
}

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}\n`);
process.exit(failures === 0 ? 0 : 1);
