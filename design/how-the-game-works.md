# How the Game Works

A plain-language explanation for people reading the source. Players get the in-game How to Play screen instead.

## Where the grid comes from

There's no server. The whole game is files on GitHub Pages. Two of those files do the heavy lifting:

- `data/words.txt`: every word that can be an answer, about 60,000 of them, in alphabetical order.
- `data/everyday-words.txt`: the ones common enough to go on a grid's List, about 12,000 of them.
- `data/puzzles.txt`: the list of grids, one per line: 36 letters, row by row.

Each day plays the next line of `puzzles.txt`, counting from `EPOCH_DAY` (October 1, 2026), and starts over when the
list runs out, after about 4 years. Every device counts the same way, so everyone gets the same grid without anything
being stored per day.

The answers aren't stored. When a day opens, the game finds them by walking every path through the grid, square by
touching square, and checking the letters so far against the word list:

- Because the list is in alphabetical order, the game can quickly check whether any word starts with those letters.
  If none does, that path is abandoned straight away.
- Every path that spells a whole word of 4 or more letters is an answer.
- For each answer, the game remembers which squares it can go through and start on. That's what the dimmers and the meter
  readings count.
- The answers that are everyday words are the grid's **List**, the words that count for rank. The rest are bonus words.

How long this takes on older phones hasn't been measured yet (see `overview.md`, The Plan).

`tools/build-puzzles.ts` makes these files from SCOWL, an open word list:

- The word list is SCOWL size 50: no capitals, punctuation or accents, and nothing on the blocklist. Everyday words are
  SCOWL size 20.
- To make a grid, it cuts the 6 x 6 into winding paths of 4-7 squares, and writes a common word along each path.
- It then solves the grid for its List. It keeps a grid only if the List has 45-65 words, reaches every square, has a
  word of 7+ letters to be a Spotlight, and leaves at most 6 **hard** squares: squares that at most one List word goes
  through.
- Its random choices come from a fixed seed, so the output is the same each time.

## Playing

A trace is a path of squares. When one is finished, the game checks:

- Is it a real path? Each square must touch the last, and no square can be used twice.
- Does it spell an answer?
- Is it new? It must be a word not found yet.

The first check that fails is the message shown.

Each found word is saved on the device straight away, as its path (the squares, one character each) with the word and
the time. A found word lights every square it could go through, along any of its paths, not just the way it was traced.
The lit squares, dimmers, points and rank are always worked out again from the words, never stored.

Words score points by length, but only List words count. **Rank** is the share of the List's points found.

Each square's **dimmer** is the share of the List words through it that are found, in five steps. A square at full, with
all its List words found, glows and counts as cleared. So a dim square shows where words are still hiding. A bonus word
can light a dark square, but only to the lowest step.

A bonus word also takes a **meter reading** on every square it can go through: from then on, that square shows how many
List words not yet found go through it and start on it. So bonus words score nothing, but are clues to the real words.

**Spotlights** are the List's longest words, of 7 letters or more, up to three a day.

**Clues** are for when a player is stuck, and have to be earned: every 2 of the player's bonus words earn one, which the
bulb shows by filling up and counting. Tap the bulb, then a square, to see the length and first two letters of the
shortest List word not yet found through it. That costs one clue, once per word: seeing the same clue again is free. The
game works out clues earned from the words found, and saves the clues spent on the device, even in family play for now.
Whether clues were used is saved with the day, and the family can see it.

The **Fixture Schedule** is a table of the List words still missing, by first letter and length. It's worked out from the
words found, so it isn't saved, and it's free to look at.

## Working offline

A service worker keeps a copy of the game's files. After the first visit, the game opens without a connection. Each
new build gets a new copy, and the game offers to reload when one is ready.

## Playing with a family

Family play uses Firebase, a Google database the game talks to directly from the browser. There's still no server of
our own. It uses Buzz Off's Firebase project and Buzz Off's families, so a family made in any of the games works in all
of them. `family-and-database.md` has the details.

Each player saves only their own found words for the day, in the family's part of the database for this game. Everyone
in the family can read everyone's, and every change arrives straight away.

Every player starts out seeing only their own board. **Combine our work** puts everyone's words on the board together:

- The dimmers rise with everyone's words, and everyone's bonus words take readings.
- Each square shows a dot for everyone who lit it.
- Each word shows a dot for whoever found it first.
- Compare adds a "Together" row with the family's totals.

The choice is remembered by the device for that day. It is about what the screen shows, so it's fair rather than
secret: the other players' words are in the data either way. Compare shows only counts, including "Only", the List words
nobody else found, so it doesn't give anything away.

The family's day is the date in the family's timezone, so everyone in the family plays the same grid.
