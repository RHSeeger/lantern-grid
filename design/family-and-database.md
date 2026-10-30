# Family Play and the Shared Database

How family play works, and how it is shared between this game, the other two new games and Buzz Off. This file is the
same in Quilt, Lantern Grid and Ladder Garden; a change to it should be copied to the others.

## The Projects

The family plays four games. Each one is its own project, its own GitHub repository and its own GitHub Pages site, but
they all use one Firebase project (Buzz Off's, `buzz-off-c4a4d`) and one set of families.

| Game | Folder | Play URL | Firebase key |
|---|---|---|---|
| Buzz Off | `D:\Development\Code\buzz-off` | https://rhseeger.github.io/buzz-off/ | (its own layout, under `families/<fid>/days`) |
| Quilt | `D:\Development\Code\quilt` | https://rhseeger.github.io/quilt/ | `quilt` |
| Lantern Grid | `D:\Development\Code\lantern-grid` | https://rhseeger.github.io/lantern-grid/ | `lantern` |
| Ladder Garden | `D:\Development\Code\ladder-garden` | https://rhseeger.github.io/ladder-garden/ | `ladder` |

Buzz Off came first and owns the families. The three new games were built together (2026-10-29) to share Buzz Off's
families without changing Buzz Off's data or code. **Don't change Buzz Off's project from here** (it has its own
`CLAUDE.md` and rules); when something there needs to change, say so and add it to `design/todo.md`.

## The Database

Firebase Realtime Database is one big JSON tree. The parts that matter:

```
families/<fid>/meta                 { name, ownerUid, timezone, createdAt }      (shared by every game)
families/<fid>/members/<uid>        { name, color, joinedAt, inviteCode? }       (shared by every game)
families/<fid>/days/...             Buzz Off's play                              (Buzz Off only)
invites/<fid>                       the family's current invite code              (shared by every game)
users/<uid>/families/<fid>          { name, joinedAt }: the player's list         (shared by every game)
users/<uid>/...                     Buzz Off's stats and badges                   (Buzz Off only)
admin/nytFamilies/<fid>             Buzz Off only
games/quilt/<fid>/<day>/<uid>       Quilt's play: one player's day
games/lantern/<fid>/<day>/<uid>     Lantern Grid's play
games/ladder/<fid>/<day>/<uid>      Ladder Garden's play
```

- `<fid>` is a Firebase push id. `<day>` is `YYYY-MM-DD` in the family's timezone. `<uid>` is the player's Firebase
  user id.
- **Families are Buzz Off's, used exactly as Buzz Off stores them.** The new games create, join, leave and delete
  families with the same writes Buzz Off makes (`family/families.ts`), so a family made in any game appears in all of
  them.
- **Each new game's play is in its own `games/<key>/` branch**, not under `families/<fid>`: Buzz Off's rules refuse any
  unknown child of a family (`families/$fid/$other` is `.validate: false`), and keeping the games apart means Buzz
  Off's rules and data never had to change.
- **Each player writes only their own day** (`games/<key>/<fid>/<day>/<uid>`). Every member can read everyone's.
  Combining is done in the browser by adding everyone's days together; nothing combined is ever stored.
- What a player's day holds is up to each game (see its `code-design.md`, "Family Play"):
    - Quilt: `startedAt: <ms>`, `checks: <count>`, `solved/p<0-8>: <ms>`. (The `p` stops Firebase turning the
      solved patches into an array.)
    - Lantern Grid: `hints: true`, `found/<path key>: { w: <word>, at: <ms> }`. The path key is the squares traced,
      one base-36 character each, so the same word along different squares is a different entry.
    - Ladder Garden: `hints: true`, `words/<word>: <ms>`.
- Only finished things are saved to Firebase. Work in progress (Quilt's marks in an unfinished patch) stays on the
  device.

## The Security Rules

`database.rules.json` is the rules for the **whole** database: Buzz Off's rules, unchanged, plus the `games` section.
The same file is in all three new projects, and Buzz Off's copy should be kept the same (see `design/todo.md`): the
Firebase console has only one set of rules, and publishing an older copy from any project would remove the other games'
rules.

- **Families** (Buzz Off's rules): only members can read a family; only the owner can delete it or remove members;
  joining needs the family's current invite code (a joining member writes `inviteCode` in their member record, and the
  rules compare it with `invites/<fid>`); any member can read the invite code; only the owner can change it.
- **Each game's branch** (`games/<key>/<fid>`):
    - Members of the family can read it.
    - A player can write only their own day (`$uid === auth.uid`), and only while a member, and only on a
      well-formed day key.
    - Every value's shape is checked, and any unknown field is refused (`$other: .validate false`).
    - Only the family's owner can delete the whole branch (when deleting the family).
- **Changing the rules:**
    - Ask first (see CLAUDE.md).
    - Change the file in all three new projects (keep them identical). Buzz Off's copy needs updating too: tell the
      user, don't edit it.
    - The user publishes it in the Firebase console (Realtime Database → Rules), pasting the whole file.
    - Then run `npm run check:rules`. It runs against the real project, using throwaway guest users and a test family
      that it deletes afterwards. Each game checks its own branch; its sample writes are `GOOD` and `BAD` at the top of
      `tools/check-rules.ts`.

## Signing In

- Every player is a Firebase Auth user. The first time they use family play, they're signed in as a **guest**
  (anonymous: a user tied to this browser). They can sign in with **Google** later to use their families on other
  devices: the guest is upgraded in place (same uid). If that Google account was already used, the game switches to
  it and rejoins the guest's families with the invite codes it saved on the device (`inviteCodes` in localStorage).
- Sign-in uses a popup, not a redirect: redirects don't work well when the site isn't on Firebase's own domain.
- **The sign-in is shared by every game, Buzz Off included.** Firebase keeps it per web address, and all four games
  are on `rhseeger.github.io`. Signing in or out in one game does it in all of them (on that browser).

## Invite Links

- An invite link is the game's address plus `#join=<fid>:<code>` (`gamelogic/invites.ts`). The part after `#` never
  reaches a server, and the game removes it from the address as soon as it has read it.
- An invite link from any game works in any other: the family and code are the same. A link opens the game it points
  at.
- Codes are 20 random letters and digits. The owner can make a new one ("New link"), which stops old links working.

## How the Code Is Split

The family code is generic: it knows nothing about the game's rules. The game plugs into it.

| File | What it does |
|---|---|
| `familyController.ts` | Everything about family play that isn't Firebase or a screen: switching between local and family play, following the family and its day live, saving the player's play, combining, create/join/leave/delete, sign-in |
| `family/firebase.ts` | Connecting to Firebase; signing in (guest, Google), signing out |
| `family/families.ts` | Creating, joining, leaving, deleting families; members; invite codes; watching the family |
| `family/gameDayStore.ts` | This game's day for a family: `watchGameDay`, `readGameDay`, `writeMine` |
| `family/personalStore.ts` | The player's list of families (`users/<uid>/families`) |
| `family/api.ts` | Re-exports all of `family/`. The only module loaded with `import()`, so players who never use family play never download Firebase |
| `ui/familyScreens.ts` | Who are you playing with? Create, Join, the family's screen (members, invite link, name and color, leave, delete) |
| `ui/scoreboard.ts` | The Compare screen: a row per member (and "Together" once combined); the game supplies the columns |
| `data/family.ts` | Player colors, name lengths, invite code length, `ALL_GAME_KEYS` |
| `data/firebaseConfig.ts` | Buzz Off's Firebase config, and `FAMILY_PLAY_AVAILABLE` |

The game itself (`app.ts`, `session.ts`, its own `gamelogic/` and `ui/`) does the rest.

### What the game gives the family code

`initFamily(hooks)` is called once at startup with a `FamilyHooks`:

| Hook | Called when | What the game does |
|---|---|---|
| `render()` | Members, connection or combine choice changed | Redraw |
| `dataChanged(first)` | The family's day changed (anyone saved) | Re-read the player's own day from `session.family.data[uid]`; if `first`, set up the day (new puzzle), otherwise redraw |
| `showConnecting(text)` | Connecting, or connecting failed | Hide the board and show the text |
| `showReady()` | Connected, or back to local | Show the board |
| `openSplash()` | The day arrived and a welcome screen is wanted | Open the welcome screen |
| `openLocal()` | Switched back to playing alone | Open today's local play |
| `flash(text)` | A save failed | Show a short message |

### What the family code gives the game

- `session.family` (a `FamilyContext`): `fid`, `meta` (name, owner, timezone), `members` (by uid), `data` (every
  player's day, by uid, as stored; `null` until it arrives) and `combined`.
- `saveMine(values)`: saves part of the player's own day, as one multi-path update relative to their day (for example
  `saveMine({ 'words/cord': Date.now() })`). The change shows up straight away through `dataChanged`, even offline;
  Firebase sends it when it can.
- `setCombined(on)`: combine everyone's work for today, or go back to "Show only mine". Saved on the device
  (localStorage `combined`: for each family, the day it was combined).
- `readFamilyDay(key)`: reads another day once (Yesterday's screen).
- `familyDayKey()`, `openFamilyDay(key, splash)`: today in the family's timezone, and moving to a new day (when the date
  changes while the game is open).
- `enterFamily`, `switchToLocal`, `openPlayMode`, `openJoinFamily`: for the mode button and invite links.

### The pattern each game follows

1. Startup: load the word list and puzzles, open **local** play for today (so there is always a puzzle), then, if the
   player was last in a family, `enterFamily(fid)`. If the address has an invite link, `openJoinFamily(link)`.
2. Family play: when `dataChanged` fires, the game parses `session.family.data[myUid]` into its own `PlayerDay` (the
   same type local play uses) and sets `session.mine`.
3. A move: the game checks it against what the player can see (their own play, or everyone's once combined), then
   saves it: in local play to localStorage (`day:<date>`), in family play with `saveMine()`.
4. Drawing: what's shown is the player's own play, or (once combined) everyone's added together. Each game has a
   helper in `session.ts` for this (`shownPlanted()`, and so on). Others' play is in the data before combining, but
   isn't shown: honor system, as in Buzz Off.
5. Compare: the game turns each member's day into a `ScoreRow` and calls `showScoreboard()`.

## Keeping the Shared Code in Step

These files are identical in all three new projects (`code-design.md` has the full list, under "Shared with the other
games"):

- `familyController.ts`, `serviceWorker.ts`, `global.d.ts`
- `family/*`
- `gamelogic/dates.ts`, `prng.ts`, `storage.ts`, `invites.ts`, `personal.ts`
- `ui/dom.ts`, `modal.ts`, `toast.ts`, `getElement.ts`, `familyScreens.ts`, `scoreboard.ts`, `settings.ts`, `splash.ts`
- `data/family.ts`, `data/firebaseConfig.ts`, and the types they use
- `database.rules.json`, `tests/helpers/fakeFamily.ts`, the tests of the shared files, this file
- The middle of `styles.css` (everything between the color tokens and the game's own section at the end)

Some names in them come from the game's own `data/app.ts`, which is how one copy works in every game: `APP_NAME`,
`REPO_URL`, `STORAGE_PREFIX`, `GAME_KEY`, `OFFLINE_FILES`.

When one of these changes, ask before changing the other projects (each may have its own Claude session working in it),
or list the change in `design/todo.md` for the others to pick up. This checks that the copies are the same (run from
`D:\Development\Code`):

```powershell
$files = 'src\typescript\familyController.ts','src\typescript\family\families.ts','database.rules.json'  # ...and the rest
foreach ($f in $files) {
    $h = 'quilt','lantern-grid','ladder-garden' | ForEach-Object { (Get-FileHash "$_\$f").Hash }
    "$f : $(($h | Select-Object -Unique).Count -eq 1)"
}
```

## Adding Another Game

1. Copy one of the new games' projects, and change `data/app.ts` (name, `REPO_URL`, `STORAGE_PREFIX`, `GAME_KEY`).
2. Add the key to `ALL_GAME_KEYS` in `data/family.ts`, in **every** project, so that deleting a family deletes its play
   in the new game too.
3. Add `games/<key>` to `database.rules.json` (copy one of the existing games' branches and change the fields), in
   every project, and have the user publish it and update Buzz Off's copy.
4. Change the `GOOD` and `BAD` samples in `tools/check-rules.ts`, and run `npm run check:rules` once it's published.

## Things to Know

- **Shared web address.** All the games are on `rhseeger.github.io`, so they share localStorage, the service worker
  scope's origin, and the Firebase sign-in. That's why every storage key has the game's prefix (`STORAGE_PREFIX`:
  `quilt:`, `lantern:`, `ladder:`), and each service worker only touches caches named with that prefix. Never clear
  all of localStorage or all caches.
- **The family's day.** A family's day is the date in `meta.timezone` (the creator's, when they made the family), so
  everyone in the family plays the same puzzle even when travelling. Local play uses the device's date.
- **Local and family play are separate.** Switching doesn't move play between them.
- **Leaving and removing.** A player who leaves or is removed keeps nothing of the family; their play stays in the
  data, and Compare shows it as "someone who left".
- **Deleting a family** (owner only) deletes the family, its invite code, Buzz Off's days and every
  `games/<key>/<fid>`, in one update. Buzz Off's own delete doesn't yet clear `games/*` (see `design/todo.md`): that
  play is left behind but can't be read by anyone.
- **Costs.** The free Spark plan is plenty: a family's day is a few kilobytes. Anything that could cost money needs the
  user's OK first.

## Testing Without Firebase

- **Local play** needs nothing: `npm start`, and choose "Just me".
- **Family play in tests:** `tests/helpers/fakeFamily.ts` stands in for `family/api.ts`
  (`jest.mock('../../src/typescript/family/api', () => fakeApi)`). It plays one family, "f1" ("The Testers", timezone
  UTC), with two members, "me" (the player) and "mom". Tests put Mom's play in `fake.day.mom` and call `fake.push()`;
  the player's own writes echo back straight away, as Firebase's do. `tests/ui/family.test.ts` shows how.
- **Against the real database:** `npm run check:rules` (the rules only); then two browsers (or a browser and a private
  window, which get different guest users) in the same family.
