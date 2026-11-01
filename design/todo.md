# To Do

Known work that still needs doing. Remove items when they are done. `overview.md` has the plan these fit into.

## Before Launch (the user's steps)

- **Create the GitHub repo** `rhseeger/lantern-grid`, push, and set Settings → Pages → Source to "GitHub Actions".
- **Publish the combined rules** in Buzz Off's Firebase project (see SETUP-FIREBASE.md), and run `npm run check:rules`.
  Until then, family play can't save.
- **Copy `database.rules.json` over Buzz Off's copy**, so that publishing from Buzz Off never removes the new games'
  rules.

## Play-testing

- **Try it on real phones**, especially tracing (drag and tap) on small screens, and family play between two phones.
- **Time the answer search** on an older phone; if it's slow, it could run in a web worker.
- **The word list** (SCOWL size 50) accepts some odd words, and may lack some everyday ones; adjust with
  `tools/blocklist.txt` or the size, and rebuild (before launch; see `overview.md`, Tuning).
- **Pacing**: the rank points in `data/ranks.ts` come from a simulation fitted to one real session, before meter readings
  and clues existed. Check them against about a week of real play, alone and together, and adjust. Full Output in
  particular may be too hard or too easy; the List's size (`TUNING`) is the main control, since the chance of finding
  every word falls quickly as it grows.
- **List quality**: SCOWL size 20 isn't a perfect measure of "everyday". Some odd words get on the List (`wive`), and some
  ordinary ones miss it (`defer`). `tools/blocklist.txt` removes a word entirely; a way to move a word on or off the List
  (a small list of overrides, read when building `everyday-words.txt`) would let the family fix these as they find them.
  Rebuilding would change the grids, so it may be better to apply overrides without re-choosing them.
- **Rank names**: the ranks are named from industrial lighting and its codes. Ask the user's wife to check or rename them
  (`data/ranks.ts`).
- **Meter readings** on the smallest phones: check the two numbers fit beside the letter.

## Follow-ups

- **Deleting a family from Buzz Off** leaves the new games' play (`games/*/<fid>`) behind (unreadable, since the
  members are gone). Buzz Off's `deleteFamily()` could clear those paths too. This is a change in Buzz Off's project:
  tell the user rather than making it.
- **Shared code** is copied into each game's project; a change to it must be copied to the others by hand (see
  `family-and-database.md`, Keeping the Shared Code in Step).
- **After launch, keep the grid list stable**: a rebuild changes every day's grid, including today's, and saved paths
  would no longer match it.

## Ideas (not decided; ask before starting)

- **Stats and streaks** over time, as in Buzz Off (see game-design.md, Open Questions).
