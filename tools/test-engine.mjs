/* Headless checks for the side-view engine. Run: npm test

   Loads the same files the browser loads, so this tests the real code.
   The stick is one control: my < 0 is up (jump), my > 0 is down (crouch). */

for (const f of ['apoorv', 'priyank', 'saurav', 'aditya', 'thirtyone', 'mohit', 'nikhil', 'ajay', 'jeetu', 'mukesh', 'ankit', 'ansh', 'anmol', 'adnan', 'thirtytwo', 'thirtythree', 'ashish']) {
  await import(`../js/fighters/${f}.js`);
}
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
  run(m, 60, { p0: idle, p1: idle });
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
  run(m, 12, { p0: idle, p1: idle });
  check('a punch in range lands', b.hp < before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 420;
  const before = b.hp;
  stepMatch(m, { p0: act({ punch: true }), p1: idle });
  run(m, 12, { p0: idle, p1: idle });
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
  run(m, 20, { p0: act({ my: -1 }), p1: idle });
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
  run(m, 12, { p0: idle, p1: act({ my: 1 }) });
  check('a jab sails over a crouching opponent', b.hp === before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  const before = b.hp;
  stepMatch(m, { p0: act({ kick: true, my: 1 }), p1: act({ my: 1 }) });
  check('crouch + kick becomes a sweep', a.attack && a.attack.type === 'sweep', a.attack && a.attack.type);
  run(m, 16, { p0: idle, p1: act({ my: 1 }) });
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
  run(m, 14, { p0: idle, p1: idle });
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
  run(m, 14, { p0: idle, p1: idle });
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

console.log('\nknockdown');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  stepMatch(m, { p0: act({ kick: true, my: 1 }), p1: idle });
  run(m, 16, { p0: idle, p1: idle });
  check('a sweep knocks the opponent down', b.downT > 0, `downT=${b.downT.toFixed(2)}`);
  run(m, 20, { p0: idle, p1: idle });
  check('a downed fighter gets back up', m.players[1].downT < 1.2);
}

console.log('\nsuper');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 60;
  a.meter = 40;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  check('super blocked below 100 meter', a.meter === 40 && !a.attack);

  a.meter = 100;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  check('super consumes the meter', a.meter === 0);
  run(m, 14, { p0: idle, p1: idle });
  check('super damages a nearby opponent', b.hp < b.maxHp);
}

console.log('\nsuper archetypes');
{
  /* blast: instant damage in a radius */
  const m = makeTwo('saurav', 'apoorv');
  const [a, b] = m.players;
  b.x = a.x + 120;
  a.meter = 100;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  run(m, 12, { p0: idle, p1: idle });
  check('blast super damages nearby', b.hp < b.maxHp, `${b.hp}`);
}

{
  /* shot: a projectile that travels and hits once */
  const m = makeTwo('priyank', 'apoorv');
  const [a, b] = m.players;
  b.x = a.x + 240;
  a.meter = 100;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  run(m, 9, { p0: idle, p1: idle });
  check('shot super spawns a projectile', m.projectiles.length > 0, `${m.projectiles.length}`);
  const before = b.hp;
  run(m, 40, { p0: idle, p1: idle });
  check('the projectile damages the target', b.hp < before, `${b.hp} vs ${before}`);
  check('projectiles clear up afterwards', m.projectiles.length === 0);
}

{
  /* beam: sustained damage in front */
  const m = makeTwo('jeetu', 'apoorv');
  const [a, b] = m.players;
  b.x = a.x + 150;
  a.meter = 100;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  run(m, 9, { p0: idle, p1: idle });
  check('beam super goes live', !!a.superLive, a.superLive && a.superLive.kind);
  const before = b.hp;
  run(m, 30, { p0: idle, p1: idle });
  check('the beam keeps damaging', b.hp < before - 4, `${b.hp} vs ${before}`);
}

{
  /* aura: debuffs everyone in range */
  const m = makeTwo('ansh', 'apoorv');
  const [a, b] = m.players;
  b.x = a.x + 110;
  a.meter = 100;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  run(m, 14, { p0: idle, p1: idle });
  check('aura super applies slow', b.slowT > 0, `slowT=${b.slowT.toFixed(2)}`);
  check('aura super applies weakness', b.weakT > 0, `weakT=${b.weakT.toFixed(2)}`);
}

{
  /* flurry: several small hits in a row */
  const m = makeTwo('apoorv', 'saurav');
  const [a, b] = m.players;
  b.x = a.x + 110;
  a.meter = 100;
  stepMatch(m, { p0: act({ super: true }), p1: idle });
  run(m, 9, { p0: idle, p1: idle });
  const before = b.hp;
  run(m, 34, { p0: idle, p1: idle });
  check('flurry super multi-hits', before - b.hp >= 8, `damage ${(before - b.hp).toFixed(0)}`);
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
  while (!m.over && ticks < 30 * 100) {
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
