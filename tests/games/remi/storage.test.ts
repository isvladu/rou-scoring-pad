import { describe, expect, it, beforeEach } from 'vitest';
import {
  deleteGame,
  getGame,
  listGames,
  saveGame,
} from '../../../src/games/remi/storage/gamesRepo';
import { resetDbForTests } from '../../../src/games/remi/storage/db';
import { cloneDefaultRemiScoring } from '../../../src/games/remi/config/scoringDefaults';
import type { RemiGame } from '../../../src/games/remi/domain/types';
import {
  importGamesFromJson,
  serializeGames,
} from '../../../src/games/remi/storage/exportImport';

function sampleGame(id: string): RemiGame {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    players: [
      { id: 'p1', name: 'Adi' },
      { id: 'p2', name: 'Mihai' },
      { id: 'p3', name: 'Dan' },
    ],
    endCondition: { kind: 'targetScore', targetScore: 1000 },
    scoring: cloneDefaultRemiScoring(),
    hands: [],
    status: 'in_progress',
  };
}

beforeEach(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = new (await import('fake-indexeddb/lib/FDBFactory')).default();
  resetDbForTests();
});

describe('remi gamesRepo', () => {
  it('saves and reads a game by id', async () => {
    await saveGame(sampleGame('g1'));
    const got = await getGame('g1');
    expect(got?.id).toBe('g1');
    expect(got?.endCondition.kind).toBe('targetScore');
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

describe('remi export/import roundtrip', () => {
  it('preserves games through serialize → parse → import', async () => {
    const g1 = sampleGame('g1');
    const g2: RemiGame = {
      ...sampleGame('g2'),
      endCondition: { kind: 'handCount', handCount: 12 },
    };
    const json = serializeGames([g1, g2]);
    const count = await importGamesFromJson(json);
    expect(count).toBe(2);
    expect((await getGame('g1'))?.endCondition.kind).toBe('targetScore');
    expect((await getGame('g2'))?.endCondition.kind).toBe('handCount');
  });

  it('rejects payloads with the wrong format tag', async () => {
    await expect(
      importGamesFromJson(
        JSON.stringify({ format: 'rentz-scoring-app', version: 1, exportedAt: 'x', games: [] }),
      ),
    ).rejects.toThrow();
  });
});
