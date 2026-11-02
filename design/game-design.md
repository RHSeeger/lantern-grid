## The Puzzle

- Every day there is one 6 x 6 grid of letters.
- A word is traced through touching squares (across, up and down, or corner to corner), using each square at most
  once. Words must be 4+ letters and in the word list (SCOWL size 50, American English: no proper nouns, apostrophes,
  hyphens or blocked words).
- **The List:** the grid's everyday words (SCOWL size 20), 45-65 of them. Only these count for rank. Every other valid
  word is accepted as a **bonus word**: it scores nothing, but can light a dark square and takes a meter reading.
- **Meter readings:** a bonus word shows two numbers, for the rest of the day, on every square it can go through: how
  many List words not yet found go through the square (top right), and how many of them start on it (top left, "▸").
  List words don't take readings. So finding bonus words gives clues to the real words.
- A found word lights every square it can go through, along any of its paths, however it was traced.
- **Dimmers:** each square's brightness is the share of the List words through it that are found (5 levels). A glowing
  square is at full, or **cleared**: every List word through it is found. So a dim square shows that words are still
  hiding there. Clearing squares is a goal of its own, counted beside the squares lit.
- **Spotlights:** the List's longest words of 7+ letters, up to 3 a day, shown as stars. Every grid has at least one.
- The day changes at local midnight (in family play, the family's timezone).

## Scoring and Ranks

- Words score points (Boggle-style): 1 for 4 letters, 2 for 5, 3 for 6, 5 for 7, 11 for 8+.
- Ranks come from the share of the List's points found: Dark 0, Standby 1%, Egress 5%, Ambient 12%, Task Light 20%, Up
  to Code 30%, High Bay 45%, Exceeds Code 60%, Daylight 85%, Full Output 100%. The names come from industrial lighting
  and its codes.
- The ladder is the same however many are playing. Its intended pace, modeled on Spelling Bee, for 1 to 4 players:
    - Task Light: most days, alone.
    - Up to Code: alone on a good day; a family nearly every day.
    - Exceeds Code: a family on many days, if they hunt after combining; a very rare thing alone.
    - Full Output: rare, and takes a determined hunt with readings and clues.
- Finding the whole List shows a celebration; other rank-ups and lighting every square show a short message.

## Playing

- Drag through the letters and let go to submit; or tap letters one at a time (tapping a letter in the path goes back
  to it) and tap the last again, or press Enter. While dragging, only the middle of each square counts, so diagonal
  moves don't pick up the squares beside the way.
- **Clues** (the bulb): every 2 of a player's own bonus words earn a clue, also when combined. The bulb fills as they're
  found, and shows how many clues are ready. Tap it, then a square, to see the length and first two letters of the square's
  shortest missing List word. It works on any square, including the few no bonus word reaches. A clue is paid for once per
  word: tapping any square whose current clue is that word again is free. The bulb turns off after each clue, so a stray
  tap can't spend another. The family can see who used clues (not yet how many). Spent clues are saved only on the device
  for now, so another device starts with them unspent (see `todo.md`). Meter readings don't count as using clues.
- **Fixture Schedule** (the table button): a table of the List words still missing, by first letter and length (4, 5, 6,
  7+), with totals, and the player's clues not yet solved. It's free and isn't recorded. Combined, it counts what the
  family is still missing. It has its own button so that it doesn't show every time the found words are opened.
- The found-words box shows how many of the List's words are found (and any bonus words), and opens to the list, with
  stars on the Spotlights.

## Screens

- **Welcome** (every visit), **Rankings** (tap the progress bar), **Fixture Schedule**, **Yesterday's Answers** (the grid,
  what was lit, and the List), **Compare** (family play), **How to Play**, **Menu** (theme, about with the GitHub link, erase local
  progress), and the family screens (shared with the other games).

## Family Play

- **Who you're playing with:** the button above the progress bar. Families are shared with Buzz Off and the other
  games.
- **Everyone plays on their own:** the same grid, each with their own words, dimmers and rank.
- **Compare** (the trophy): each member's rank, points, List words, "Only" (List words nobody else found, as a count, so
  it gives nothing away), Spotlights, and whether they used clues.
- **Combine our work:** asks first, then lights everyone's words on the board together: each square shows a dot for
  everyone who lit it, the dimmers rise with everyone's words, everyone's bonus words take readings, each word has a dot for its first finder, and Compare adds the family's total ("Together"). Words
  found while combined still count for the player. Entering a word someone else found says "Already found (by Mom)".
  "Show only mine" goes back. The choice is kept for the day, on the device.

## Open Questions

- Should there be stats and streaks over time (like Buzz Off's)?
