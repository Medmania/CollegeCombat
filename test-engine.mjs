/* Headless sanity checks for the rules engine. Run: npm test

   Loads the same two files the browser loads (js/characters.js and
   js/engine.js), so this tests the real code, not a copy of it. */

/* fighters first, exactly as index.html loads them, then the roster */
for (const f of ['manager', 'intern', 'deadline', 'replyall', 'sixpm', 'founder']) {
  await import(`../js/fighters/${f}.js`);
}
await import('../js/characters.js');
await import('../js/engine.js');

const {
  createMatch,
  stepMatch,
  packSnapshot,
  unpackSnapshot,
  ARENA,
  PLAYER_R,
  TICK
} = globalThis.KK_Engine;
const { CHARACTERS, getCharacter } = globalThis.KK_Roster;

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

/* deterministic pseudo-random inputs, so the test never depends on the AI */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rand = rng(7);
const dirs = {};
function scramble(m) {
  const inputs = {};
  for (const p of m.players) {
    if (dirs[p.id] === undefined || rand() < 0.04) dirs[p.id] = rand() * Math.PI * 2;
    const a = dirs[p.id];
    inputs[p.id] = {
      mx: Math.cos(a),
      my: Math.sin(a),
      punch: rand() < 0.3,
      kick: rand() < 0.1,
      dash: rand() < 0.02,
      super: rand() < 0.04
    };
  }
  return inputs;
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
  check('punch pushes the target away', Math.hypot(b.x - a.x, b.y - a.y) > 49);
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

/* 6. a full four-player round ends and nobody leaves the arena */
{
  const m = createMatch({
    fighters: CHARACTERS.slice(0, 4).map((c, i) => ({ id: `p${i}`, name: c.name, char: c, isBot: true }))
  });
  let ticks = 0;
  let leftArena = false;
  while (!m.over && ticks < 30 * 90) {
    stepMatch(m, scramble(m));
    ticks++;
    for (const p of m.players) {
      if (Math.hypot(p.x - ARENA.cx, p.y - ARENA.cy) > ARENA.r - PLAYER_R + 1.5) leftArena = true;
    }
  }
  check('4-player round finishes', m.over, `ticks=${ticks}`);
  check('round produced a winner or a draw', m.winner !== undefined);
  check('nobody escaped the arena', !leftArena);
  const totalHp = m.players.reduce((s, p) => s + p.hp, 0);
  const totalMax = m.players.reduce((s, p) => s + p.maxHp, 0);
  check('damage was actually dealt', totalHp < totalMax, `${Math.round(totalHp)} / ${totalMax}`);
  check('round lasted a sensible time', ticks > 30, `${(ticks * TICK).toFixed(1)}s`);
}

/* 7. snapshot round trip keeps positions */
{
  const m = makeTwo();
  const wire = JSON.parse(JSON.stringify(packSnapshot(m)));
  const m2 = makeTwo();
  unpackSnapshot(wire, m2);
  const same = m.players.every((p, i) => Math.abs(p.x - m2.players[i].x) < 1);
  check('snapshot survives the wire', same);
  check('snapshot is small enough for mobile', JSON.stringify(wire).length < 900, `${JSON.stringify(wire).length} bytes`);
}

/* 8. every character in the roster is well formed */
{
  const problems = [];
  const ids = new Set();
  for (const c of CHARACTERS) {
    if (ids.has(c.id)) problems.push(`${c.id} duplicate id`);
    ids.add(c.id);
    if (!c.moves || !c.moves.punch || !c.moves.kick || !c.moves.dash || !c.moves.super) {
      problems.push(`${c.id} missing a move`);
    }
    if (!c.colors || !c.colors.body || !c.colors.accent || !c.colors.skin) {
      problems.push(`${c.id} missing colours`);
    }
    if (!c.stats || !c.stats.hp || !c.stats.speed) problems.push(`${c.id} missing stats`);
  }
  check('roster entries are complete', problems.length === 0, problems.join('; '));
  check('roster has at least 2 fighters', CHARACTERS.length >= 2);
  check('every character can be looked up', CHARACTERS.every((c) => getCharacter(c.id).id === c.id));
}

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}\n`);
process.exit(failures === 0 ? 0 : 1);
