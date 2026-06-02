import { describe, expect, it, beforeEach } from 'vitest';
import {
  deleteGame,
  getGame,
  listGames,
  saveGame,
} from '../../../src/games/phase10/storage/gamesRepo';
import { resetDbForTests } from '../../../src/games/phase10/storage/db';
import { cloneDefaultPhase10Scoring } from '../../../src/games/phase10/config/scoringDefaults';
import type { Phase10Game } from '../../../src/games/phase10/domain/types';
import {
  importGamesFromJson,
  serializeGames,
} from '../../../src/games/phase10/storage/exportImport';

function sampleGame(id: string): Phase10Game {
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
    scoring: cloneDefaultPhase10Scoring(),
    hands: [],
    status: 'in_progress',
  };
}

beforeEach(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = new (await import('fake-indexeddb/lib/FDBFactory')).default();
  resetDbForTests();
});

describe('phase10 gamesRepo', () => {
  it('saves and reads a game by id', async () => {
    await saveGame(sampleGame('g1'));
    const got = await getGame('g1');
    expect(got?.id).toBe('g1');
    expect(got?.scoring.penaltyWild).toBe(25);
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

describe('phase10 export/import roundtrip', () => {
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
      importGamesFromJson(
        JSON.stringify({
          format: 'rentz-scoring-app',
          version: 1,
          exportedAt: 'x',
          games: [],
        }),
      ),
    ).rejects.toThrow();
  });
});
