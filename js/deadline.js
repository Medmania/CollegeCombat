/* Fighter: The Deadline
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
  id: 'deadline',
  name: 'The Deadline',
  tagline: 'It was due yesterday',
  colors: { body: '#8e2f2f', accent: '#ffb703', skin: '#c98d63', hair: '#3a1010' },
  stats: { speed: 0.92, power: 1.2, weight: 1.15, hp: 112 },
  moves: {
    punch: { damage: 9, range: 72, arc: 1.2, dur: 0.26, hitAt: 0.1, knock: 180, cd: 0.3 },
    kick:  { damage: 17, range: 104, arc: 0.88, dur: 0.5, hitAt: 0.22, knock: 360, cd: 0.66 },
    dash:  { speed: 640, dur: 0.16, cd: 2.4 },
    super: { damage: 32, range: 185, knock: 680 }
  },
  taunts: ['This could have been an email.', 'Escalating this.'],
  passive: { id: 'heavy', text: 'Heavy Hitter: hits 18% harder, moves 8% slower.' }
});
