# Lantern Grid

**Play it here: https://rhseeger.github.io/lantern-grid/**

A daily word-path puzzle. Trace words through a 6 x 6 grid of letters, by dragging from letter to letter (or tapping),
and every square a word goes through lights up. Can you light the whole grid? Every square can be lit, but a few are
tricky: only unusual words reach them.

Play on your own, or with your family: everyone gets the same grid each day and plays on their own, at their own pace.
**Compare** shows how each of you is doing (squares lit, words, points), and when you're ready, **Combine our work**
lights everyone's words on your board, in each finder's color, with the family's total. Families are shared with
[Buzz Off](https://rhseeger.github.io/buzz-off/), [Quilt](https://rhseeger.github.io/quilt/) and
[Ladder Garden](https://rhseeger.github.io/ladder-garden/): a family made in one shows up in all of them.

It's a static web app (TypeScript, built with webpack), made for phones, installable to the home screen, and it works
offline.


## Technical Details
- TypeScript (strict), HTML and CSS; no framework
- Family play uses Firebase (Auth and Realtime Database): the same project as Buzz Off, loaded only when it's used.
  See **SETUP-FIREBASE.md**. Local play ("Just me") needs no setup at all, so the game can always be played and
  tested on its own. The Firebase config in `src/typescript/data/firebaseConfig.ts` is public by design: the security
  rules (`database.rules.json`) are what protect the data.
- Webpack builds `src/` into `dist/`; Jest tests in `tests/`; ESLint + Prettier
- Local play's progress is kept in the browser's localStorage (keys start with `lantern:`); family play's is in Firebase
- The word list is derived from [SCOWL](http://wordlist.aspell.net/) (see `src/static/data/LICENSE-wordlist.txt`)

See `design/` for how the code and the game are put together, and `CLAUDE.md` for the coding rules.


## Useful Notes

- Build: `npm run build` (output in `dist/`)
- Run locally: `npm start` → http://localhost:3000 (also reachable from phones on the same network, at this computer's
  IP address). The service worker is skipped on localhost; add `?sw` to the address to test offline play.
- Test: `npm run test` · Lint: `npm run lint` (`npm run lint:fix` to fix formatting)
- Rebuild the word list and the daily grids: `npm run build:puzzles` (downloads SCOWL once into `tools/.cache/`). This
  changes the answers and grids, so see `design/decisions.md` first.
- Rebuild the icons: `npm run build:icons`
- Check the Firebase security rules for this game: `npm run check:rules` (after publishing them)

Publishing: every push to `main` is linted, tested, built and published to GitHub Pages by
`.github/workflows/deploy-pages.yml` (if the lint or tests fail, nothing is published). It can also be run by hand
from the Actions tab. One-time setup: Settings > Pages > Source: "GitHub Actions".


## AI Disclosure

This game was designed and written with the help of AI: Claude (by Anthropic), working in Claude Code, wrote the
code, tests, puzzle generator and documentation, following the direction, ideas and review of the project's owner.
The family-play code is adapted from Buzz Off, which was made the same way. Please report anything that looks wrong.
