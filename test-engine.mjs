/* Headless sanity checks for the simulation. Run: npm test
   This is not a full test suite — it proves the rules engine actually
   connects, damages, knocks out and ends a round. */

import { createMatch, stepMatch, packSnapshot, unpackSnapshot, ARENA, PLAYER_R } from '../js/engine.js';
import { CHARACTERS, getCharacter } from '../js/characters.js';
import { botInput } from '../js/ai.js';

let failures = 0;

function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const noInput = { mx: 0, my: 0, punch: false, kick: false, dash: false, super: false };

function makeTwo(a = 'manager', b = 'intern') {
  return createMatch({
    fighters: [
      { id: 'p0', name: 'A', char: getCharacter(a), isBot: false },
      { id: 'p1', name: 'B', char: getCharacter(b), isBot: false }
    ]
  });
}

console.log('\nengine');

/* 1. an idle round changes nothing about health */
{
  const m = makeTwo();
  for (let i = 0; i < 60; i++) stepMatch(m, { p0: noInput, p1: noInput });
  check('idle players take no damage', m.players.every((p) => p.hp === p.maxHp));
  check('clock runs down', m.timeLeft < 75);
}

/* 2. a punch that connects removes health */
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 50;
  b.y = a.y;
  a.face = 0;
  const hpBefore = b.hp;
  stepMatch(m, { p0: { ...noInput, punch: true }, p1: noInput });
  for (let i = 0; i < 12; i++) stepMatch(m, { p0: noInput, p1: noInput });
  check('punch in range deals damage', b.hp < hpBefore, `hp ${b.hp} vs ${hpBefore}`);
  check('punch pushes the target away', Math.hypot(b.x - a.x, b.y - a.y) > 50 - 1);
}

/* 3. a punch facing the wrong way misses */
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + 50;
  b.y = a.y;
  a.face = Math.PI;
  const hpBefore = b.hp;
  stepMatch(m, { p0: { ...noInput, punch: true }, p1: noInput });
  for (let i = 0; i < 12; i++) stepMatch(m, { p0: noInput, p1: noInput });
  check('punch facing away misses', b.hp === hpBefore);
}

/* 4. a punch out of range misses */
{
  const m = makeTwo();
  const [a, b] = m.players;
  b.x = a.x + PLAYER_R * 4;
  b.y = a.y;
  a.face = 0;
  const hpBefore = b.hp;
  stepMatch(m, { p0: { ...noInput, punch: true }, p1: noInput });
  for (let i = 0; i < 12; i++) stepMatch(m, { p0: noInput, p1: noInput });
  check('punch out of range misses', b.hp === hpBefore);
}

/* 5. super only fires at full meter */
{
  const m = makeTwo();
  const a = m.players[0];
  a.meter = 40;
  const before = a.meter;
  stepMatch(m, { p0: { ...noInput, super: true }, p1: noInput });
  check('super blocked below 100 meter', a.meter === before && !a.attack);

  a.meter = 100;
  m.players[1].x = a.x + 60;
  m.players[1].y = a.y;
  stepMatch(m, { p0: { ...noInput, super: true }, p1: noInput });
  check('super consumes the meter', a.meter === 0);
  for (let i = 0; i < 10; i++) stepMatch(m, { p0: noInput, p1: noInput });
  check('super damages nearby opponents', m.players[1].hp < m.players[1].maxHp);
}

/* 6. a full round ends with a winner and nobody stuck out of the arena */
{
  const m = createMatch({
    fighters: CHARACTERS.slice(0, 4).map((c, i) => ({
      id: `p${i}`,
      name: c.name,
      char: c,
      isBot: true
    }))
  });
  let ticks = 0;
  while (!m.over && ticks < 30 * 90) {
    const inputs = {};
    for (const p of m.players) inputs[p.id] = botInput(p, m);
    stepMatch(m, inputs);
    ticks++;
  }
  check('4-player bot round finishes', m.over, `ticks=${ticks}`);
  check('round produced a winner or a draw', m.winner !== undefined);
  const inBounds = m.players.every(
    (p) => Math.hypot(p.x - ARENA.cx, p.y - ARENA.cy) <= ARENA.r - PLAYER_R + 1.5
  );
  check('everyone stayed inside the arena', inBounds);
  const totalHp = m.players.reduce((s, p) => s + p.hp, 0);
  check('damage was actually dealt', totalHp < m.players.reduce((s, p) => s + p.maxHp, 0));
}

/* 7. snapshot round trip keeps positions */
{
  const m = makeTwo();
  const snap = packSnapshot(m);
  const wire = JSON.parse(JSON.stringify(snap));
  const m2 = makeTwo();
  unpackSnapshot(wire, m2);
  const same = m.players.every((p, i) => Math.abs(p.x - m2.players[i].x) < 1);
  check('snapshot survives the wire', same);
  check('snapshot is small enough for mobile', JSON.stringify(wire).length < 900, `${JSON.stringify(wire).length} bytes`);
}

/* 8. every character in the roster is well formed */
{
  let ok = true;
  const problems = [];
  const ids = new Set();
  for (const c of CHARACTERS) {
    if (ids.has(c.id)) problems.push(`${c.id} duplicate id`);
    ids.add(c.id);
    if (!c.moves || !c.moves.punch || !c.moves.kick || !c.moves.dash || !c.moves.super) {
      problems.push(`${c.id} missing a move`);
      ok = false;
    }
    if (!c.colors || !c.colors.body || !c.colors.accent || !c.colors.skin) {
      problems.push(`${c.id} missing colours`);
      ok = false;
    }
    if (!c.stats || !c.stats.hp || !c.stats.speed) {
      problems.push(`${c.id} missing stats`);
      ok = false;
    }
  }
  check('roster entries are complete', ok, problems.join('; '));
  check('roster has at least 2 fighters', CHARACTERS.length >= 2);
}

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}\n`);
process.exit(failures === 0 ? 0 : 1);
