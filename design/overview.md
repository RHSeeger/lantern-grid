# Lantern Grid

A daily word-tracing puzzle for the family. Each day has one 6 x 6 grid of letters. Players trace words through
touching squares to climb the ranks by finding the grid's List of everyday words. Each square is on a dimmer, which
rises as the List words through it are found, so the goal is to bring the whole grid up to full. It's paced like
Spelling Bee: a good rank is within reach alone, a better one together, and finding every word is rare. It's one of three games built together on 2026-10-29 (with Quilt and Ladder Garden), next to the family's
first game, Buzz Off. All four share families. The brief for all three was:

- Each person plays on their own, at their own pace.
- Players can compare how they did.
- Players can combine their work and see how they did as a team.
- Play is casual.
- The game is easy to play on a phone, since everyone plays on their phones.
- Solo play works without any Firebase setup.

## The Design Files

- `overview.md`: this file. What the game is, where the project stands, and the plan.
- `game-design.md`: the game itself: the rules, scoring and ranks, screens and family play.
- `how-the-game-works.md`: a plain-language explanation of how it works, for people reading the source. The in-game How
  to Play screen (`src/typescript/ui/help.ts`) is written separately, for players.
- `code-design.md`: how the code is laid out, what may do what, state, the daily grid, build and deploy, and UI rules.
- `family-and-database.md`: how family play works, and how it is shared with Buzz Off and the other games: the
  database, the security rules, sign-in, invites, the shared code and how the game plugs into it. The same file is in
  all three projects.
- `decisions.md`: a dated log of design and architecture decisions: what was decided, when, and why.
- `todo.md`: known work that still needs doing.

## Where the Project Stands (2026-10-29)

- **Built and passing:** the whole game works: local play, family play (compare, combine), invites, sign-in, ranks,
  hints, Yesterday's Answers, help, menu, dark mode, offline, and installing it as an app. `npm run lint`, `npm test`
  (58 tests) and `npm run build` all pass.
- **Not yet tried for real:** it has been tested only in Jest (jsdom, including whole-game tests that trace words with
  pointer events, and family play against a fake Firebase). It has not been run on a real phone, in a real browser, or
  against the real Firebase database.
- **Not yet published:** the GitHub repository (`rhseeger/lantern-grid`) still has to be created and pushed by the
  user. The user does all git and GitHub work; never run git.
- **Family play can't save yet:** the new `database.rules.json` has to be published to Buzz Off's Firebase project
  first (see `SETUP-FIREBASE.md`).

## The Plan

1. **Launch** (the user's steps):
    - Create the repo and push it.
    - Set Settings → Pages → Source to "GitHub Actions".
    - Publish `database.rules.json` in the Firebase console, and copy it over Buzz Off's copy.
    - Run `npm run check:rules`.
2. **Play-test with the family.** Try it on real phones, on its own and in a family across two phones. Fix whatever
   comes up. Things to watch:
    - Tracing, both drag and tap, on small screens. The drag's catch area (`DRAG_RADIUS` in `ui/board.ts`) is the main
      thing to adjust.
    - How long the answers take to work out on older phones.
    - Whether the ranks come at the intended pace (see `game-design.md`, Scoring and Ranks).
    - Whether the List feels fair: words it should have, and words it shouldn't.
3. **Tune.** Adjust the grids and ranks from what the family says (see Tuning, below), **before** the grid list settles,
   because rebuilding changes every day's grid.
4. **Grow.** The ideas in `todo.md` and the Open Questions in `game-design.md`, such as stats and streaks like Buzz
   Off's. Only do these when the user asks for them.

## Tuning

- **The grids:** `TUNING` in `tools/build-puzzles.ts` sets:
    - What counts as an everyday word (SCOWL size 20).
    - The number of List words per grid (45-65).
    - What counts as a hard square (at most 1 List word through it), and the most a grid may have (6).
- **The word list:** SCOWL size 50, minus `tools/blocklist.txt`.
- **Spotlights:** `SPOTLIGHT_MIN_LENGTH` and `SPOTLIGHT_MAX` in `data/app.ts`. **Dimmer levels:** `DIMMER_FULL`.
- **Ranks:** `data/ranks.ts`. **Points:** `wordPoints()` in `gamelogic/play.ts`.
- **Rebuilding:** `npm run build:puzzles` rebuilds `words.txt`, `everyday-words.txt` and `puzzles.txt`. It downloads SCOWL into
  `tools/.cache/` the first time, or uses a copy given with `--scowl <file>`. The output is the same every time for the
  same settings.
- **Rebuilding changes every day's grid, including today's.** Once the family is playing, a rebuild would change the
  grid under anyone partway through a day, and their saved paths would no longer match it. After launch, keep the lines
  already played (or change `EPOCH_DAY` deliberately), and record the change in `decisions.md`.
