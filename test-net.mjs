/* Signalling-logic checks. These run without any real network: a fake
   RTCPeerConnection stands in for the browser so the code paths around it
   (code format, slot handling, message routing, error messages) are proven.
   Real device-to-device connectivity still has to be tested on two phones. */

const GOOD_SDP = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\ns=-\r\na=candidate:1 1 udp 2113 192.168.1.5 52000 typ host\r\n';

class FakeDC {
  constructor() {
    this.readyState = 'open';
    this.sent = [];
  }
  send(s) {
    this.sent.push(s);
  }
  close() {
    this.readyState = 'closed';
  }
}

function makePCClass({ withCandidates = true } = {}) {
  return class FakePC {
    constructor(cfg) {
      this.cfg = cfg;
      this.iceGatheringState = 'complete';
      this.connectionState = 'new';
      this.localDescription = null;
      this.remoteDescription = null;
    }
    createDataChannel() {
      this.dc = new FakeDC();
      return this.dc;
    }
    async createOffer() {
      return { type: 'offer', sdp: withCandidates ? GOOD_SDP : 'v=0\r\n' };
    }
    async createAnswer() {
      return { type: 'answer', sdp: withCandidates ? GOOD_SDP : 'v=0\r\n' };
    }
    async setLocalDescription(d) {
      this.localDescription = d;
    }
    async setRemoteDescription(d) {
      this.remoteDescription = d;
    }
    addEventListener() {}
    removeEventListener() {}
    close() {
      this.connectionState = 'closed';
    }
  };
}

globalThis.RTCPeerConnection = makePCClass();

const { encodeBlob, decodeBlob, HostSession, GuestSession } = await import('../js/net.js');

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}
async function throwsWith(fn, fragment) {
  try {
    await fn();
    return `no error (expected "${fragment}")`;
  } catch (e) {
    return e.message.includes(fragment) ? true : `wrong message: ${e.message}`;
  }
}

console.log('\nsignalling code format');
{
  const desc = { type: 'offer', sdp: GOOD_SDP };
  const blob = encodeBlob(desc);
  check('code starts with KK1:', blob.startsWith('KK1:'));
  check('code is copy-paste safe (no whitespace)', !/\s/.test(blob), blob.slice(0, 40));
  check('code round-trips', decodeBlob(blob).sdp === GOOD_SDP);

  const wrapped = `  ${blob.slice(0, 20)}\n${blob.slice(20)}  `;
  check('line breaks and spaces from chat are tolerated', decodeBlob(wrapped).sdp === GOOD_SDP);

  check('empty input gives a readable error', await throwsWith(() => decodeBlob(''), 'Paste the code'));
  check(
    'garbage gives a readable error',
    await throwsWith(() => decodeBlob('KK1:zzzz'), 'looks incomplete')
  );
}

console.log('\nhost session');
{
  const h = new HostSession();
  const code = await h.createInvite(0);
  check('invite is produced for a slot', code.startsWith('KK1:'));
  check('invite carries an ICE candidate', /a=candidate:/.test(decodeBlob(code).sdp));
  check('slot is registered', !!h.slots[0]);

  const answer = encodeBlob({ type: 'answer', sdp: GOOD_SDP });
  check('answer is accepted', (await throwsWith(() => h.acceptAnswer(0, answer), 'zzz')) !== true);
  check(
    'an invite pasted as an answer is rejected',
    await throwsWith(() => h.acceptAnswer(0, code), 'not an answer code')
  );
  check(
    'accepting on an empty slot explains itself',
    await throwsWith(() => h.acceptAnswer(2, answer), 'Generate an invite')
  );
}

console.log('\nmessage routing');
{
  const h = new HostSession();
  const got = { hello: null, message: null };
  h.on('hello', (i, m) => (got.hello = { i, m }));
  h.on('message', (i, m) => (got.message = { i, m }));
  await h.createInvite(0);

  h.handle(h.slots[0], JSON.stringify({ t: 'hello', name: 'Priya', charId: 'intern' }));
  check('hello is routed and remembered', got.hello && got.hello.m.name === 'Priya');
  check('name is stored on the slot', h.slots[0].name === 'Priya');
  check('char pick is stored on the slot', h.slots[0].charId === 'intern');

  h.handle(h.slots[0], JSON.stringify({ t: 'in', i: { mx: 1, my: 0 } }));
  check('input packets are routed', got.message && got.message.m.t === 'in');

  let crashed = false;
  try {
    h.handle(h.slots[0], 'this is not json');
  } catch (_) {
    crashed = true;
  }
  check('a malformed packet does not crash the host', !crashed);

  const name = h.handle(h.slots[0], JSON.stringify({ t: 'hello', name: 'x'.repeat(60) }));
  check('long names are clipped', h.slots[0].name.length <= 18);
}

console.log('\nbroadcast');
{
  const h = new HostSession();
  await h.createInvite(0);
  await h.createInvite(1);
  h.broadcast({ t: 'ping', n: 7 });
  const a = h.slots[0].dc.sent;
  const b = h.slots[1].dc.sent;
  check('both open guests receive', a.length === 1 && b.length === 1);
  check('payload survives', JSON.parse(a[0]).n === 7);

  h.slots[1].dc.readyState = 'closed';
  h.broadcast({ t: 'ping', n: 8 });
  check('closed guests are skipped', h.slots[1].dc.sent.length === 1);
}

console.log('\nguest session');
{
  const g = new GuestSession();
  const answer = await g.join(encodeBlob({ type: 'offer', sdp: GOOD_SDP }));
  check('guest returns an answer code', decodeBlob(answer).type === 'answer');

  const events = [];
  g.on('open', () => events.push('open'));
  g.on('message', (m) => events.push(m));
  const dc = new FakeDC();
  g.attach(dc);
  dc.onopen();
  dc.onmessage({ data: JSON.stringify({ t: 'snap', k: 1 }) });
  check('channel open is surfaced', events.includes('open'));
  check('snapshot is parsed', events.some((e) => e && e.t === 'snap'));

  g.send({ t: 'hello' });
  check('guest can send', dc.sent.length === 1);

  check(
    'an answer pasted as an invite is rejected',
    await throwsWith(() => g.join(encodeBlob({ type: 'answer', sdp: GOOD_SDP })), 'You need the invite code')
  );
}

console.log('\nblocked network');
{
  globalThis.RTCPeerConnection = makePCClass({ withCandidates: false });
  const h = new HostSession();
  check(
    'no ICE candidates fails loudly, not silently',
    await throwsWith(() => h.createInvite(0), 'blocking direct phone-to-phone')
  );
  globalThis.RTCPeerConnection = makePCClass();
}

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}\n`);
process.exit(failures === 0 ? 0 : 1);
