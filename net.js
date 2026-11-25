/* Zero-server networking.

   WebRTC needs one thing from outside the two phones: a way to swap connection
   descriptions (SDP). There is no server here. Instead the two players swap
   those descriptions themselves as short text codes — host pastes theirs into
   Slack, the guest pastes back the answer.

   Once that handshake is done, every gameplay packet travels directly between
   the phones. Nothing is stored anywhere, and there is no account, no key and
   no database.

   ICE SERVERS
   -----------
   Deliberately empty: no third-party service is contacted at all.
   Consequence: this only connects when both players are on the same Wi-Fi
   network (or the same hotspot). That is the trade for "strictly zero
   third-party".

   If you later want players on different networks, add one line here:
       export const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
   A STUN server only reports a device's public address; no game data passes
   through it. Even then, roughly one connection in five needs a TURN relay.
*/

export const ICE_SERVERS = [];

const PREFIX = 'KK1:';

export function encodeBlob(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return PREFIX + btoa(bin);
}

export function decodeBlob(text) {
  if (!text) throw new Error('Paste the code first.');
  const clean = String(text).trim().replace(/\s+/g, '');
  const body = clean.startsWith(PREFIX) ? clean.slice(PREFIX.length) : clean;
  let bin;
  try {
    bin = atob(body);
  } catch (_) {
    throw new Error('That code looks incomplete. Copy the whole thing, including the KK1: start.');
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (_) {
    throw new Error('That code could not be read. Ask for a fresh one.');
  }
}

/* A description with no ICE candidate can never connect. Catching it here
   turns a ten-minute silent hang into an instant, readable message. */
function hasCandidates(desc) {
  return !!desc && /^a=candidate:/m.test(desc.sdp || '');
}

const NO_CANDIDATES_MSG =
  'This network is blocking direct phone-to-phone connections. Both phones must be on the same Wi-Fi, and any VPN must be switched off. If it keeps failing, try a phone hotspot instead.';

function waitForIce(pc, timeoutMs = 4000) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    };
    const check = () => {
      if (pc.iceGatheringState === 'complete') finish();
    };
    pc.addEventListener('icegatheringstatechange', check);
    setTimeout(finish, timeoutMs);
  });
}

function emitter(target) {
  target.handlers = {};
  target.on = (evt, fn) => {
    (target.handlers[evt] = target.handlers[evt] || []).push(fn);
    return target;
  };
  target.emit = (evt, ...args) => {
    (target.handlers[evt] || []).forEach((fn) => fn(...args));
  };
  return target;
}

export class HostSession {
  constructor() {
    this.slots = [];
    emitter(this);
  }

  /* Creates one invite for slot `index` (0..3). Returns the code to send. */
  async createInvite(index) {
    if (this.slots[index]) {
      try {
        this.slots[index].dc.close();
        this.slots[index].pc.close();
      } catch (_) {
        /* ignore */
      }
    }
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const dc = pc.createDataChannel('game', { ordered: true });
    const slot = { index, pc, dc, open: false, name: '', charId: null };

    dc.onopen = () => {
      slot.open = true;
      this.emit('open', index);
    };
    dc.onmessage = (e) => this.handle(slot, e.data);
    dc.onclose = () => {
      slot.open = false;
      this.emit('close', index);
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'failed') this.emit('fail', index, s);
      if (s === 'disconnected' || s === 'closed') this.emit('close', index);
    };

    this.slots[index] = slot;
    await pc.setLocalDescription(await pc.createOffer());
    await waitForIce(pc);
    if (!hasCandidates(pc.localDescription)) {
      try {
        pc.close();
      } catch (_) {
        /* ignore */
      }
      delete this.slots[index];
      throw new Error(NO_CANDIDATES_MSG);
    }
    return encodeBlob(pc.localDescription);
  }

  /* Paste the guest's answer code here. */
  async acceptAnswer(index, blob) {
    const slot = this.slots[index];
    if (!slot) throw new Error('Generate an invite for this slot first.');
    const desc = decodeBlob(blob);
    if (!desc || desc.type !== 'answer') {
      throw new Error('That is an invite code, not an answer code. You need the one your friend sends back.');
    }
    await slot.pc.setRemoteDescription(desc);
  }

  send(index, msg) {
    const slot = this.slots[index];
    if (slot && slot.dc.readyState === 'open') slot.dc.send(JSON.stringify(msg));
  }

  broadcast(msg) {
    const raw = JSON.stringify(msg);
    for (const slot of this.slots) {
      if (slot && slot.dc.readyState === 'open') slot.dc.send(raw);
    }
  }

  handle(slot, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (_) {
      return;
    }
    if (msg && msg.t === 'hello') {
      slot.name = String(msg.name || 'Guest').slice(0, 18);
      slot.charId = msg.charId;
      this.emit('hello', slot.index, msg);
      return;
    }
    this.emit('message', slot.index, msg);
  }

  closeAll() {
    for (const slot of this.slots) {
      if (!slot) continue;
      try {
        slot.dc.close();
        slot.pc.close();
      } catch (_) {
        /* ignore */
      }
    }
    this.slots = [];
  }
}

export class GuestSession {
  constructor() {
    this.pc = null;
    this.dc = null;
    emitter(this);
  }

  /* Paste the host's invite code. Returns your answer code to send back. */
  async join(offerBlob) {
    const desc = decodeBlob(offerBlob);
    if (!desc || desc.type !== 'offer') {
      throw new Error('That is an answer code. You need the invite code the host generated.');
    }
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;

    pc.ondatachannel = (e) => this.attach(e.channel);
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'failed') this.emit('fail', s);
      if (s === 'disconnected' || s === 'closed') this.emit('close', s);
    };

    await pc.setRemoteDescription(desc);
    await pc.setLocalDescription(await pc.createAnswer());
    await waitForIce(pc);
    if (!hasCandidates(pc.localDescription)) {
      throw new Error(NO_CANDIDATES_MSG);
    }
    return encodeBlob(pc.localDescription);
  }

  attach(dc) {
    this.dc = dc;
    dc.onopen = () => this.emit('open');
    dc.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch (_) {
        return;
      }
      this.emit('message', msg);
    };
    dc.onclose = () => this.emit('close', 'closed');
  }

  send(msg) {
    if (this.dc && this.dc.readyState === 'open') this.dc.send(JSON.stringify(msg));
  }

  close() {
    try {
      if (this.dc) this.dc.close();
      if (this.pc) this.pc.close();
    } catch (_) {
      /* ignore */
    }
  }
}

export function supportsWebRTC() {
  return typeof RTCPeerConnection !== 'undefined';
}
