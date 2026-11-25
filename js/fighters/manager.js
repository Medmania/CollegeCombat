/* Fighter: The Manager
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
  id: 'manager',
  name: 'The Manager',
  tagline: 'Just circling back',
  colors: { body: '#3f6fa8', accent: '#ffd166', skin: '#e3b489', hair: '#2b2b2b' },
  stats: { speed: 1, power: 1, weight: 1, hp: 100 },
  moves: {
    punch: { damage: 7, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 150, cd: 0.26 },
    kick:  { damage: 13, range: 100, arc: 0.9, dur: 0.42, hitAt: 0.18, knock: 300, cd: 0.55 },
    dash:  { speed: 700, dur: 0.15, cd: 2 },
    super: { damage: 26, range: 180, knock: 600 }
  },
  taunts: ['Let us take this offline.', 'I have added it to the backlog.'],
  passive: { id: 'none', text: 'Perfectly balanced, as all managers claim to be.' }
});
