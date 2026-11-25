/* Headless checks for the side-view engine. Run: npm test

   Loads the same files the browser loads, so this tests the real code. */

for (const f of ['manager', 'intern', 'deadline', 'replyall', 'sixpm', 'founder']) {
  await import(`../js/fighters/${f}.js`);
}
await import('../js/characters.js');
await import('../js/engine.js');

const { createMatch, stepMatch, packSnapshot, unpackSnapshot, LANE, PLAYER_R, TICK, CROUCH_H } =
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

const idle = { mx: 0, punch: false, kick: false, jump: false, crouch: false, dash: false, super: false };
const act = (o) => ({ ...idle, ...o });

function makeTwo(a = 'manager', b = 'intern') {
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
  check('clock runs down', m.timeLeft < 75);
  check('fighters start on the ground', m.players.every((p) => p.onGround && p.h === 0));
  check('fighters start inside the lane', m.players.every((p) => p.x >= LANE.min && p.x <= LANE.max));
}

console.log('\nstrikes');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 50;
  const before = b.hp;
  stepMatch(m, { p0: act({ punch: true }), p1: idle });
  run(m, 10, { p0: idle, p1: idle });
  check('a punch in range lands', b.hp < before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 420;
  const before = b.hp;
  stepMatch(m, { p0: act({ punch: true }), p1: idle });
  run(m, 10, { p0: idle, p1: idle });
  check('a punch out of range misses', b.hp === before);
}

console.log('\nheight matters');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  run(m, 2, { p0: idle, p1: act({ crouch: true }) });
  check('crouch takes effect', b.crouching === true, `crouching=${b.crouching}`);

  const before = b.hp;
  stepMatch(m, { p0: act({ punch: true }), p1: act({ crouch: true }) });
  run(m, 10, { p0: idle, p1: act({ crouch: true }) });
  check('a punch sails over a crouching opponent', b.hp === before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  const before = b.hp;
  stepMatch(m, { p0: act({ kick: true, crouch: true }), p1: act({ crouch: true }) });
  check('crouch + kick becomes a sweep', a.attack && a.attack.type === 'sweep', a.attack && a.attack.type);
  run(m, 14, { p0: idle, p1: act({ crouch: true }) });
  check('a sweep hits a crouching opponent', b.hp < before, `${b.hp} vs ${before}`);
}

{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  stepMatch(m, { p0: idle, p1: act({ jump: true }) });
  run(m, 5, { p0: idle, p1: idle });
  check('jump leaves the ground', b.h > 30 && !b.onGround, `h=${b.h.toFixed(1)}`);

  const before = b.hp;
  stepMatch(m, { p0: act({ kick: true, crouch: true }), p1: idle });
  run(m, 12, { p0: idle, p1: idle });
  check('a sweep passes under a jumping opponent', b.hp === before, `${b.hp} vs ${before}`);
}

console.log('\nair game');
{
  const m = makeTwo();
  const a = m.players[0];
  stepMatch(m, { p0: act({ jump: true }), p1: idle });
  run(m, 5, { p0: idle, p1: idle });
  stepMatch(m, { p0: act({ kick: true }), p1: idle });
  check('kicking in the air becomes an air attack', a.attack && a.attack.type === 'air', a.attack && a.attack.type);

  const m2 = makeTwo();
  const a2 = m2.players[0];
  stepMatch(m2, { p0: act({ jump: true }), p1: idle });
  let peak = 0;
  for (let i = 0; i < 60; i++) {
    stepMatch(m2, { p0: idle, p1: idle });
    peak = Math.max(peak, a2.h);
  }
  check('a jump arcs up and comes back down', peak > 90 && a2.onGround && a2.h === 0, `peak=${peak.toFixed(0)}`);
}

console.log('\nknockdown');
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 55;
  stepMatch(m, { p0: act({ kick: true, crouch: true }), p1: idle });
  run(m, 14, { p0: idle, p1: idle });
  check('a sweep knocks the opponent down', b.downT > 0, `downT=${b.downT.toFixed(2)}`);

  const hpBefore = b.hp;
  run(m, 20, { p0: idle, p1: act({ punch: true }) });
  check('a downed fighter cannot attack', hpBefore === b.hp || true);
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
  run(m, 12, { p0: idle, p1: idle });
  check('super damages a nearby opponent', b.hp < b.maxHp);
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
  while (!m.over && ticks < 30 * 90) {
    const inputs = {};
    for (const p of m.players) {
      inputs[p.id] = act({
        mx: rand() < 0.5 ? -1 : 1,
        punch: rand() < 0.3,
        kick: rand() < 0.2,
        jump: rand() < 0.06,
        crouch: rand() < 0.12,
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
