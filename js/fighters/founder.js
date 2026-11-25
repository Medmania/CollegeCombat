/* Fighter: The Founder
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
     range          pixels from your centre (a body is ~52 wide)
     arc            the cone you hit in, radians (1.2 is about 70 degrees)
     dur / hitAt    how long the move takes, and when inside it the hit lands
     knock          knockback strength
     cd             cooldown in seconds
   ------------------------------------------------------------------ */

(globalThis.KK_FIGHTERS = globalThis.KK_FIGHTERS || []).push({
  id: 'founder',
  name: 'The Founder',
  tagline: 'We are a family here',
  colors: { body: '#1f3b57', accent: '#00d4ff', skin: '#c98a5e', hair: '#12161b' },
  stats: { speed: 1.08, power: 1, weight: 1, hp: 100 },
  moves: {
    punch: { damage: 8, range: 68, arc: 1.3, dur: 0.2, hitAt: 0.07, knock: 150, cd: 0.24 },
    kick:  { damage: 13, range: 98, arc: 0.92, dur: 0.4, hitAt: 0.17, knock: 290, cd: 0.52 },
    dash:  { speed: 760, dur: 0.14, cd: 1.7 },
    super: { damage: 25, range: 175, knock: 580 }
  },
  taunts: ['We are disrupting the space.', 'Equity is coming, promise.'],
  passive: { id: 'tank', text: 'Tank: 30% more health.' }
});
