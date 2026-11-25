/* Fighter: The Intern
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
  id: 'intern',
  name: 'The Intern',
  tagline: 'Yes sir, on it sir',
  colors: { body: '#e07a5f', accent: '#f4f1de', skin: '#f0c9a0', hair: '#1f1f1f' },
  stats: { speed: 1.16, power: 0.85, weight: 0.8, hp: 82 },
  moves: {
    punch: { damage: 6, range: 66, arc: 1.35, dur: 0.18, hitAt: 0.06, knock: 120, cd: 0.2 },
    kick:  { damage: 11, range: 94, arc: 0.95, dur: 0.36, hitAt: 0.15, knock: 240, cd: 0.46 },
    dash:  { speed: 780, dur: 0.14, cd: 1.5 },
    super: { damage: 22, range: 165, knock: 520 }
  },
  taunts: ['I will get back to you by EOD.', 'Sir, one small clarification?'],
  passive: { id: 'slippery', text: 'Slippery: dashes recharge almost twice as fast.' }
});
