import { describe, expect, it, beforeEach } from 'vitest';
import { deleteGame, getGame, listGames, saveGame } from '../../../src/games/whist/storage/gamesRepo';
import { resetDbForTests } from '../../../src/games/whist/storage/db';
import { cloneDefaultWhistScoring } from '../../../src/games/whist/config/scoringDefaults';
import { generateSchedule } from '../../../src/games/whist/domain/schedule';
import type { WhistGame } from '../../../src/games/whist/domain/types';
import { importGamesFromJson, serializeGames } from '../../../src/games/whist/storage/exportImport';

function sampleGame(id: string): WhistGame {
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
  // Wipe fake IndexedDB between tests.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = new (await import('fake-indexeddb/lib/FDBFactory')).default();
  resetDbForTests();
});

describe('whist gamesRepo', () => {
  it('saves and reads a game by id', async () => {
    await saveGame(sampleGame('g1'));
    const got = await getGame('g1');
    expect(got?.id).toBe('g1');
    expect(got?.schedule).toHaveLength(24);
  });

  it('lists games sorted by most recently updated', async () => {
    await saveGame(sampleGame('g1'));
    await new Promise((r) => setTimeout(r, 5));
    await saveGame(sampleGame('g2'));
    const list = await listGames();
    expect(list.map((g) => g.id)).toEqual(['g2', 'g1']);
  });

  it('deletes a game', async () => {
    await saveGame(sampleGame('g1'));
    await deleteGame('g1');
    expect(await getGame('g1')).toBeUndefined();
  });
});

describe('whist export/import roundtrip', () => {
  it('preserves games through serialize → parse → import', async () => {
    const g1 = sampleGame('g1');
    const g2 = sampleGame('g2');
    const json = serializeGames([g1, g2]);
    const count = await importGamesFromJson(json);
    expect(count).toBe(2);
    expect((await getGame('g1'))?.id).toBe('g1');
    expect((await getGame('g2'))?.id).toBe('g2');
  });

  it('rejects payloads with the wrong format tag', async () => {
    await expect(
      importGamesFromJson(JSON.stringify({ format: 'rentz-scoring-app', version: 1, games: [] })),
    ).rejects.toThrow();
  });
});
