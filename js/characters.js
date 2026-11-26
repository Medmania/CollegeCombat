/* The roster.

   Every fighter is its own file in js/fighters/. This file only collects them
   and holds the shared text: the post-match headlines and the lines that
   scroll during a fight.

   TO ADD A CHARACTER
     1. copy js/fighters/apoorv.js to js/fighters/<their-id>.js
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
    '{winner} victorious, will mention this forever',
    'Nobody saw it, everybody heard about it',
    '{winner} wins; the group chat is already typing',
    'Snacks were finished before the fight started',
    '{winner} wins after "just one round" turns into nine',
    'Witnesses agree it was {winner}, mostly',
    'Breaking: {winner} says it was always about the vibes',
    '{winner} takes it, immediately asks for a rematch'
  ];

  /* Lines that scroll along the top during a fight. */
  const TICKER = [
    'He still owes you 200 from the last trip. He remembers.',
    'Nobody is going to say who ate the last slice.',
    'The group project was, as always, one person.',
    'Attendance is 40 percent. Confidence is 100.',
    'Someone just said "we should meet up more" and meant it.',
    'The wifi dropped exactly when it mattered.',
    'He is not angry. He is just going to bring it up for years.',
    'They have been "almost ready" for forty minutes.',
    'That is his seat. It has always been his seat.',
    'One of you is still using the other one\'s Netflix.'
  ];

  function getCharacter(id) {
    return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  }

  globalThis.KK_Roster = { CHARACTERS, PASSIVE_IDS, HEADLINES, TICKER, getCharacter };
})();
