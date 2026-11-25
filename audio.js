/* Tiny WebAudio blips — no asset files, nothing to download. */

export function createAudio() {
  let ctx = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 220, dur = 0.08, type = 'square', gain = 0.05, slide = 0 }) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur = 0.12, gain = 0.05) {
    const c = ensure();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    const g = c.createGain();
    g.gain.value = gain;
    src.buffer = buf;
    src.connect(g).connect(c.destination);
    src.start();
  }

  return {
    ensure,
    punch: () => tone({ freq: 320, dur: 0.05, type: 'square', gain: 0.03, slide: -120 }),
    kick: () => tone({ freq: 180, dur: 0.09, type: 'sawtooth', gain: 0.035, slide: -80 }),
    hit: (big = false) => {
      noise(big ? 0.16 : 0.09, big ? 0.07 : 0.04);
      tone({ freq: big ? 110 : 170, dur: 0.07, type: 'triangle', gain: 0.04, slide: -60 });
    },
    ko: () => {
      tone({ freq: 300, dur: 0.35, type: 'sawtooth', gain: 0.05, slide: -240 });
      noise(0.3, 0.05);
    },
    superMove: () => {
      tone({ freq: 90, dur: 0.4, type: 'sine', gain: 0.07, slide: 380 });
      noise(0.25, 0.04);
    },
    click: () => tone({ freq: 520, dur: 0.04, type: 'square', gain: 0.025 }),
    win: () => {
      tone({ freq: 440, dur: 0.12, type: 'square', gain: 0.04 });
      setTimeout(() => tone({ freq: 660, dur: 0.14, type: 'square', gain: 0.04 }), 120);
      setTimeout(() => tone({ freq: 880, dur: 0.22, type: 'square', gain: 0.04 }), 260);
    }
  };
}
