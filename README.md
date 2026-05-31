# Rentz Scoring

A mobile-first, installable **PWA scoring pad** for the Romanian card game **Rentz**.

Built to replace the napkin you used to scribble on. Works fully offline once installed, stores games locally in IndexedDB, and lets you export/import games as JSON so you can move them between devices.

## What it does

Rentz is a Romanian trick-taking card game played by 4, 5, or 6 players. Each game runs through every player dealing every contract once, so a 4-player game is 32 rounds, 5p is 40, 6p is 48. The app:

- Manages the **rotation** — tracks who deals next and which contracts they still owe.
- Runs **per-trick guided entry** for each contract, with live sum validation so you can't save a Levate round whose tricks don't add up to 8.
- Computes scores from a **single editable config file** (`src/config/scoringDefaults.ts`); house-rule values can be overridden per game.
- Keeps a **live scoreboard** ranked by current total, and a finishing summary with optional JSON export.
- Speaks **English and Romanian** — UI toggle in the header.

### Contracts modeled

| Code id           | English            | Romanian             | Notes                          |
| ----------------- | ------------------ | -------------------- | ------------------------------ |
| `noTricks`        | No Tricks          | Levate               | per trick taken (negative)     |
| `noDiamonds`      | No Diamonds        | Carouri              | per diamond taken (negative)   |
| `noQueens`        | No Queens          | Dame                 | per queen taken (negative)     |
| `noKingOfHearts`  | No King of Hearts  | Regele de Inimă Roșie | single taker (negative)        |
| `tenOfClubs`      | 10 of Clubs        | 10 de Treflă         | single taker (**positive**)    |
| `totals`          | Totals             | Totale               | all four negatives combined    |
| `whist`           | Whist              | Whist                | per trick taken, no bidding    |
| `rentz`           | Rentz              | Rentz                | finishing-order ranking only   |

Default scoring values are conventions, not law — edit `src/config/scoringDefaults.ts` or override per game.

## Tech stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4** (utility-first, dark by default)
- **vite-plugin-pwa** — manifest, service worker, auto-update
- **Zustand** — active-game state
- **idb** — typed IndexedDB wrapper
- **React Router v7** — screen routing
- **i18next** + **react-i18next** — English + Romanian
- **Zod** — JSON import schema validation
- **Vitest** — unit tests for the scoring engine and storage roundtrip

## Getting started

Requires **Node 20+**.

```bash
npm install
npm run dev      # http://localhost:5173 with HMR (service worker disabled in dev)
```

### Available scripts

| Script                | What it does                                                |
| --------------------- | ----------------------------------------------------------- |
| `npm run dev`         | Vite dev server with HMR                                    |
| `npm run build`       | `tsc -b && vite build` — typecheck + production bundle      |
| `npm run preview`     | Serve the production build locally (real service worker)    |
| `npm test`            | Vitest, single run                                          |
| `npm run test:watch`  | Vitest in watch mode                                        |
| `npm run lint`        | ESLint over the whole project                               |

### Testing the PWA on a phone

The service worker only runs against a real build, so:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

Then open the printed LAN URL on your phone, "Add to home screen", and you should see "Rentz" launch full-screen. Toggle airplane mode and reload — it should still load and the current game should persist.

## Project layout

```
src/
  config/scoringDefaults.ts   single source of truth for point values
  domain/                     pure logic — scoring, validation, rotation, types
  storage/                    IndexedDB repo + JSON export/import (zod schema)
  state/gameStore.ts          Zustand store for the active game
  i18n/                       i18next setup + en.json / ro.json
  ui/
    screens/                  route-level components
    components/               Scoreboard, PlayerStepper, PlayerRanker, ...
  App.tsx                     router + update-available banner
  main.tsx                    React bootstrap

tests/                        Vitest unit tests
public/icons/                 SVG icons referenced by the PWA manifest
vite.config.ts                Vite + PWA + Tailwind + Vitest config
CLAUDE.md                     project guidance for AI agents
```

## Working on the code

A few conventions worth knowing before you start editing:

1. **Code identifiers are English-only.** Contract ids are `noTricks`, `noDiamonds`, etc. — never `levate` or `carouri`. Romanian text lives exclusively in `src/i18n/locales/ro.json`. JSON exports use the English ids too, so games are portable across UI languages.
2. **Scoring logic stays pure.** Functions in `src/domain/scoring.ts` and `src/domain/validation.ts` take inputs and return outputs — no DOM, no storage, no randomness. The UI calls them; tests use them as the spec.
3. **The UI never computes scores itself.** Always call `computeRoundScores` from `src/domain/scoring.ts`. Live previews (e.g. the Rentz finishing-order preview) go through the same function the committed scores do.
4. **All persistence goes through `src/storage/gamesRepo.ts`.** Don't reach into `idb` directly from a component.
5. **When you add a UI string, add it to both `en.json` and `ro.json` in the same change.** Missing keys silently fall back to English.

### Adding a new contract

1. Add the id to `ContractId` and `ALL_CONTRACTS` in `src/domain/types.ts`, and extend `RoundEntry`.
2. Add default point values + type to `src/config/scoringDefaults.ts`.
3. Add a branch to `computeRoundScores` in `src/domain/scoring.ts`.
4. Add a branch to `validateRoundEntry` in `src/domain/validation.ts`.
5. Add a branch to `RoundEntryScreen.tsx` for the entry UI.
6. Add labels to **both** `src/i18n/locales/en.json` and `ro.json` under `contracts.<id>`.
7. Add unit tests in `tests/scoring.test.ts`.

### Verifying a change before you ship

1. `npm test` — green.
2. `npm run build` — succeeds.
3. `npm run preview` — start a 4-player game, play one round of every contract, confirm totals match a hand-computed reference.
4. Switch language EN ↔ RO mid-game; labels update, scores don't.
5. Export the game, import it on a fresh profile, confirm totals match.
6. DevTools → throttle to offline, reload — the app still loads.

## License

MIT (or your preference — no license file is included yet).
