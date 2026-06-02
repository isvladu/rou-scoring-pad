import { z } from 'zod';
import type { GameAdapter } from './gameAdapter';

/**
 * App-level "Scoring Pad" envelope that carries games of any supported
 * type, so a single backup can travel across devices and games:
 *
 *   {
 *     "format": "scoring-pad",
 *     "version": 1,
 *     "exportedAt": "...",
 *     "games": [
 *       { "gameType": "rentz", "schemaVersion": 1, "game": { ... } },
 *       { "gameType": "whist", "schemaVersion": 1, "game": { ... } }
 *     ]
 *   }
 *
 * Per-game legacy envelopes (`rentz-scoring-app`, `whist-scoring-app`) are
 * still accepted on import and are still what each game's `Export JSON`
 * button on the summary screen emits — only the landing "Export all" path
 * and the auto-detecting import path go through here.
 *
 * Layering note: this is the one place in `src/core/` that knows about
 * specific games. It does so via dynamic `import()`s of each game's
 * `storage/adapter.ts`, which keeps adapter code out of the landing chunk
 * (it loads only when the user clicks Export/Import). Other core
 * primitives (`createGamesRepo`, `triggerDownload`, `Scoreboard`, …) stay
 * strictly game-agnostic.
 */

const UnifiedGameRecord = z.object({
  gameType: z.string(),
  schemaVersion: z.number(),
  game: z.unknown(),
});

export const UnifiedEnvelope = z.object({
  format: z.literal('scoring-pad'),
  version: z.literal(1),
  exportedAt: z.string(),
  games: z.array(UnifiedGameRecord),
});

export type UnifiedEnvelopePayload = z.infer<typeof UnifiedEnvelope>;

/**
 * Pulls every registered game adapter via dynamic import. New games are
 * registered by adding a line here — there is no runtime auto-discovery.
 */
async function loadAdapters(): Promise<GameAdapter[]> {
  const [rentz, whist, phase10] = await Promise.all([
    import('../../games/rentz/storage/adapter'),
    import('../../games/whist/storage/adapter'),
    import('../../games/phase10/storage/adapter'),
  ]);
  return [rentz.adapter, whist.adapter, phase10.adapter];
}

/** Visible for tests so the same code path can be exercised with stub adapters. */
export async function exportAllAsUnifiedWith(
  adapters: GameAdapter[],
  now: () => string = () => new Date().toISOString(),
): Promise<string> {
  const games: Array<{ gameType: string; schemaVersion: number; game: unknown }> = [];
  for (const adapter of adapters) {
    const list = await adapter.listGames();
    for (const game of list) {
      games.push({
        gameType: adapter.gameType,
        schemaVersion: adapter.schemaVersion,
        game,
      });
    }
  }
  const payload: UnifiedEnvelopePayload = {
    format: 'scoring-pad',
    version: 1,
    exportedAt: now(),
    games,
  };
  return JSON.stringify(payload, null, 2);
}

export async function exportAllAsUnified(): Promise<string> {
  const adapters = await loadAdapters();
  return exportAllAsUnifiedWith(adapters);
}

export interface ImportResult {
  /** Total games imported across all game types. */
  totalImported: number;
  /** Per-game-type counts (e.g. `{ rentz: 3, whist: 2 }`). */
  perGameType: Record<string, number>;
  /** Which top-level format the payload turned out to be. */
  detectedFormat: 'scoring-pad' | string;
}

export async function importFromAnyFormatWith(
  adapters: GameAdapter[],
  json: string,
): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`, { cause: err });
  }

  const unified = UnifiedEnvelope.safeParse(parsed);
  if (unified.success) {
    return importUnified(unified.data, adapters);
  }

  for (const adapter of adapters) {
    const legacy = adapter.legacyEnvelopeSchema.safeParse(parsed);
    if (legacy.success) {
      for (const game of legacy.data.games) {
        await adapter.saveGame(game);
      }
      return {
        totalImported: legacy.data.games.length,
        perGameType: { [adapter.gameType]: legacy.data.games.length },
        detectedFormat: `${adapter.gameType}-scoring-app`,
      };
    }
  }

  throw new Error('Unrecognised export format — expected scoring-pad or a per-game envelope.');
}

export async function importFromAnyFormat(json: string): Promise<ImportResult> {
  const adapters = await loadAdapters();
  return importFromAnyFormatWith(adapters, json);
}

async function importUnified(
  env: UnifiedEnvelopePayload,
  adapters: GameAdapter[],
): Promise<ImportResult> {
  const byType = new Map(adapters.map((a) => [a.gameType, a]));
  const result: ImportResult = {
    totalImported: 0,
    perGameType: {},
    detectedFormat: 'scoring-pad',
  };
  for (const record of env.games) {
    const adapter = byType.get(record.gameType);
    if (!adapter) {
      throw new Error(`Unknown gameType "${record.gameType}" in unified payload.`);
    }
    const validated = adapter.gameSchema.parse(record.game);
    await adapter.saveGame(validated);
    result.totalImported += 1;
    result.perGameType[record.gameType] =
      (result.perGameType[record.gameType] ?? 0) + 1;
  }
  return result;
}
