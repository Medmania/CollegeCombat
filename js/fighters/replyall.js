/* Fighter: Reply All
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
  id: 'replyall',
  name: 'Reply All',
  tagline: 'Thanks for looping me in',
  colors: { body: '#2f7d63', accent: '#b8f2e6', skin: '#d9a97c', hair: '#20201f' },
  stats: { speed: 1.02, power: 0.95, weight: 1, hp: 98 },
  moves: {
    punch: { damage: 7, range: 70, arc: 1.3, dur: 0.2, hitAt: 0.07, knock: 140, cd: 0.24 },
    kick:  { damage: 12, range: 96, arc: 0.92, dur: 0.4, hitAt: 0.17, knock: 270, cd: 0.52 },
    dash:  { speed: 700, dur: 0.15, cd: 2 },
    super: { damage: 24, range: 190, knock: 560 }
  },
  taunts: ['Adding the whole team to this thread.', 'Please do the needful.'],
  passive: { id: 'charged', text: 'Charged: builds Super meter 50% faster.' }
});
