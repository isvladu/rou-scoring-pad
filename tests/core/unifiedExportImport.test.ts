import { describe, expect, it, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  exportAllAsUnifiedWith,
  importFromAnyFormatWith,
  UnifiedEnvelope,
} from '../../src/core/storage/unifiedExportImport';
import type { GameAdapter } from '../../src/core/storage/gameAdapter';
import { resetDbForTests as resetRentzDb } from '../../src/games/rentz/storage/db';
import { resetDbForTests as resetWhistDb } from '../../src/games/whist/storage/db';
import { adapter as rentzAdapter } from '../../src/games/rentz/storage/adapter';
import { adapter as whistAdapter } from '../../src/games/whist/storage/adapter';
import { cloneDefaultScoring } from '../../src/games/rentz/config/scoringDefaults';
import { cloneDefaultWhistScoring } from '../../src/games/whist/config/scoringDefaults';
import { generateSchedule } from '../../src/games/whist/domain/schedule';
import {
  serializeGames as serializeRentzGames,
} from '../../src/games/rentz/storage/exportImport';
import {
  serializeGames as serializeWhistGames,
} from '../../src/games/whist/storage/exportImport';
import type { Game as RentzGame } from '../../src/games/rentz/domain/types';
import type { WhistGame } from '../../src/games/whist/domain/types';

function sampleRentzGame(id: string): RentzGame {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    players: [
      { id: 'p1', name: 'Adi' },
      { id: 'p2', name: 'Mihai' },
      { id: 'p3', name: 'Dan' },
      { id: 'p4', name: 'Ioana' },
    ],
    scoring: cloneDefaultScoring(),
    rounds: [],
    rentzRefusals: [],
    status: 'in_progress',
  };
}

function sampleWhistGame(id: string): WhistGame {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    players: [
      { id: 'p1', name: 'Adi' },
      { id: 'p2', name: 'Mihai' },
      { id: 'p3', name: 'Dan' },
      { id: 'p4', name: 'Ioana' },
    ],
    schedule: generateSchedule(4),
    scoring: cloneDefaultWhistScoring(),
    rounds: [],
    status: 'in_progress',
  };
}

beforeEach(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = new (await import('fake-indexeddb/lib/FDBFactory')).default();
  resetRentzDb();
  resetWhistDb();
});

const adapters: GameAdapter[] = [rentzAdapter, whistAdapter];

describe('exportAllAsUnified', () => {
  it('emits a scoring-pad envelope with games from every adapter', async () => {
    await rentzAdapter.saveGame(sampleRentzGame('r1'));
    await whistAdapter.saveGame(sampleWhistGame('w1'));
    await whistAdapter.saveGame(sampleWhistGame('w2'));

    const json = await exportAllAsUnifiedWith(adapters, () => '2026-06-02T00:00:00.000Z');
    const parsed = JSON.parse(json);

    expect(parsed.format).toBe('scoring-pad');
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBe('2026-06-02T00:00:00.000Z');
    expect(parsed.games).toHaveLength(3);

    const types = parsed.games.map((g: { gameType: string }) => g.gameType).sort();
    expect(types).toEqual(['rentz', 'whist', 'whist']);

    // Each record has the right shape
    for (const rec of parsed.games) {
      expect(rec).toMatchObject({
        gameType: expect.any(String),
        schemaVersion: expect.any(Number),
        game: expect.any(Object),
      });
    }

    // Envelope itself round-trips through the Zod schema
    expect(UnifiedEnvelope.safeParse(parsed).success).toBe(true);
  });

  it('emits a well-formed envelope when no games exist', async () => {
    const json = await exportAllAsUnifiedWith(adapters);
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe('scoring-pad');
    expect(parsed.games).toEqual([]);
  });
});

describe('importFromAnyFormat — unified envelope', () => {
  it('round-trips: export → import → games re-appear in each store', async () => {
    await rentzAdapter.saveGame(sampleRentzGame('r1'));
    await whistAdapter.saveGame(sampleWhistGame('w1'));

    const json = await exportAllAsUnifiedWith(adapters);

    // Wipe stores and re-import.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).indexedDB = new (await import('fake-indexeddb/lib/FDBFactory')).default();
    resetRentzDb();
    resetWhistDb();

    const result = await importFromAnyFormatWith(adapters, json);
    expect(result.detectedFormat).toBe('scoring-pad');
    expect(result.totalImported).toBe(2);
    expect(result.perGameType).toEqual({ rentz: 1, whist: 1 });

    const rentzList = (await rentzAdapter.listGames()) as RentzGame[];
    const whistList = (await whistAdapter.listGames()) as WhistGame[];
    expect(rentzList.map((g) => g.id)).toEqual(['r1']);
    expect(whistList.map((g) => g.id)).toEqual(['w1']);
  });

  it('rejects unified payload referencing an unknown game type', async () => {
    const payload = {
      format: 'scoring-pad',
      version: 1,
      exportedAt: new Date().toISOString(),
      games: [{ gameType: 'phase10', schemaVersion: 1, game: { foo: 'bar' } }],
    };
    await expect(
      importFromAnyFormatWith(adapters, JSON.stringify(payload)),
    ).rejects.toThrow(/Unknown gameType "phase10"/);
  });
});

describe('importFromAnyFormat — legacy per-game envelopes', () => {
  it('accepts a legacy rentz-scoring-app payload and saves to the rentz store', async () => {
    const legacy = serializeRentzGames([sampleRentzGame('r1'), sampleRentzGame('r2')]);
    const result = await importFromAnyFormatWith(adapters, legacy);
    expect(result.detectedFormat).toBe('rentz-scoring-app');
    expect(result.totalImported).toBe(2);
    expect(result.perGameType).toEqual({ rentz: 2 });
    const list = (await rentzAdapter.listGames()) as RentzGame[];
    expect(list.map((g) => g.id).sort()).toEqual(['r1', 'r2']);
  });

  it('accepts a legacy whist-scoring-app payload and saves to the whist store', async () => {
    const legacy = serializeWhistGames([sampleWhistGame('w1')]);
    const result = await importFromAnyFormatWith(adapters, legacy);
    expect(result.detectedFormat).toBe('whist-scoring-app');
    expect(result.totalImported).toBe(1);
    expect(result.perGameType).toEqual({ whist: 1 });
    const list = (await whistAdapter.listGames()) as WhistGame[];
    expect(list.map((g) => g.id)).toEqual(['w1']);
  });
});

describe('importFromAnyFormat — error cases', () => {
  it('rejects garbage text', async () => {
    await expect(importFromAnyFormatWith(adapters, 'not json')).rejects.toThrow(/Invalid JSON/);
  });

  it('rejects a JSON payload that matches no known format', async () => {
    await expect(
      importFromAnyFormatWith(
        adapters,
        JSON.stringify({ format: 'something-else', version: 1, games: [] }),
      ),
    ).rejects.toThrow(/Unrecognised export format/);
  });
});

describe('GameAdapter contract — stub adapter exercises the same code path', () => {
  it('allows new game types to be added by registering a new adapter', async () => {
    const StubGame = z.object({ id: z.string(), label: z.string() });
    const StubEnvelope = z.object({
      format: z.literal('stub-scoring-app'),
      games: z.array(StubGame),
    });

    type StubGameT = z.infer<typeof StubGame>;
    const saved: StubGameT[] = [];
    const stubAdapter: GameAdapter = {
      gameType: 'stub',
      schemaVersion: 1,
      gameSchema: StubGame,
      legacyEnvelopeSchema: StubEnvelope,
      listGames: async () => saved,
      saveGame: async (g) => {
        saved.push(g as StubGameT);
      },
    };

    const unified = await exportAllAsUnifiedWith([stubAdapter, rentzAdapter]);
    const parsed = JSON.parse(unified);
    expect(parsed.games).toEqual([]);

    saved.push({ id: 's1', label: 'hello' });
    const reExport = await exportAllAsUnifiedWith([stubAdapter]);
    const reParsed = JSON.parse(reExport);
    expect(reParsed.games).toEqual([
      { gameType: 'stub', schemaVersion: 1, game: { id: 's1', label: 'hello' } },
    ]);
  });
});
