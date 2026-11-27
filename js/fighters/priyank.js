/* Fighter: Priyank
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
  id: 'priyank',
  name: 'Priyank',
  tagline: 'One more set, bro',
  colors: { body: '#e9e6de', pants: '#2f3a4a', accent: '#7fb3d5', skin: '#a9764f', hair: '#15120f', shoe: '#2a2e36' },
  look: { hair: { style: 'crop', color: '#15120f' }, body: 'average', prop: 'dumbbell', extra: 'beard' },
  stats: { speed: 0.92, power: 1.15, weight: 1.15, hp: 110 },
  moves: {
    punch: { damage: 8, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 150, cd: 0.26 },
    kick: { damage: 15, range: 94, arc: 0.9, dur: 0.42, hitAt: 0.18, knock: 300, cd: 0.55 },
    dash: { speed: 700, dur: 0.15, cd: 2.0 },
    super: { kind: 'shot', botRange: 340, name: 'Gym Ka Hisaab', damage: 24, speed: 560, r: 26, bounces: 1, knock: 520, look: 'dumbbell' }
  },
  taunts: ['Ek aur set!', 'Legs day is every day.'],
  passive: { id: 'heavy', text: 'heavy' }
});
