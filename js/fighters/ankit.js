/* Fighter: Ankit
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
  id: 'ankit',
  name: 'Ankit',
  tagline: 'Pinchu Panda, at your service',
  colors: { body: '#6d4a93', pants: '#2f2a3a', accent: '#d9c27a', skin: '#d9a877', hair: '#1b1719', shoe: '#2a2733' },
  look: { hair: { style: 'short', color: '#1b1719' }, body: 'average', prop: 'panda', extra: 'glasses' },
  stats: { speed: 0.88, power: 1.2, weight: 1.3, hp: 130 },
  moves: {
    punch: { damage: 8, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 150, cd: 0.26 },
    kick: { damage: 16, range: 92, arc: 0.9, dur: 0.42, hitAt: 0.18, knock: 300, cd: 0.55 },
    dash: { speed: 700, dur: 0.15, cd: 2.0 },
    super: { kind: 'blast', botRange: 200, name: 'Pinchu Stomp', damage: 36, range: 200, knock: 780, knockdown: true, look: 'panda' }
  },
  taunts: ['Panda does not negotiate.', 'Sorry, sorry, sorry.'],
  passive: { id: 'tank', text: 'tank' }
});
