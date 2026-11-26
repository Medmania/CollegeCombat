/* Fighter: 33
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
  id: 'thirtythree',
  name: '33',
  tagline: 'Giant, on a scooty',
  colors: { body: '#4a3b2a', accent: '#ffd166', skin: '#c98d63', hair: '#241d33' },
  look: { hair: { style: 'cap' }, body: 'slim', prop: 'scooty' },
  stats: { speed: 0.93, power: 1.15, weight: 1.3, hp: 115 },
  moves: {
    punch: { damage: 8, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 150, cd: 0.26 },
    kick: { damage: 15, range: 94, arc: 0.9, dur: 0.42, hitAt: 0.18, knock: 300, cd: 0.55 },
    dash: { speed: 700, dur: 0.15, cd: 2.0 },
    super: { kind: 'shot', botRange: 340, name: 'Scooty Express', damage: 30, speed: 700, r: 30, knock: 600, look: 'scooty' }
  },
  taunts: ['Scooty pe aa.', 'One Bihari is enough.'],
  passive: { id: 'heavy', text: 'heavy' }
});
