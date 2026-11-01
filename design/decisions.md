# Decision Log

A record of design and architecture decisions: what was decided, when, and why.

- `game-design.md` and `code-design.md` describe how things are **now**. This file records **how they got that way**.
- When a decision is made or changed, update the relevant design file **and** add an entry here.
- Entries are only ever added, never deleted. When a decision is replaced, change the old entry's **Status** to
  `Superseded by <date> — <title>` and add a new entry.
- Entries are in chronological order (newest at the bottom).

Entry format:

```markdown
## YYYY-MM-DD — Short title
**Decision:** What was decided.
**Why:** The reasoning behind it.
**Affects:** Which design files / areas of the code this touches.
**Status:** Active | Superseded by <date> — <title>
```

---

## 2026-10-29 — Built like Buzz Off: a static site, TypeScript, no framework
**Decision:** The game follows Buzz Off's pattern: TypeScript (strict), webpack, Jest, ESLint + Prettier, `src/` built
into `dist/`, published to GitHub Pages by a GitHub Actions workflow; local play in localStorage.
**Why:** It's what the family's other game uses, and it works well; one set of habits for all the games.
**Affects:** Everything.
**Status:** Active

## 2026-10-29 — One Firebase project, and Buzz Off's families, for all the games
**Decision:** The games use Buzz Off's Firebase project, and its families exactly as stored (`families/<fid>`,
`invites/<fid>`, `users/<uid>/families`). Each game keeps its play under its own `games/<game>/<fid>/<day>/<uid>`.
`database.rules.json` is the whole database's rules (Buzz Off's unchanged, plus `games`), and is the same in every
project.
**Why:** The family plays several games: one family and one invite link for all of them. The games share a web address,
so they share the sign-in too. Separate top-level nodes keep Buzz Off's rules and data untouched.
**Affects:** code-design.md (Family Play), SETUP-FIREBASE.md, database.rules.json, family/
**Status:** Active

## 2026-10-29 — Each player saves their own play; "combine" is a view
**Decision:** In family play each player writes only their own day (`games/<game>/<fid>/<day>/<uid>`). The game shows
only the player's own play until they choose "Combine our work", which shows everyone's put together, and the family's
total on the Compare screen. The choice is saved on the device for that day.
**Why:** The family wants to play on their own, compare how they did, and only then work together. Keeping each
player's play separate makes comparing exact, and combining is just adding it up. (It is honor-system, as in Buzz Off:
members can read each other's play.)
**Affects:** game-design.md (Family Play), familyController.ts, session.ts
**Status:** Active

## 2026-10-29 — Family play code shared by the games, as identical files
**Decision:** The family code (controller, Firebase, family screens, Compare screen, menu, splash, ...) is generic: it
knows nothing of the game's rules, and is copied unchanged into each game's project.
**Why:** Separate projects (one repository and one web address each) were asked for; identical files are easy to keep
in step, without a shared package to publish.
**Affects:** code-design.md (Shared with the other games)
**Status:** Active

## 2026-10-29 — Grids are built from words, so every square can be lit
**Decision:** Each grid is made by cutting the 6 x 6 into winding paths of 4-7 squares and writing an everyday word
along each. Grids are kept with 120-320 answers and 2-5 hard squares (reached by at most one everyday word, SCOWL size
20). The word list is SCOWL size 50 (with S, unlike Buzz Off's).
**Why:** Lighting every square must always be possible, and a few hard squares make that the family's shared goal.
**Affects:** game-design.md (The Puzzle), tools/build-puzzles.ts
**Status:** Superseded by 2026-11-01 — Paced like Spelling Bee: a List of everyday words, dimmers and Spotlights

## 2026-11-01 — Paced like Spelling Bee: a List of everyday words, dimmers and Spotlights
**Decision:** Rank comes from the share of the points of a grid's List: its 45-65 everyday words (SCOWL size 20), on a
new ladder named from industrial lighting and its codes. Other valid words are accepted as bonus words. Each square is
on a dimmer showing the share of its List words found. Up to three long words are Spotlights. Hints now also show how
many missing words start on each square. Compare shows rank, points, words, "Only" and Spotlights, in place of squares
lit and the longest word. A found word lights every square it can go through, so tracing a found word again along another
path is gone. The grids were rebuilt (seed v2), keeping those whose List is the right length, reaches every square and has
a Spotlight; earlier saved play was deliberately invalidated, which the user and their wife were happy with. One ladder
serves 1 to 4 players, rather than scaling with family size.
**Why:** The game had only two real levels: lighting every square (easy), and finding all of ~230 words, many obscure (not
realistic). The user wants Spelling Bee's pace: a good rank alone, a better one together, and every word rare but doable.
The chance of finding every word falls quickly with the list's length, so the list had to shrink; dimmers keep the
lighting theme (the user's wife works in lighting codes and regulations) and show where to hunt for the last words. Rank
points come from a simulation with invented skills, so they need checking against real play.
**Affects:** game-design.md, code-design.md, overview.md, how-the-game-works.md, ui/help.ts, gamelogic/play.ts, solver.ts,
data/ranks.ts, tools/build-puzzles.ts, the data files
**Status:** Active, except its rank points and hints: see 2026-11-01 — Bonus words take meter readings; lower ranks; clues

## 2026-11-01 — Bonus words take meter readings; lower ranks; clues
**Decision:** A bonus word still scores nothing, but shows, on every square it can go through, how many List words not
yet found go through it and start on it. The hint numbers are gone as a hint: the bulb now gives a clue on a tapped square
(length and first two letters of its shortest missing word), and using it is what Compare shows. "Cleared" (a square with
all its List words found) is a counted goal. Rank points are lowered: Egress 5%, Ambient 12%, Task Light 20%, Up to Code
30%, High Bay 45%, Exceeds Code 60%, Daylight 85%. The saved field keeps the name `hints`, so the database rules needn't
change.
**Why:** The user's first real session ended at 16 of 61 List words and 23% of the points, with 17 words earning nothing,
which was frustrating, while they enjoyed "clearing" letters with the numbers on. The user chose readings over the
proposal to give bonus words rank credit: finding one gives a clue to the real words, rather than inflating the score, and
keeps Full Output meaning every word. Bonus words reveal quickly (typically 19 squares after 5 of them, 31 after 17).
**Affects:** game-design.md, how-the-game-works.md, ui/help.ts, ui/board.ts, ui/progress.ts, gamelogic/play.ts, app.ts,
data/ranks.ts
**Status:** Active
