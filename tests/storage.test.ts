import { describe, expect, it, beforeEach } from 'vitest';
import { deleteGame, getGame, listGames, saveGame } from '../src/storage/gamesRepo';
import { resetDbForTests } from '../src/storage/db';
import { cloneDefaultScoring } from '../src/config/scoringDefaults';
import type { Game } from '../src/domain/types';
import { importGamesFromJson, serializeGames } from '../src/storage/exportImport';

function sampleGame(id: string): Game {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    players: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
      { id: 'p3', name: 'Cora' },
      { id: 'p4', name: 'Dan' },
    ],
    scoring: cloneDefaultScoring(),
    rounds: [],
    rentzRefusals: [],
    status: 'in_progress',
  };
}

beforeEach(async () => {
  // Wipe fake IndexedDB between tests.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = new (await import('fake-indexeddb/lib/FDBFactory')).default();
  resetDbForTests();
});

describe('gamesRepo', () => {
  it('saves and reads a game by id', async () => {
    const g = sampleGame('g1');
    await saveGame(g);
    const got = await getGame('g1');
    expect(got?.id).toBe('g1');
    expect(got?.players).toHaveLength(4);
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

describe('export/import roundtrip', () => {
  it('preserves all games through serialize → parse → import', async () => {
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
      importGamesFromJson(JSON.stringify({ format: 'something-else', version: 1, games: [] })),
    ).rejects.toThrow();
  });
});
