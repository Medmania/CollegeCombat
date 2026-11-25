/* Bot opponent. Runs only on the host / in solo mode, so a bit of randomness
   here never desyncs anything. */

export function botInput(p, m) {
  const out = { mx: 0, my: 0, punch: false, kick: false, dash: false, super: false };
  if (!p.alive || m.over) return out;

  const mem = p.ai || (p.ai = { timer: 0, targetId: null });
  mem.timer -= 1 / 30;

  if (mem.timer <= 0) {
    mem.timer = 0.22 + Math.random() * 0.22;
    let best = null;
    let bd = Infinity;
    for (const q of m.players) {
      if (q === p || !q.alive) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    mem.targetId = best ? best.id : null;
  }

  const target = m.players.find((q) => q.id === mem.targetId);
  if (!target || !target.alive) return out;

  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const d = Math.hypot(dx, dy) || 1;

  out.mx = dx / d;
  out.my = dy / d;

  const punchReach = p.moves.punch.range + 18;
  const kickReach = p.moves.kick.range + 18;

  if (d < punchReach) {
    /* close in but stop crowding, then throw something */
    out.mx *= 0.35;
    out.my *= 0.35;
    if (p.meter >= 100 && Math.random() < 0.9) out.super = true;
    else if (d < punchReach && Math.random() < 0.5) out.punch = true;
    else if (d < kickReach && Math.random() < 0.4) out.kick = true;
  } else if (d < kickReach) {
    if (Math.random() < 0.45) out.kick = true;
    else if (Math.random() < 0.2) out.dash = true;
  } else if (d > 230 && p.cd.dash <= 0 && Math.random() < 0.06) {
    out.dash = true;
  }

  /* back off when badly hurt, so bots are not just punching bags */
  if (p.hp < p.maxHp * 0.22 && d < 130 && Math.random() < 0.35) {
    out.mx = -dx / d;
    out.my = -dy / d;
    out.punch = false;
    out.kick = false;
  }

  return out;
}

export function inputsForMatch(m, humanId, humanInput) {
  const inputs = {};
  for (const p of m.players) {
    if (p.id === humanId) inputs[p.id] = humanInput;
    else if (p.isBot) inputs[p.id] = botInput(p, m);
    else inputs[p.id] = { mx: 0, my: 0, punch: false, kick: false, dash: false, super: false };
  }
  return inputs;
}
