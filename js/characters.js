/* The roster.

   Every fighter is its own file in js/fighters/. This file only collects them
   and holds the shared text: the post-match headlines and the lines that
   scroll during a fight.

   TO ADD A CHARACTER
     1. copy js/fighters/intern.js to js/fighters/<their-id>.js
     2. edit the values in it
     3. add one line to index.html beside the other fighters:
          <script src="js/fighters/<their-id>.js"></script>
   That is the whole process. Order in index.html is roster order.

   TO REORDER THE ROSTER
     Move the <script> lines around in index.html. */

(function () {
  'use strict';

  const CHARACTERS = globalThis.KK_FIGHTERS || [];

  /* Passives you can name in a fighter's passive.id.
     Unknown ids fall back to 'none'. */
  const PASSIVE_IDS = ['none', 'tank', 'quick', 'heavy', 'shover', 'charged', 'slippery'];

  /* Post-match newspaper headlines. {winner} is replaced with the winner. */
  const HEADLINES = [
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

  /* Lines that scroll along the top during a fight. */
  const TICKER = [
    'Sources say the pantry ran out of milk during round one.',
    'A stray chair was seen leaving the arena on its own.',
    'Management denies the arena is a metaphor.',
    'Meeting invites continue to arrive during the fight.',
    'Legal has asked us to stop calling it a performance review.',
    'Attendance was mandatory. Enthusiasm was not.'
  ];

  function getCharacter(id) {
    return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  }

  globalThis.KK_Roster = { CHARACTERS, PASSIVE_IDS, HEADLINES, TICKER, getCharacter };
})();
