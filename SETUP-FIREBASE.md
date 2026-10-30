# Setting up Firebase for family play

This game uses **Buzz Off's Firebase project** for family play: the same database, the same sign-ins and the same
families. So there's no new project to create. Local play ("Just me") doesn't need any of this.

Because the games are all served from the same address (`https://<you>.github.io/...`), a player's sign-in (guest or
Google) is shared by all of them on that browser, and their families appear in every game.

## What's stored where

Buzz Off's data is unchanged. Each of the new games adds its own part:

- `families/<fid>`, `invites/<fid>`, `users/<uid>/families` - the families, shared by every game (Buzz Off's layout)
- `families/<fid>/days` - Buzz Off's play
- `games/quilt/<fid>/<day>/<uid>` - Quilt's play: each player's own, under their own id
- `games/lantern/<fid>/<day>/<uid>` - Lantern Grid's play
- `games/ladder/<fid>/<day>/<uid>` - Ladder Garden's play

## 1. Publish the rules (once, and after any change)

`database.rules.json` in this project holds the rules for the **whole** database: Buzz Off's rules, unchanged, plus a
`games` section for the three new games. The same file is in each of the new games' projects.

1. Open https://console.firebase.google.com, and Buzz Off's project.
2. **Build → Realtime Database → Rules**.
3. Delete everything in the editor, paste in the whole of `database.rules.json`, and click **Publish**.

Keep Buzz Off's own `database.rules.json` the same as this one (copy this file over it), so that publishing from either
project never removes the other games' rules.

## 2. Check the rules

```sh
npm run check:rules
```

It signs in a few throwaway guests and tries things in this game's part of the database that should and shouldn't be
allowed: saving your own play, saving someone else's, reading another family's, and so on. It prints `PASS` or `FAIL`
for each, then deletes its test family and guests. Everything should be `PASS`. (Buzz Off's `npm run check:rules`
checks the families themselves.)

## 3. Sign-in

Nothing to do: anonymous and Google sign-in are already on for Buzz Off, and the games share its authorized domain
(`<you>.github.io`). If the games are ever moved to a different domain, add it under **Authentication → Settings →
Authorized domains**.

## Costs and care

The same as for Buzz Off: the free Spark plan is plenty (each day's play is a few kilobytes per family), and the
families' creator can remove members or make a new invite link from the family screen in any of the games. Deleting a
family from one of the new games deletes its play in every game, including Buzz Off. (Deleting it from Buzz Off leaves
the new games' play behind, unreadable; see `design/todo.md`.)
