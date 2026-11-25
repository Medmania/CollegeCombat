/* Fighter: The 6 PM Call
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
  id: 'sixpm',
  name: 'The 6 PM Call',
  tagline: 'Quick sync?',
  colors: { body: '#5b4b8a', accent: '#ff8fab', skin: '#e0b090', hair: '#241d33' },
  stats: { speed: 0.98, power: 1.05, weight: 1.05, hp: 104 },
  moves: {
    punch: { damage: 7, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 170, cd: 0.26 },
    kick:  { damage: 14, range: 100, arc: 0.9, dur: 0.44, hitAt: 0.19, knock: 400, cd: 0.58 },
    dash:  { speed: 690, dur: 0.15, cd: 2.1 },
    super: { damage: 26, range: 180, knock: 700 }
  },
  taunts: ['This will only take two minutes.', 'Can you see my screen?'],
  passive: { id: 'shover', text: 'Shover: knockback dealt is 35% stronger.' }
});
