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
- **Difficulty**: check the hard squares are fun rather than frustrating, and that the ranks come at good points.

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
