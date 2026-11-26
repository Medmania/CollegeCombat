/* Fighter: Aditya
   ------------------------------------------------------------------
   One whole character lives in this file. To add someone new:
     1. copy this file to js/fighters/<their-id>.js
     2. change the values below (id must be unique, lowercase, no spaces)
     3. add one line to index.html beside the other fighters:
          <script src="js/fighters/<their-id>.js"></script>

   QUICK GUIDE
     stats.speed    1.0 normal | 1.15 quick | 0.9 slow
     stats.power    multiplies every hit you land
     stats.weight   higher = knocked back less
     stats.hp       100 normal | 130 tank | 80 fragile

     moves.punch    jab      damage / range / arc / dur / hitAt / knock / cd
     moves.kick     roundhouse
     moves.dash     speed / dur / cd

     moves.super    kind is one of:
                      blast   instant hit in a radius around you
                      shot    a projectile that flies and hits once
                      beam    sustained damage in a line in front
                      flurry  sustained multi-hit at close range
                      aura    sustained pulse around you (can slow/weaken/lock)
                    plus damage, range, and kind-specific extras
   ------------------------------------------------------------------ */

(globalThis.KK_FIGHTERS = globalThis.KK_FIGHTERS || []).push({
  id: 'aditya',
  name: 'Aditya',
  tagline: 'Hero of every story',
  colors: { body: '#2f7d63', accent: '#b8f2e6', skin: '#d9a97c', hair: '#20201f' },
  look: { hair: { style: 'slick' }, body: 'slim', prop: 'mic', extra: 'glasses' },
  stats: { speed: 1.02, power: 1.0, weight: 1.0, hp: 98 },
  moves: {
    punch: { damage: 7, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 150, cd: 0.26 },
    kick: { damage: 13, range: 97, arc: 0.9, dur: 0.42, hitAt: 0.18, knock: 300, cd: 0.55 },
    dash: { speed: 700, dur: 0.15, cd: 2.0 },
    super: { kind: 'flurry', botRange: 160, name: 'Continuous Commentary', damage: 4, interval: 0.12, dur: 1.4, range: 190, knock: 40, lock: 0.5, look: 'bubble' }
  },
  taunts: ['Let me explain the full context.', 'I was the one who fixed it.'],
  passive: { id: 'charged', text: 'charged' }
});
