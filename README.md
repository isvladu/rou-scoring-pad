# Scoring Pad

A mobile-first, installable **PWA scoring pad** for four card games — **Rentz**, **Whist Românesc**, **Phase 10**, and **Remi (Romanian Rummy)**.

Built to replace the napkin you used to scribble on. Works fully offline once installed, stores games locally in per-game IndexedDBs, and lets you export/import games as JSON — either per-game or as a unified envelope across all four.

## Games

| Game | Players | What it tracks |
|---|---|---|
| **Rentz** | 3 – 6 | Romanian trick-taking with 8 contracts (No Tricks, No Diamonds, No Queens, No K♥, 10♣, Totals, Whist, Rentz). Each player picks each contract once → games run 24 / 32 / 40 / 48 rounds. Blind ("pe nevăzute") and the Rentz-refusal house rule are both modeled. |
| **Whist Românesc** | 3 – 6 | Variable hand-size schedule of `1×N, 2..7, 8×N, 7..2, 1×N` (21 / 24 / 27 / 30 rounds). Bid-vs-tricks scoring with the dealer constraint, plus configurable house rules: zero-bid bonus, max-bid bonus, and a premiere streak bonus (5 consecutive correct bids excluding hand-size-1 rounds → +10 by default). |
| **Phase 10** | 2 – 6 | Standard Mattel rules — 10 phases completed in order, penalty points for cards left in hand, game ends when a phase-10 finisher closes the hand. Lowest total penalty among finishers wins. |
| **Remi** | 2 – 4 | Tile-based Romanian Rummy. Per-hand entry covers melded value, rack value, Joly first-meld bonus, Joly-on-rack penalty, identical-exposed declaration, self-win, and the optional double-on-Joly-discard house rule. Game ends at a target score or a fixed hand count. |

What every game shares:

- Pure scoring + validation functions — UI calls them, tests act as the spec.
- Live scoreboard, undo last round/hand, collapsible round/hand history.
- Per-game **JSON export** (`<gameId>-scoring-app` legacy envelope) plus a unified **`scoring-pad`** envelope from the landing screen that carries games of every type.
- English and Romanian — toggle in the header.
- Stored locally in IndexedDB. Fully offline after install.

Default scoring values are conventions, not law — every game's `NewGame` screen has a "Scoring (advanced)" section where the values can be overridden per-game.

## Tech stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4** (utility-first, dark by default)
- **vite-plugin-pwa** — manifest, service worker, auto-update
- **Zustand** — active-game state, one store per game
- **idb** — typed IndexedDB wrapper (one DB per game)
- **React Router v7** — top-level router + per-game sub-routers, `React.lazy` per game
- **i18next** + **react-i18next** — EN + RO, namespaced per game; only the `common` namespace ships in the initial bundle
- **Zod** — JSON import schema validation, with backward-compatible preprocessors and defaults
- **Vitest** — unit tests for scoring engines, validation, and storage roundtrips

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

Then open the printed LAN URL on your phone, "Add to home screen", and you should see **Scoring Pad** launch full-screen. Toggle airplane mode and reload — it should still load and saved games should persist.

## Routing

| Route | Purpose |
|---|---|
| `/` | Game selector — lists the four games + Export all / Import buttons |
| `/rentz/*` | Rentz module (lazy chunk) |
| `/whist/*` | Whist module (lazy chunk) |
| `/phase10/*` | Phase 10 module (lazy chunk) |
| `/remi/*` | Remi module (lazy chunk) |

Initial JS is **~96 KB gzipped** (landing + core). Each game module is 6 – 12 KB gzipped and loads on first navigation to its route.

## Project layout

```
src/
  core/
    components/        AppHeader, LanguageToggle, UpdateBanner, Scoreboard,
                       PlayerStepper, PlayerRanker, PlayerSinglePick
    storage/           createGamesRepo<T>, GameAdapter, triggerDownload,
                       unifiedExportImport (orchestrates per-game adapters
                       via dynamic import)
    i18n/              i18next setup + common namespace (en, ro)
    types.ts           Player, PlayerId
  games/
    rentz/             one module per game:
    whist/               config/      default scoring values
    phase10/             domain/      pure logic — types, scoring,
    remi/                             validation, rotation/schedule
                         storage/     IndexedDB repo + Zod schema + adapter
                         state/       Zustand store
                         i18n/        en.json + ro.json (this game's namespace)
                         ui/
                           screens/     route-level components
                           components/  game-specific widgets
                         index.tsx    sub-router + i18n namespace registration
  ui/
    screens/HomeScreen.tsx   landing — game selector + Export all / Import
  App.tsx              top-level router + Suspense (React.lazy per game)
  main.tsx             React bootstrap

tests/
  core/                unifiedExportImport tests
  games/<gameId>/      per-game scoring, validation, schedule, storage tests
public/icons/          SVG icons referenced by the PWA manifest
vite.config.ts         Vite + PWA + Tailwind + Vitest config
CLAUDE.md              project guidance for AI agents
```

## Working on the code

A few conventions worth knowing before you start editing:

1. **Code identifiers are English-only.** Enum values, type names, file names, persisted JSON fields — all English. Romanian text lives exclusively in `src/games/<gameId>/i18n/ro.json` (and the shared `src/core/i18n/locales/ro.json`). JSON exports use the English ids too, so games are portable across UI languages.
2. **Scoring + validation stay pure.** Functions in `src/games/<gameId>/domain/scoring.ts` and `domain/validation.ts` take inputs and return outputs — no DOM, no storage, no randomness, no i18n. The UI calls them; tests act as the spec. Validation returns **structured error codes**; the UI translates them.
3. **The UI never computes scores itself.** Always call `computeRoundScores` / `computeHandScores` from the game's `domain/scoring.ts`. Live previews go through the same function the committed scores do.
4. **All persistence goes through `src/games/<gameId>/storage/gamesRepo.ts`**, which sits on `src/core/storage/createGamesRepo<T>`. Don't reach into `idb` directly from a component.
5. **When you add a UI string, add it to both `en.json` and `ro.json` in the same change.** Missing keys silently fall back to English (via `fallbackNS: 'common'`).
6. **`src/core/` may not import from `src/games/`.** The single sanctioned exception is `src/core/storage/unifiedExportImport.ts`, which orchestrates per-game adapters via dynamic imports — adapters never hit the landing chunk.

### Adding a new game module

1. Create `src/games/<gameId>/` with `config/`, `domain/`, `storage/`, `state/`, `ui/`, `i18n/`.
2. Implement domain (`types`, `scoring`, `validation`) as pure functions. Tests cover them as the spec.
3. Implement `storage/db.ts` declaring a `GamesSchema<YourGame>` and a unique DB name. `gamesRepo.ts` is a 9-line wrapper over `createGamesRepo<YourGame>`.
4. Implement `storage/exportImport.ts` with a Zod schema and a legacy envelope (`<gameId>-scoring-app`). Export `GameSchema` and `ExportSchema` as named exports.
5. Implement `storage/adapter.ts` conforming to `GameAdapter` from `src/core/storage/gameAdapter.ts`.
6. Wire the adapter into `loadAdapters()` in `src/core/storage/unifiedExportImport.ts` so the unified envelope picks it up.
7. Implement `state/gameStore.ts` (Zustand), `i18n/en.json` + `ro.json`, and UI screens.
8. Create `index.tsx` that registers the game's i18n namespace at module-eval time and mounts the sub-router.
9. Wire into `App.tsx` with `React.lazy(() => import('./games/<gameId>'))` and activate the landing tile in `src/ui/screens/HomeScreen.tsx`.

### Verifying a change before you ship

1. `npm test` — all green.
2. `npm run build` — succeeds.
3. `npm run preview` — open in the browser, start a game in each affected module, play one round, confirm totals match a hand-computed reference.
4. Switch language EN ↔ RO mid-game; all labels update, totals/state are unchanged.
5. Export the game, import it on a fresh profile, confirm totals match. Also test the **unified envelope**: landing → Export all → Import on a clean profile → all games re-appear in their respective stores.
6. DevTools → throttle to offline, reload — the app still loads and saved games persist.

## Export / import formats

Two formats are accepted on import; auto-detected on every Import button (per-game home screens and the landing screen).

**Per-game legacy** — what each game's per-game Export button on the summary screen emits. The `format` literal identifies the game:

```json
{
  "format": "rentz-scoring-app",
  "version": 1,
  "exportedAt": "...",
  "games": [{ ... }]
}
```

**Unified `scoring-pad` envelope** — what the landing's Export all button emits. Carries records of every game type in one file:

```json
{
  "format": "scoring-pad",
  "version": 1,
  "exportedAt": "...",
  "games": [
    { "gameType": "rentz",   "schemaVersion": 1, "game": { ... } },
    { "gameType": "whist",   "schemaVersion": 1, "game": { ... } },
    { "gameType": "phase10", "schemaVersion": 1, "game": { ... } },
    { "gameType": "remi",    "schemaVersion": 1, "game": { ... } }
  ]
}
```

The per-game export remains unchanged so older backups continue working forever.

## License

MIT (or your preference — no license file is included yet).
