import { create } from 'zustand';
import type {
  Player,
  PlayerId,
  RemiEndCondition,
  RemiGame,
  RemiHandEntry,
} from '../domain/types';
import { computeHandScores, totalScores } from '../domain/scoring';
import { isGameOver } from '../domain/endCondition';
import { validateHandEntry } from '../domain/validation';
import {
  cloneDefaultRemiScoring,
  type RemiScoringConfig,
} from '../config/scoringDefaults';
import { saveGame, getGame } from '../storage/gamesRepo';

interface RemiGameStore {
  active: RemiGame | null;
  loading: boolean;
  load(id: string): Promise<void>;
  startGame(
    players: Player[],
    endCondition: RemiEndCondition,
    scoring?: RemiScoringConfig,
  ): Promise<RemiGame>;
  commitHand(entry: RemiHandEntry): Promise<void>;
  undoLastHand(): Promise<void>;
  finish(): Promise<void>;
  clear(): void;
  totals(): Record<PlayerId, number>;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useRemiGameStore = create<RemiGameStore>((set, get) => ({
  active: null,
  loading: false,

  async load(id) {
    set({ loading: true });
    const g = await getGame(id);
    set({ active: g ?? null, loading: false });
  },

  async startGame(players, endCondition, scoring) {
    const playerCount = players.length;
    if (playerCount < 2 || playerCount > 4) {
      throw new Error(`Remi supports 2–4 players (got ${playerCount}).`);
    }
    const now = new Date().toISOString();
    const game: RemiGame = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      players,
      endCondition,
      scoring: scoring ?? cloneDefaultRemiScoring(),
      hands: [],
      status: 'in_progress',
    };
    await saveGame(game);
    set({ active: game });
    return game;
  },

  async commitHand(entry) {
    const game = get().active;
    if (!game) throw new Error('No active game');
    if (game.status === 'finished') {
      throw new Error('Game already finished');
    }
    const validation = validateHandEntry(entry, game.players);
    if (!validation.ok) {
      throw new Error(
        `Invalid hand entry: ${validation.errors.map((e) => e.code).join(', ')}`,
      );
    }
    const scores = computeHandScores(entry, game.players, game.scoring);
    const handIndex = game.hands.length;
    const updated: RemiGame = {
      ...game,
      hands: [
        ...game.hands,
        {
          index: handIndex,
          winnerId: entry.winnerId,
          selfWin: entry.selfWin,
          winnerDiscardedJoly: entry.winnerDiscardedJoly,
          perPlayer: { ...entry.perPlayer },
          scores,
          committedAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    const newTotals = totalScores(updated.players, updated.hands);
    if (isGameOver(updated, newTotals)) {
      updated.status = 'finished';
    }
    await saveGame(updated);
    set({ active: updated });
  },

  async undoLastHand() {
    const game = get().active;
    if (!game || game.hands.length === 0) return;
    const updated: RemiGame = {
      ...game,
      hands: game.hands.slice(0, -1),
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    };
    await saveGame(updated);
    set({ active: updated });
  },

  async finish() {
    const game = get().active;
    if (!game) return;
    const updated: RemiGame = {
      ...game,
      status: 'finished',
      updatedAt: new Date().toISOString(),
    };
    await saveGame(updated);
    set({ active: updated });
  },

  clear() {
    set({ active: null });
  },

  totals() {
    const g = get().active;
    if (!g) return {};
    return totalScores(g.players, g.hands);
  },
}));
