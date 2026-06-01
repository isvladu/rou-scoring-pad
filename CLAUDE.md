# Rentz Scoring App

PWA scoring pad for the Romanian card game **Rentz**. Local-first (IndexedDB), fully offline once installed, with JSON export/import. Mobile-first React app.

## Domain glossary

The app models a specific Romanian Rentz variant. Treat these as authoritative — do not assume textbook Rentz/Barbu/King rules.

| Code id (English)  | EN label         | RO label                 | Type        | Notes                                                           |
| ------------------ | ---------------- | ------------------------ | ----------- | --------------------------------------------------------------- |
| `noTricks`         | No Tricks        | Levate                   | negative    | per trick taken (8 tricks/hand)                                 |
| `noDiamonds`       | No Diamonds      | Carouri                  | negative    | per diamond taken; 8/10/12 diamonds for 4/5/6 players           |
| `noQueens`         | No Queens        | Dame                     | negative    | per queen taken; always 4 queens                                |
| `noKingOfHearts`   | No King of Hearts | Regele de Inimă Roșie    | negative    | single taker gets the penalty                                   |
| `tenOfClubs`       | 10 of Clubs      | 10 de Treflă             | **positive** | single taker gets the bonus                                     |
| `totals`           | Totals           | Totale                   | combo        | all four negatives in one round, optionally multiplied          |
| `whist`            | Whist            | Whist                    | per-trick   | **no bidding** — score is per trick taken                       |
| `rentz`            | Rentz            | Rentz                    | ranking     | only finishing order is recorded; trick play is not modeled     |

**Player counts**: 4, 5, or 6. Decks are 32 (4p, 7→A), 40 (5p, 5→A), 48 (6p, 3→A). Always 8 tricks per hand.

**Rotation rule** — two distinct roles per round:

- **Picker** (`Round.pickerId`, `RotationState.currentPickerId`) — the player whose turn it is to choose the contract and lead play. The rotation index advances by picker; `picker = players[roundsPlayed % N]`.
- **Dealer** (`RotationState.currentDealerId`, derived via `dealerForPicker`) — the player who deals the cards this round, always the seat **immediately before the picker** (wraps to the last seat for the first picker). Not stored on `Round` since it's pure-derivable from `pickerId` and the player order.

Full rotation — each player **picks** each contract exactly once. Game length is `players × 8` rounds (32 / 40 / 48). The ContractPicker screen hides contracts the current picker has already chosen.

**Blind ("pe nevăzute")** — the picker may declare *blind* before seeing their cards. Stored as `Round.blind: boolean`. When true, `computeRoundScores` multiplies every player's score for that round by `ScoringConfig.blindMultiplier` (default 2). Totals (Totale) is a straight sum of the four negative penalties — no separate multiplier — so a blind Totale is just `rawSum × blindMultiplier`.

Two rules constrain when blind is allowed:

- **Not on your last remaining contract.** Enforced UI-only in `ContractPickerScreen` (toggle disabled when `legalContracts.length === 1`). The domain layer doesn't check — you can't be brave about a forced choice, but if we ever relax this it requires no schema change.
- **Rentz cannot ever be picked blind.** Enforced both in the UI (the Rentz button is disabled and shows a hint while blind is on) and in the domain (`commitRound` throws if `blind=true && entry.contract === 'rentz'`, via the `canBeBlind` helper in `src/domain/contracts.ts`). The reason: Rentz scores by finishing-order ranking, not by card-related performance, so there's nothing to be brave about.

## Architecture invariants

- **All code identifiers (enums, types, keys, filenames, persisted JSON fields) are English.** Romanian only appears in `src/i18n/locales/ro.json`. Never introduce Romanian variable or type names.
- **Scoring functions are pure.** `src/domain/scoring.ts` and `src/domain/validation.ts` must not touch the DOM, storage, randomness, or i18n. They take `(entry, players, scoring)` and return a value. This is the contract that lets the test suite act as the spec.
- **The UI never computes scores.** It always calls `computeRoundScores` from `src/domain/scoring.ts`. Live previews (e.g. the Rentz finishing-order preview) use the same function.
- **All writes go through `src/storage/gamesRepo.ts`.** Do not call `idb` directly from screens/components.
- **Persisted JSON uses English contract ids only**, so an exported game opens identically regardless of UI language.

## Where things live

```
src/
  config/scoringDefaults.ts   ← single source of truth for default point values
  domain/                     ← pure logic (types, scoring, validation, rotation)
  storage/                    ← IndexedDB repo + JSON export/import
  state/gameStore.ts          ← Zustand store for the active game
  i18n/                       ← i18next setup + locale json files
  ui/screens/                 ← route-level components
  ui/components/              ← shared widgets (Scoreboard, PlayerStepper, ...)
tests/                        ← Vitest unit tests
```

## Scoring rules

Default values live in `src/config/scoringDefaults.ts`. The user can override them per game in the NewGame screen (Scoring section). These defaults are **conventions, not law** — the user may want to correct individual values to match their table. The structure (which fields each contract takes) is fixed; the numbers are configuration.

**Sign convention** — every `ScoringConfig` value (`noTricks.perTrick`, `noDiamonds.perDiamond`, `noQueens.perQueen`, `noKingOfHearts.takingIt`, `tenOfClubs.takingIt`, `whist.perTrick`, and every entry of `rentz.byPosition`) is stored as a **non-negative magnitude**. The calculator (`src/domain/scoring.ts`) applies the sign via the `signed(contractId, value)` helper, which reads `CONTRACT_META[id].sign` from `src/domain/contracts.ts`. This is the single source of truth for "is this contract positive or negative" — change it there, the rest of the code follows. The NewGame editor renders a static `−` glyph in front of inputs for negative-sign contracts so the displayed value matches what's applied. Input validation pins all magnitude fields to `min="0"` and stores `Math.abs(n)` on change.

When adding a new contract or changing a scoring formula:

1. Update `src/domain/types.ts` (ContractId, RoundEntry shape).
2. Update `src/config/scoringDefaults.ts` (default values + type).
3. Add a branch in `src/domain/scoring.ts` (pure function).
4. Add a branch in `src/domain/validation.ts`.
5. Add a branch in `src/ui/screens/RoundEntryScreen.tsx` (entry UI).
6. Add labels to **both** `src/i18n/locales/en.json` and `ro.json`.
7. Add unit tests in `tests/scoring.test.ts`.

## i18n

- Default language: English. Toggle for Romanian in the header.
- Storage key: `rentz.lang` in `localStorage` (also detected from browser).
- **When you add a UI string, add it to both `en.json` and `ro.json` in the same change.** Missing keys silently fall back to English.
- Contract `id`s are looked up via `contracts.<id>.label` / `.short` / `.kind` — never display the id itself.

## Commands

| Script             | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Vite dev server (HMR; PWA SW disabled in dev)        |
| `npm run build`    | `tsc -b && vite build` — typecheck + production bundle |
| `npm run preview`  | Serve the production build locally                   |
| `npm test`         | Vitest run (CI mode)                                 |
| `npm run test:watch` | Vitest watch mode                                  |
| `npm run lint`     | ESLint                                               |

## PWA gotchas

- The dev server does not register a real service worker; **test offline behavior with `npm run build && npm run preview`**.
- Icons live in `public/icons/` as SVGs (referenced from the manifest in `vite.config.ts`). They render fine on Android/Chrome/Edge "Add to Home Screen". iOS Safari may fall back to a default if SVG icons aren't picked up — replace with PNGs if iOS fidelity matters.
- `registerType: 'autoUpdate'` means a new SW activates as soon as it's installed. `App.tsx` shows a small "Update available — reload" banner; clicking it calls `updateSW(true)` which triggers a hard reload.
- The whole app is precached (Workbox `globPatterns`). There's no runtime caching because everything is local — no network requests at runtime.

## Verification flow before shipping a change

1. `npm test` — all green.
2. `npm run build` — succeeds.
3. `npm run preview` — open in the browser, start a 4-player game, play one round of every contract, confirm totals match the hand-computed reference.
4. Switch language EN ↔ RO mid-game; all labels update, totals/state are unchanged.
5. Export the game → import on a fresh profile → totals identical.
6. Throttle to offline (DevTools), reload — the app still loads and the game persists.

## Memory

This project has agent-specific memory under `~/.claude/projects/-Users-isvladu-Projects-rentz-scoring-app/memory/`. Two entries worth knowing about:

- `feedback-english-code-identifiers` — the English-only-identifiers rule above, with the rationale.
- `project-rentz-variant` — the canonical contract list and rules (the basis for this document).
