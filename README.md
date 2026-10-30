# Showdown

An interactive webpage for playing MLB Showdown with the 2000 and 2001 cards: two
managers on one screen, one twenty-sided die.

```bash
npm install
npm run dev     # play at http://localhost:5173
npm test        # the rules tests
npm run build   # type-check and build for hosting
```

## How it's put together

The code is split so online play can be added later without touching the rules or the screens.

- `src/engine` holds the rules as pure functions: `applyAction(state, actor, action)` returns a
  new state and what happened. The dice live here, and a game is plain JSON, so a server could
  run the same code and own the rolls.
- `src/session` is the seam. The screens only talk to the `GameSession` interface.
  `LocalGameSession` runs the game in the page; an online version would send actions to a server.
- `src/ui` is the screens. They send actions and animate the results, and contain no rules.
- `src/teams` builds rosters: the point cap, real teams and random drafts.
- `src/data` holds the cards. `npm run cards` rebuilds `cards.json` from `raw_data/wotc_cards.csv`.

## The rules

These follow the official Advanced game, based on the 2004 rulebook, with this group's house rules:

- No strategy cards or player icons.
- A pitcher loses 1 per inning past his IP, on every pitch.
- Runners can steal second or third before any pitch, with no strategy card needed. The defense
  rolls d20 + catcher's Arm (+5 for third) and gets him if the total beats his Speed.
- Designated hitters are always in use.
- Real teams play with their own cards, so the 5,000-point cap only applies to teams you build.
- Bench players can't enter before the 7th inning (the bottom of the 6th for the home team).
- Pinch runners and defensive replacements aren't in yet.
