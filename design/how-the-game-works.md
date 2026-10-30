# How the Game Works

A plain-language explanation for people reading the source. Players get the in-game How to Play screen instead.

## Where the grid comes from

There's no server. The whole game is files on GitHub Pages. Two of those files do the heavy lifting:

- `data/words.txt`: every word that can be an answer, about 60,000 of them, in alphabetical order.
- `data/puzzles.txt`: the list of grids, one per line: 36 letters, row by row.

Each day plays the next line of `puzzles.txt`, counting from `EPOCH_DAY` (October 1, 2026), and starts over when the
list runs out, after about 4 years. Every device counts the same way, so everyone gets the same grid without anything
being stored per day.

The answers aren't stored. When a day opens, the game finds them by walking every path through the grid, square by
touching square, and checking the letters so far against the word list:

- Because the list is in alphabetical order, the game can quickly check whether any word starts with those letters.
  If none does, that path is abandoned straight away.
- Every path that spells a whole word of 4 or more letters is an answer.
- For each answer, the game remembers which squares it can go through. That's what the hint numbers count.

How long this takes on older phones hasn't been measured yet (see `overview.md`, The Plan).

`tools/build-puzzles.ts` makes both files from SCOWL, an open word list:

- The word list is SCOWL size 50: no capitals, punctuation or accents, and nothing on the blocklist.
- To make a grid, it cuts the 6 x 6 into winding paths of 4-7 squares, and writes an everyday word along each path.
  That way every square is on at least one word, so the whole grid can always be lit.
- It then solves the grid. It keeps grids with 120-320 answers and 2-5 **hard** squares: squares that at most one
  everyday word goes through.
- It shuffles the kept grids in a fixed way, so the output is the same each time.

## Playing

A trace is a path of squares. When one is finished, the game checks:

- Is it a real path? Each square must touch the last, and no square can be used twice.
- Does it spell an answer?
- Is it new? It must be a new word, or a word already found along squares that light at least one new square.

The first check that fails is the message shown.

Each found word is saved on the device straight away, as its path (the squares, one character each) with the word and
the time. Saving the path, not just the word, matters because the same word can often be traced along different
squares, and only the squares actually traced light up. The lit squares, points and rank are always worked out again
from the paths, never stored.

**Hints** show, on each dark square, how many answers not yet found go through it. Using them is recorded for the day,
and the family can see it.

## Working offline

A service worker keeps a copy of the game's files. After the first visit, the game opens without a connection. Each
new build gets a new copy, and the game offers to reload when one is ready.

## Playing with a family

Family play uses Firebase, a Google database the game talks to directly from the browser. There's still no server of
our own. It uses Buzz Off's Firebase project and Buzz Off's families, so a family made in any of the games works in all
of them. `family-and-database.md` has the details.

Each player saves only their own found paths for the day, in the family's part of the database for this game. Everyone
in the family can read everyone's, and every change arrives straight away.

Every player starts out seeing only their own board. **Combine our work** lights everyone's paths on the board
together:

- Each square shows a dot for everyone who lit it.
- Each word shows a dot for whoever found it first.
- Compare adds a "Together" row with the family's totals.

The choice is remembered by the device for that day. It is about what the screen shows, so it's fair rather than
secret: the other players' words are in the data either way. Until then, Compare shows the other players' longest word
only as its length, so it doesn't give anything away.

The family's day is the date in the family's timezone, so everyone in the family plays the same grid.
