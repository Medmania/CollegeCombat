/* Screen flow, lobby, match lifecycle and the game loop. */

import { CHARACTERS, getCharacter, HEADLINES, TICKER } from './characters.js';
import { createMatch, stepMatch, packSnapshot, TICK, SUPER_COST } from './engine.js';
import { inputsForMatch, botInput } from './ai.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { HostSession, GuestSession, supportsWebRTC } from './net.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const EMPTY = { mx: 0, my: 0, punch: false, kick: false, dash: false, super: false };

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const audio = createAudio();
const input = createInput(document);
let renderer = null;

const S = {
  mode: 'solo',
  me: { name: 'You', charId: CHARACTERS[0].id },
  botCount: 2,
  match: null,
  localId: 'p0',
  running: false,
  ended: false,
  host: null,
  guest: null,
  lobby: [],
  remoteInputs: {},
  codes: {},
  answers: {},
  slotMsg: {},
  tickerAt: 0,
  tickerIndex: 0
};

let rafId = 0;
let lastTs = 0;
let acc = 0;

/* ------------------------------------------------------------------ screens */

function show(id) {
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${id}`));
}

function toast(text, ms = 2600) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), ms);
}

/* ------------------------------------------------------------------- roster */

function buildRoster(container, onPick, selectedId) {
  container.innerHTML = '';
  for (const c of CHARACTERS) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `card${c.id === selectedId ? ' selected' : ''}`;
    el.dataset.id = c.id;
    el.innerHTML = `
      <span class="swatch" style="background:${esc(c.colors.body)};border-color:${esc(c.colors.accent)}"></span>
      <span class="cname">${esc(c.name)}</span>
      <span class="ctag">${esc(c.tagline)}</span>
      <span class="cpass">${esc(c.passive.text)}</span>`;
    el.addEventListener('click', () => onPick(c.id));
    container.appendChild(el);
  }
}

function refreshRoster() {
  buildRoster(
    $('#roster'),
    (id) => {
      S.me.charId = id;
      refreshRoster();
      audio.click();
    },
    S.me.charId
  );
}

/* --------------------------------------------------------------- pick screen */

function openPick(mode) {
  S.mode = mode;
  $('#bot-row').hidden = mode !== 'solo';
  $('#pick-msg').textContent = '';
  $('#pick-title').textContent =
    mode === 'solo' ? 'Choose your fighter' : mode === 'host' ? 'Pick your fighter' : 'Pick your fighter';
  $('#pick-start').textContent =
    mode === 'solo' ? 'Fight' : mode === 'host' ? 'Create lobby' : 'Continue';
  $('#player-name').value = S.me.name;
  refreshRoster();
  show('pick');
}

/* ---------------------------------------------------------------- solo match */

function startSolo() {
  const char = getCharacter(S.me.charId);
  const fighters = [{ id: 'p0', name: S.me.name || 'You', char, isBot: false }];
  const pool = CHARACTERS.filter((c) => c.id !== char.id);
  for (let i = 0; i < S.botCount; i++) {
    const c = pool[i % pool.length];
    fighters.push({ id: `b${i}`, name: c.name, char: c, isBot: true });
  }
  S.match = createMatch({ fighters, seed: Date.now() & 0xffff });
  S.localId = 'p0';
  S.remoteInputs = {};
  beginMatch();
}

/* -------------------------------------------------------------------- lobby */

function renderLobby() {
  const box = $('#lobby-slots');
  if (!box) return;
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const entry = S.lobby.find((l) => l.slot === i);
    if (entry && entry.connected) {
      parts.push(`
        <div class="slot">
          <div class="slot-head"><span class="dot on"></span>${esc(entry.name)} — ${esc(
        getCharacter(entry.charId).name
      )}</div>
        </div>`);
      continue;
    }
    const code = S.codes[i] || '';
    parts.push(`
      <div class="slot">
        <div class="slot-head"><span class="dot"></span>Slot ${i + 1} — empty</div>
        <button class="btn small" data-gen="${i}">${code ? 'New invite code' : 'Generate invite code'}</button>
        <div class="code-area ${code ? 'show' : ''}" data-code="${i}">${esc(code)}</div>
        <textarea data-answer="${i}" rows="2" placeholder="Paste your friend's reply code here">${esc(
      S.answers[i] || ''
    )}</textarea>
        <button class="btn small" data-accept="${i}">Connect</button>
        <div class="slot-msg">${esc(S.slotMsg[i] || '')}</div>
      </div>`);
  }
  box.innerHTML = parts.join('');
  updateLobbyStart();
}

function updateLobbyStart() {
  const btn = $('#lobby-start');
  if (btn) btn.disabled = S.lobby.filter((l) => l.connected).length === 0;
}

function setSlotMsg(i, text) {
  S.slotMsg[i] = text;
  const el = document.querySelector(`[data-code="${i}"]`);
  const holder = el ? el.parentElement.querySelector('.slot-msg') : null;
  if (holder) holder.textContent = text;
}

function beginHost() {
  if (!supportsWebRTC()) {
    toast('This browser cannot do peer-to-peer play. Try Chrome, Safari or Edge.');
    return;
  }
  S.mode = 'host';
  S.lobby = [];
  S.remoteInputs = {};
  S.codes = {};
  S.answers = {};
  S.slotMsg = {};
  if (S.host) S.host.closeAll();

  S.host = new HostSession();

  S.host.on('hello', (index, msg) => {
    const id = `g${index}`;
    const existing = S.lobby.find((l) => l.slot === index);
    const entry = existing || { slot: index, id };
    entry.id = id;
    entry.name = msg.name || 'Guest';
    entry.charId = msg.charId || CHARACTERS[0].id;
    entry.connected = true;
    if (!existing) S.lobby.push(entry);
    S.host.send(index, { t: 'welcome', id });
    renderLobby();
    toast(`${entry.name} joined`);
  });

  S.host.on('message', (index, msg) => {
    if (msg && msg.t === 'in') S.remoteInputs[`g${index}`] = msg.i;
  });

  S.host.on('close', (index) => {
    S.lobby = S.lobby.filter((l) => l.slot !== index);
    delete S.remoteInputs[`g${index}`];
    renderLobby();
  });

  S.host.on('fail', (index) => {
    setSlotMsg(index, 'Connection failed. Both phones must be on the same Wi-Fi network.');
  });

  renderLobby();
  show('lobby');
}

async function generateInvite(i) {
  try {
    setSlotMsg(i, 'Creating invite…');
    const code = await S.host.createInvite(i);
    S.codes[i] = code;
    S.slotMsg[i] = 'Invite ready. Send this whole code to your friend.';
    renderLobby();
  } catch (err) {
    setSlotMsg(i, err.message || 'Could not create an invite.');
  }
}

async function acceptAnswer(i) {
  const blob = (S.answers[i] || '').trim();
  if (!blob) {
    setSlotMsg(i, 'Paste your friend\'s reply code first.');
    return;
  }
  try {
    await S.host.acceptAnswer(i, blob);
    setSlotMsg(i, 'Connecting… waiting for your friend.');
  } catch (err) {
    setSlotMsg(i, err.message || 'That code did not work.');
  }
}

function startHostMatch() {
  const fighters = [
    { id: 'p0', name: S.me.name || 'Host', char: getCharacter(S.me.charId), isBot: false }
  ];
  for (const entry of S.lobby.filter((l) => l.connected)) {
    fighters.push({
      id: entry.id,
      name: entry.name,
      char: getCharacter(entry.charId || CHARACTERS[0].id),
      isBot: false
    });
  }
  S.match = createMatch({ fighters, seed: Date.now() & 0xffff });
  S.localId = 'p0';
  S.host.broadcast({
    t: 'start',
    fighters: fighters.map((f) => ({ id: f.id, name: f.name, charId: f.char.id, isBot: f.isBot }))
  });
  beginMatch();
}

/* --------------------------------------------------------------------- guest */

function beginJoin() {
  S.mode = 'guest';
  $('#join-step1').hidden = false;
  $('#join-step2').hidden = true;
  $('#join-answer').value = '';
  $('#join-msg').textContent = '';
  show('join');
}

async function doJoin() {
  const blob = $('#join-offer').value.trim();
  const btn = $('#join-go');
  $('#join-msg').textContent = '';
  if (!blob) {
    $('#join-msg').textContent = 'Paste the host\'s invite code first.';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Working…';
  try {
    if (S.guest) S.guest.close();
    S.guest = new GuestSession();
    S.guest.on('open', () => {
      S.guest.send({ t: 'hello', name: S.me.name || 'Guest', charId: S.me.charId });
      $('#join-msg').textContent = 'Connected. Waiting for the host to start…';
    });
    S.guest.on('message', onGuestMessage);
    S.guest.on('close', () => {
      if (!S.ended && S.running) toast('Connection lost. Ask the host to re-invite you.');
    });
    S.guest.on('fail', () => {
      $('#join-msg').textContent =
        'Connection failed. Both phones must be on the same Wi-Fi network.';
    });
    const answer = await S.guest.join(blob);
    $('#join-answer').value = answer;
    $('#join-step2').hidden = false;
    $('#join-msg').textContent = 'Now send that reply code to the host.';
  } catch (err) {
    $('#join-msg').textContent = err.message || 'That code did not work.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate my reply code';
  }
}

function onGuestMessage(msg) {
  if (!msg) return;
  if (msg.t === 'welcome') {
    S.localId = msg.id;
    return;
  }
  if (msg.t === 'start') {
    const fighters = msg.fighters.map((f) => ({
      id: f.id,
      name: f.name,
      char: getCharacter(f.charId),
      isBot: false
    }));
    S.match = createMatch({ fighters, seed: Date.now() & 0xffff });
    if (!S.match.players.some((p) => p.id === S.localId)) S.localId = 'p0';
    beginMatch();
    return;
  }
  if (msg.t === 'snap') applySnapshot(msg);
}

function applySnapshot(snap) {
  const m = S.match;
  if (!m) return;
  for (const sp of snap.p) {
    const p = m.players.find((q) => q.id === sp.i);
    if (!p) continue;
    p._tx = sp.x;
    p._ty = sp.y;
    p._tf = sp.f;
    p.hp = sp.h;
    p.meter = sp.m;
    p.alive = !!sp.a;
    p.dashT = sp.d ? 0.1 : 0;
    p.attack = sp.at ? { type: sp.at, t: sp.ap * 0.4, dur: 0.4, hit: true } : null;
  }
  m.tick = snap.k;
  m.timeLeft = snap.tl;
  m.events = snap.e.map((e) => ({
    type: e.y,
    x: e.x,
    y: e.y2,
    id: e.id,
    on: e.on,
    kind: e.k,
    r: e.r
  }));
  handleEvents(m.events);
  if (snap.ov && !S.ended) {
    m.over = true;
    m.winner = snap.w || null;
    finishMatch();
  }
}

/* ---------------------------------------------------------------- match flow */

function beginMatch() {
  S.ended = false;
  S.running = true;
  S.tickerIndex = 0;
  S.tickerAt = 0;
  $('#hud-ticker').textContent = 'Fight!';
  $('#net-badge').hidden = S.mode === 'solo';
  input.reset();
  audio.ensure();
  show('game');
  requestAnimationFrame(() => {
    if (renderer) renderer.resize();
  });
  cancelAnimationFrame(rafId);
  lastTs = 0;
  acc = 0;
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  S.running = false;
  cancelAnimationFrame(rafId);
}

function loop(ts) {
  if (!S.running) return;
  if (!lastTs) lastTs = ts;
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.1) dt = 0.1;
  if (dt < 0) dt = 0;
  acc += dt;

  let guard = 0;
  while (acc >= TICK && guard < 6) {
    simulate();
    acc -= TICK;
    guard++;
  }
  if (guard >= 6) acc = 0;

  if (S.mode === 'guest') smoothGuest(dt);
  if (renderer) {
    renderer.step(dt);
    drawFrame();
  }
  updateHud();
  rafId = requestAnimationFrame(loop);
}

function simulate() {
  const m = S.match;
  if (!m) return;

  if (S.mode === 'guest') {
    if (S.guest) S.guest.send({ t: 'in', i: input.getInput() });
    return;
  }

  if (m.over) return;

  let inputs;
  if (S.mode === 'solo') {
    inputs = inputsForMatch(m, S.localId, input.getInput());
  } else {
    inputs = {};
    const localInput = input.getInput();
    for (const p of m.players) {
      if (p.id === S.localId) inputs[p.id] = localInput;
      else if (p.isBot) inputs[p.id] = botInput(p, m);
      else inputs[p.id] = S.remoteInputs[p.id] || EMPTY;
    }
  }

  stepMatch(m, inputs);
  handleEvents(m.events);

  if (S.mode === 'host' && m.tick % 2 === 0 && S.host) {
    S.host.broadcast(packSnapshot(m));
  }
  if (m.over) finishMatch();
}

function smoothGuest(dt) {
  const m = S.match;
  if (!m) return;
  const k = Math.min(1, dt * 14);
  for (const p of m.players) {
    if (p._tx == null) continue;
    p.x += (p._tx - p.x) * k;
    p.y += (p._ty - p.y) * k;
    let df = p._tf - p.face;
    while (df > Math.PI) df -= Math.PI * 2;
    while (df < -Math.PI) df += Math.PI * 2;
    p.face += df * k;
  }
}

function handleEvents(events) {
  const m = S.match;
  if (!m) return;
  for (const e of events) {
    if (e.type === 'hit') {
      audio.hit(e.kind === 'kick' || e.kind === 'super');
      if (S.mode === 'guest') {
        const t = m.players.find((p) => p.id === e.on);
        if (t) t.hitstun = 0.12;
      }
    } else if (e.type === 'swing') {
      if (e.kind === 'punch') audio.punch();
      else audio.kick();
    } else if (e.type === 'ko') {
      audio.ko();
    } else if (e.type === 'super' || e.type === 'superstart') {
      audio.superMove();
    }
  }
  if (renderer) renderer.feed(events, m.players);
}

function drawFrame() {
  const m = S.match;
  if (!m) return;
  renderer.draw({ players: m.players, localId: S.localId });
}

function updateHud() {
  const m = S.match;
  if (!m) return;
  const t = Math.max(0, Math.ceil(m.timeLeft));
  const el = $('#hud-time');
  if (el.textContent !== String(t)) el.textContent = String(t);

  const now = performance.now();
  if (now - S.tickerAt > 7000) {
    S.tickerAt = now;
    S.tickerIndex = (S.tickerIndex + 1) % TICKER.length;
    $('#hud-ticker').textContent = TICKER[S.tickerIndex];
  }

  const local = m.players.find((p) => p.id === S.localId);
  $('#btn-super').classList.toggle('ready', !!local && local.meter >= SUPER_COST);
}

function finishMatch() {
  if (S.ended) return;
  S.ended = true;
  const m = S.match;
  audio.win();

  const winner = m.players.find((p) => p.id === m.winner);
  if (winner) {
    const head = HEADLINES[Math.floor(Math.random() * HEADLINES.length)];
    $('#result-headline').textContent = head.replace('{winner}', winner.name);
  } else {
    $('#result-headline').textContent = 'Draw. Everyone blames the process.';
  }

  const order = m.players.slice().sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    return b.hp - a.hp;
  });
  $('#result-body').textContent = order
    .map((p) => `${p.name} — ${p.alive ? `${Math.round(p.hp)} HP left` : 'knocked out'}`)
    .join('  ·  ');

  setTimeout(() => {
    stopLoop();
    show('result');
  }, 1400);
}

/* ------------------------------------------------------------------ plumbing */

function quitToMenu() {
  stopLoop();
  S.ended = true;
  if (S.host) {
    S.host.closeAll();
    S.host = null;
  }
  if (S.guest) {
    S.guest.close();
    S.guest = null;
  }
  S.match = null;
  S.lobby = [];
  S.remoteInputs = {};
  input.reset();
  show('menu');
}

function wire() {
  $$('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.ensure();
      audio.click();
      openPick(btn.dataset.action);
    });
  });

  $$('[data-nav="menu"]').forEach((btn) => btn.addEventListener('click', quitToMenu));

  $('#player-name').addEventListener('input', (e) => {
    S.me.name = e.target.value.trim().slice(0, 14);
    try {
      localStorage.setItem('kk.name', S.me.name);
    } catch (_) {
      /* private mode, ignore */
    }
  });

  $('#bot-count').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-bots]');
    if (!chip) return;
    S.botCount = Number(chip.dataset.bots);
    $$('#bot-count .chip').forEach((c) => c.classList.toggle('active', c === chip));
    audio.click();
  });

  $('#pick-start').addEventListener('click', () => {
    audio.ensure();
    S.me.name = ($('#player-name').value || 'You').trim().slice(0, 14) || 'You';
    try {
      localStorage.setItem('kk.name', S.me.name);
    } catch (_) {
      /* ignore */
    }
    if (S.mode === 'solo') startSolo();
    else if (S.mode === 'host') beginHost();
    else beginJoin();
  });

  $('#lobby-slots').addEventListener('input', (e) => {
    const area = e.target.closest('[data-answer]');
    if (!area) return;
    S.answers[area.dataset.answer] = area.value;
  });

  $('#lobby-slots').addEventListener('click', (e) => {
    const gen = e.target.closest('[data-gen]');
    if (gen) {
      generateInvite(Number(gen.dataset.gen));
      return;
    }
    const acc2 = e.target.closest('[data-accept]');
    if (acc2) acceptAnswer(Number(acc2.dataset.accept));
  });

  $('#lobby-start').addEventListener('click', () => {
    audio.ensure();
    startHostMatch();
  });

  $('#join-go').addEventListener('click', doJoin);

  $('#join-copy').addEventListener('click', async () => {
    const val = $('#join-answer').value;
    try {
      await navigator.clipboard.writeText(val);
      toast('Reply code copied');
    } catch (_) {
      const el = $('#join-answer');
      el.removeAttribute('readonly');
      el.select();
      document.execCommand('copy');
      el.setAttribute('readonly', 'readonly');
      toast('Reply code copied');
    }
  });

  $('#btn-quit').addEventListener('click', () => {
    quitToMenu();
    toast('Match abandoned');
  });

  $('#result-again').addEventListener('click', () => {
    audio.ensure();
    if (S.mode === 'solo') {
      startSolo();
    } else if (S.mode === 'host') {
      if (S.lobby.filter((l) => l.connected).length === 0) {
        toast('Nobody is connected. Invite someone first.');
        quitToMenu();
        return;
      }
      startHostMatch();
    } else {
      toast('Waiting for the host to start the rematch');
      show('join');
    }
  });

  $('#result-menu').addEventListener('click', quitToMenu);

  const onResize = () => {
    if (renderer) renderer.resize();
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 250));
}

function boot() {
  const stamp = $('#build-stamp');
  if (stamp) {
    const d = new Date();
    stamp.textContent = `built ${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  }

  try {
    const saved = localStorage.getItem('kk.name');
    if (saved) S.me.name = saved;
  } catch (_) {
    /* ignore */
  }

  const strip = $('#roster-strip');
  if (strip) {
    strip.innerHTML = CHARACTERS.map(
      (c) =>
        `<span class="sw" title="${esc(c.name)}" style="background:${esc(c.colors.body)};border-color:${esc(
          c.colors.accent
        )}"></span>`
    ).join('');
  }

  renderer = createRenderer($('#game-canvas'));
  renderer.resize();
  wire();
  refreshRoster();
  show('menu');
}

/* Debug helper: window.__kursi() returns the live match state. Useful while
   you are tuning numbers in characters.js. It does nothing on its own. */
window.__kursi = () =>
  S.match
    ? {
        mode: S.mode,
        tick: S.match.tick,
        over: S.match.over,
        winner: S.match.winner,
        players: S.match.players.map((p) => ({
          id: p.id,
          name: p.name,
          x: Math.round(p.x),
          y: Math.round(p.y),
          hp: Math.round(p.hp),
          meter: Math.round(p.meter),
          alive: p.alive
        }))
      }
    : null;

boot();
