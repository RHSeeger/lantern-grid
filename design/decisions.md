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
**Status:** Active
