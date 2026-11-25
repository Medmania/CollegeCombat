/* =========================================================================
   ROSTER FILE — this is the only file you need to edit to add a character.
   =========================================================================

   HOW TO ADD A FIGHTER
   --------------------
   1. Copy any block below and paste it at the end of the array.
   2. Give it a unique `id` (lowercase, no spaces) and a `name`.
   3. Set the colours, the numbers, and one or two taunt lines.
   4. Pick a passive from PASSIVE_IDS (bottom of this file) or use 'none'.
   5. Save. Reload the page. It appears in the roster.

   Nothing else in the project needs to change.

   FIELD GUIDE
   -----------
   stats.speed    1.0 is normal. 1.15 is noticeably quick, 0.9 is a plodder.
   stats.power    1.0 is normal. Multiplies every hit you land.
   stats.weight   1.0 is normal. Higher = you get knocked back less.
   stats.hp       Health. 100 is normal, 130 is a tank, 80 is fragile.

   moves.punch    Fast, weak, short.      damage / range / arc / dur / hitAt / knock / cd
   moves.kick     Slow, strong, longer.
   moves.dash     A burst of speed.      speed / dur / cd
   moves.super    Radial blast at 100% meter.  damage / range / knock

   range  = distance in pixels from your centre (a body is ~52px wide)
   arc    = the cone you hit in, in radians (1.2 is about 70 degrees)
   dur    = how long the move takes, in seconds
   hitAt  = when inside that window the hit actually lands
   knock  = knockback strength
   cd     = cooldown in seconds before you can use it again
   ========================================================================= */

export const CHARACTERS = [
  {
    id: 'manager',
    name: 'The Manager',
    tagline: 'Just circling back',
    colors: { body: '#3f6fa8', accent: '#ffd166', skin: '#e3b489', hair: '#2b2b2b' },
    stats: { speed: 1.0, power: 1.0, weight: 1.0, hp: 100 },
    moves: {
      punch: { damage: 7, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 150, cd: 0.26 },
      kick: { damage: 13, range: 100, arc: 0.9, dur: 0.42, hitAt: 0.18, knock: 300, cd: 0.55 },
      dash: { speed: 700, dur: 0.15, cd: 2.0 },
      super: { damage: 26, range: 180, knock: 600 }
    },
    taunts: ['Let us take this offline.', 'I have added it to the backlog.'],
    passive: { id: 'none', text: 'Perfectly balanced, as all managers claim to be.' }
  },
  {
    id: 'intern',
    name: 'The Intern',
    tagline: 'Yes sir, on it sir',
    colors: { body: '#e07a5f', accent: '#f4f1de', skin: '#f0c9a0', hair: '#1f1f1f' },
    stats: { speed: 1.16, power: 0.85, weight: 0.8, hp: 82 },
    moves: {
      punch: { damage: 6, range: 66, arc: 1.35, dur: 0.18, hitAt: 0.06, knock: 120, cd: 0.2 },
      kick: { damage: 11, range: 94, arc: 0.95, dur: 0.36, hitAt: 0.15, knock: 240, cd: 0.46 },
      dash: { speed: 780, dur: 0.14, cd: 1.5 },
      super: { damage: 22, range: 165, knock: 520 }
    },
    taunts: ['I will get back to you by EOD.', 'Sir, one small clarification?'],
    passive: { id: 'slippery', text: 'Slippery: dashes recharge almost twice as fast.' }
  },
  {
    id: 'deadline',
    name: 'The Deadline',
    tagline: 'It was due yesterday',
    colors: { body: '#8e2f2f', accent: '#ffb703', skin: '#c98d63', hair: '#3a1010' },
    stats: { speed: 0.92, power: 1.2, weight: 1.15, hp: 112 },
    moves: {
      punch: { damage: 9, range: 72, arc: 1.2, dur: 0.26, hitAt: 0.1, knock: 180, cd: 0.3 },
      kick: { damage: 17, range: 104, arc: 0.88, dur: 0.5, hitAt: 0.22, knock: 360, cd: 0.66 },
      dash: { speed: 640, dur: 0.16, cd: 2.4 },
      super: { damage: 32, range: 185, knock: 680 }
    },
    taunts: ['This could have been an email.', 'Escalating this.'],
    passive: { id: 'heavy', text: 'Heavy Hitter: hits 18% harder, moves 8% slower.' }
  },
  {
    id: 'replyall',
    name: 'Reply All',
    tagline: 'Thanks for looping me in',
    colors: { body: '#2f7d63', accent: '#b8f2e6', skin: '#d9a97c', hair: '#20201f' },
    stats: { speed: 1.02, power: 0.95, weight: 1.0, hp: 98 },
    moves: {
      punch: { damage: 7, range: 70, arc: 1.3, dur: 0.2, hitAt: 0.07, knock: 140, cd: 0.24 },
      kick: { damage: 12, range: 96, arc: 0.92, dur: 0.4, hitAt: 0.17, knock: 270, cd: 0.52 },
      dash: { speed: 700, dur: 0.15, cd: 2.0 },
      super: { damage: 24, range: 190, knock: 560 }
    },
    taunts: ['Adding the whole team to this thread.', 'Please do the needful.'],
    passive: { id: 'charged', text: 'Charged: builds Super meter 50% faster.' }
  },
  {
    id: 'sixpm',
    name: 'The 6 PM Call',
    tagline: 'Quick sync?',
    colors: { body: '#5b4b8a', accent: '#ff8fab', skin: '#e0b090', hair: '#241d33' },
    stats: { speed: 0.98, power: 1.05, weight: 1.05, hp: 104 },
    moves: {
      punch: { damage: 7, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 170, cd: 0.26 },
      kick: { damage: 14, range: 100, arc: 0.9, dur: 0.44, hitAt: 0.19, knock: 400, cd: 0.58 },
      dash: { speed: 690, dur: 0.15, cd: 2.1 },
      super: { damage: 26, range: 180, knock: 700 }
    },
    taunts: ['This will only take two minutes.', 'Can you see my screen?'],
    passive: { id: 'shover', text: 'Shover: knockback dealt is 35% stronger.' }
  },
  {
    id: 'founder',
    name: 'The Founder',
    tagline: 'We are a family here',
    colors: { body: '#1f3b57', accent: '#00d4ff', skin: '#c98a5e', hair: '#12161b' },
    stats: { speed: 1.08, power: 1.0, weight: 1.0, hp: 100 },
    moves: {
      punch: { damage: 8, range: 68, arc: 1.3, dur: 0.2, hitAt: 0.07, knock: 150, cd: 0.24 },
      kick: { damage: 13, range: 98, arc: 0.92, dur: 0.4, hitAt: 0.17, knock: 290, cd: 0.52 },
      dash: { speed: 760, dur: 0.14, cd: 1.7 },
      super: { damage: 25, range: 175, knock: 580 }
    },
    taunts: ['We are disrupting the space.', 'Equity is coming, promise.'],
    passive: { id: 'tank', text: 'Tank: 30% more health.' }
  }
];

/* Passives you can use in `passive.id`. Any unknown id falls back to 'none'. */
export const PASSIVE_IDS = ['none', 'tank', 'quick', 'heavy', 'shover', 'charged', 'slippery'];

/* Headlines for the post-match newspaper screen. {winner} is replaced. */
export const HEADLINES = [
  '{winner} wins, denies everything',
  'Sources: {winner} was provoked',
  '{winner} victorious, asks for a raise',
  'Exit polls wrong again as {winner} takes it',
  '{winner} wins; HR has been informed',
  'Chai cups broken, {winner} blamed',
  '{winner} wins after "quick sync" turns violent',
  'Market reacts positively to {winner} victory',
  'Breaking: {winner} says it was always about the process',
  'Board declares {winner} "technically correct"'
];

/* Ticker lines shown during a match. Keep them generic or make them yours. */
export const TICKER = [
  'Sources say the pantry ran out of milk during round one.',
  'A stray chair was seen leaving the arena on its own.',
  'Management denies the arena is a metaphor.',
  'Meeting invites continue to arrive during the fight.',
  'Legal has asked us to stop calling it a performance review.',
  'Attendance was mandatory. Enthusiasm was not.'
];

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
