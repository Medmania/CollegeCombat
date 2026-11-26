/* Fighter: Mukesh
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
  id: 'mukesh',
  name: 'Mukesh',
  tagline: 'Ambani of the team',
  colors: { body: '#5c3d1f', accent: '#ffd166', skin: '#c98d63', hair: '#241d33' },
  look: { hair: { style: 'slick', color: '#2a2a2a' }, body: 'broad', prop: 'buffalo' },
  stats: { speed: 0.9, power: 1.08, weight: 1.25, hp: 122 },
  moves: {
    punch: { damage: 8, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 150, cd: 0.26 },
    kick: { damage: 14, range: 93, arc: 0.9, dur: 0.42, hitAt: 0.18, knock: 300, cd: 0.55 },
    dash: { speed: 700, dur: 0.15, cd: 2.0 },
    super: { kind: 'shot', botRange: 340, name: 'Ambani Army', damage: 9, speed: 480, r: 24, count: 5, knock: 260, look: 'herd' }
  },
  taunts: ['Mere paas buffalo hai.', 'Reliance on me, always.'],
  passive: { id: 'tank', text: 'tank' }
});
