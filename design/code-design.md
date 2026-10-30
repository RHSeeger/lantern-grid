## Folder Layout

```
src/
  index.html        The page template (webpack adds the script)
  css/styles.css    All styling (imported by index.ts, so webpack bundles it)
  static/           Copied to the build unchanged, at the same paths
    data/           words.txt, puzzles.txt, LICENSE-wordlist.txt (made by tools/build-puzzles.ts)
    icons/          App icons (made by tools/make-icons.ts)
    manifest.webmanifest
  typescript/
    index.ts          Startup: imports the CSS and calls startApp()
    app.ts            The game: tracing, drawing the screen, local play, and starting everything
    familyController.ts  Family play: switching modes, following the family's day live, saving the player's play,
                      combining, create/join, sign-in
    session.ts        The session's state (shared by app.ts and familyController.ts), and small calculations on it
    serviceWorker.ts  Built separately, to dist/sw.js (offline play)
    global.d.ts       Additions to global types (`__BUILD_VERSION__`, CSS imports)
    types/            Plain-data types only, one per file
    data/             Fixed definitions / constants (app constants, ranks, the logo, family constants, Firebase config)
    gamelogic/        Rules and calculations, with no DOM (except storage.ts):
      grid.ts             Which squares touch; path keys (one base-36 character per square)
      solver.ts           Loading the word list; finding every word in a grid
      play.ts             Checking a traced word, points, lit squares, ranks, summaries, combining players
      day.ts              The puzzle list; a player's day (local storage and Firebase's form)
      dates.ts, prng.ts, storage.ts, invites.ts, personal.ts   Shared with the other games (see below)
    family/           Everything that talks to Firebase (loaded with import() only when family play is used):
      firebase.ts         Connecting, signing in (guest or Google)
      families.ts         Creating, joining, leaving, deleting families; members; invite codes
      gameDayStore.ts     This game's day for a family: watching it, saving the player's part
      personalStore.ts    The player's list of families
      api.ts              Re-exports them all (the module that is loaded)
    ui/               Drawing and screens: the board, found-words box, progress, and each screen (help, yesterday,
                      compare, settings, splash, family screens), modals, toasts
tools/              Node build tools (TypeScript, run through tools/run.cjs): build-puzzles.ts (with scowl.ts),
                    make-icons.ts, check-rules.ts
tests/              Jest tests, mirroring src/typescript (tests/ui has whole-game smoke tests, in local play and in
                    family play against a stand-in for Firebase, tests/helpers/fakeFamily.ts)
database.rules.json The security rules for the whole shared database (see SETUP-FIREBASE.md)
```

- Any code may import from `types/` and `data/`. Neither of them imports from `gamelogic/` or `ui/`.
- `ui/` imports from `gamelogic/` only for calculations it displays; it never changes saved state. Only `app.ts` and
  `familyController.ts` change the game's state and save it.
- Only `family/` imports Firebase. `familyController.ts` loads it with `import()`, so players who only play locally
  never download it; webpack puts it in its own file.
- `familyController.ts` doesn't import `app.ts`, and knows nothing about the game's rules: it hands each player's raw
  data for the day to the game through `FamilyHooks`, and the game says what to save (`saveMine()`).


## Shared with the other games

Quilt, Lantern Grid and Ladder Garden are separate projects, but share their family play (and Buzz Off's families).
These files are the same in all three projects, and should be kept the same (a change to one should be copied to the
others):

- `familyController.ts`, `family/*`, `serviceWorker.ts`, `global.d.ts`
- `gamelogic/dates.ts`, `prng.ts`, `storage.ts`, `invites.ts`, `personal.ts`
- `ui/dom.ts`, `modal.ts`, `toast.ts`, `getElement.ts`, `familyScreens.ts`, `scoreboard.ts`, `settings.ts`, `splash.ts`
- `data/family.ts`, `data/firebaseConfig.ts`, and the types they use (AuthUser, FamilyContext, FamilyHooks, ...)
- `design/family-and-database.md`, `database.rules.json`, `tools/check-rules.ts` (apart from its sample writes),
  `tests/helpers/fakeFamily.ts`, and the
  tests of the shared files
- The middle of `styles.css` (everything between the color tokens and the game's own section at the end)

What differs is in `data/app.ts` (the name, storage prefix, Firebase key, ...), the game's own `gamelogic/`, `ui/`,
`session.ts` and `app.ts`.


## State

- The session's state lives in `session.ts`. Nothing else holds game state.
- Everything is **plain data** that survives JSON, apart from the `Puzzle`, which is rebuilt from the day each time
  (never saved): its answers are found by searching the grid with the word list.
- Saved in localStorage, all prefixed `lantern:` (the games share a web address, so each has its own prefix):
    - `day:<YYYY-MM-DD>` - a `PlayerDay`: the words traced (with their paths and times), and whether hints were used
    - `theme`, `mode` (who the player is playing with), `profile` (the name and color last used in a family),
      `inviteCodes` (for rejoining after signing in), `combined` (for each family, the day the player combined)
- Values that can be worked out (lit squares, points, rank) are **not** stored.
- Every storage access is wrapped in try/catch: the game must work, without remembering anything, when storage is
  unavailable.


## Family Play (Firebase)

- Two kinds of play: **local** and **family**. They are separate games: switching doesn't move or merge play.
- Families are Buzz Off's (`families/<fid>`, `invites/<fid>`, `users/<uid>/families`), created and joined the same
  way, so a family made in any game works in all of them. The sign-in is shared too: Firebase keeps it per web
  address, and all the games are on the same one.
- This game's play is at `games/lantern/<fid>/<day>/<uid>`: each player writes only their own (`found/<path key>:
  { w, at }`, `hints`), and every member can read everyone's. The rules check the shape of each value.
- The game shows only the player's own play until they **combine** (saved on the device for that day); then it shows
  everyone's put together. Compare shows each player's results either way (others' longest word only as its length
  until combined).
- A family's day is the date in the family's timezone (the creator's), so everyone plays the same grid.


## The Daily Grid

- `data/puzzles.txt` lists the grids in the order they are played, one per line (36 letters, row by row). Day N after
  `EPOCH_DAY` plays line N, starting over when the list runs out (~4 years).
- The answers are found in the browser, by searching the grid with `data/words.txt` (a sorted list, so a search stops
  as soon as no word starts with the letters so far).
- `tools/build-puzzles.ts` makes each grid by cutting it into winding paths of 4-7 squares and writing an everyday word
  along each, so every square can be lit; it keeps grids with 120-320 answers and 2-5 "hard" squares (that at most one
  everyday word reaches).


## Build and Deploy

- `npm run build` type-checks, then webpack builds `dist/`: `index.html`, `app.bundle.js` (with the CSS), the Firebase
  code as separate `*.chunk.js` files, `sw.js`, and everything in `src/static/`.
- The service worker's cache is named after the build, so each deploy installs a new worker and the page offers
  "Update available — Reload". Its caches are named `lantern-...`, and it only ever clears its own (the games share a
  web address). It is skipped on localhost unless the address has `?sw`.
- All paths are relative, so the site works under `https://<user>.github.io/<repo>/`.
- `.github/workflows/deploy-pages.yml` lints, tests, builds and publishes `dist/` to GitHub Pages on each push to
  `main`.


## UI

- Styling lives in `src/css/styles.css`. Colors are tokens (CSS custom properties on `:root`); dark mode is a second
  set of the tokens. Any new color must be a token with a value in both.
- UI code gives elements classes and leaves the look to the CSS. The exceptions are values that come from the state
  (bar widths).
- Elements are made with the small `h()` helper in `ui/dom.ts`; there is no framework.
- Screens are modals (`ui/modal.ts`): one at a time, closed by Escape, the backdrop or the close button.
- Made for phones first: the board fills the width (while leaving room on short screens), and tracing uses pointer
  events with the page's own scrolling turned off on the board.
