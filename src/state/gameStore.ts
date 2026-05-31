import { create } from 'zustand';
import type { Game, Player, RoundEntry } from '../domain/types';
import { computeRotation, type RotationState } from '../domain/rotation';
import { computeRoundScores, totalScores } from '../domain/scoring';
import { validateRoundEntry } from '../domain/validation';
import { cloneDefaultScoring, type ScoringConfig } from '../config/scoringDefaults';
import { saveGame, getGame } from '../storage/gamesRepo';

interface GameStore {
  active: Game | null;
  loading: boolean;
  load(id: string): Promise<void>;
  startGame(players: Player[], scoring?: ScoringConfig): Promise<Game>;
  commitRound(entry: RoundEntry): Promise<void>;
  undoLastRound(): Promise<void>;
  finish(): Promise<void>;
  clear(): void;
  rotation(): RotationState | null;
  totals(): Record<string, number>;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useGameStore = create<GameStore>((set, get) => ({
  active: null,
  loading: false,

  async load(id) {
    set({ loading: true });
    const g = await getGame(id);
    set({ active: g ?? null, loading: false });
  },

  async startGame(players, scoring) {
    const now = new Date().toISOString();
    const game: Game = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      players,
      scoring: scoring ?? cloneDefaultScoring(),
      rounds: [],
      status: 'in_progress',
    };
    await saveGame(game);
    set({ active: game });
    return game;
  },

  async commitRound(entry) {
    const game = get().active;
    if (!game) throw new Error('No active game');
    const validation = validateRoundEntry(entry, game.players);
    if (!validation.ok) {
      throw new Error(validation.errors.join(' '));
    }
    const rotation = computeRotation(game.players, game.rounds);
    if (!rotation.currentDealerId) throw new Error('Game already finished');
    const scores = computeRoundScores(entry, game.players, game.scoring);
    const updated: Game = {
      ...game,
      rounds: [
        ...game.rounds,
        {
          index: rotation.currentRoundIndex,
          dealerId: rotation.currentDealerId,
          entry,
          scores,
          committedAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    const finished = updated.rounds.length >= rotation.totalRounds;
    if (finished) updated.status = 'finished';
    await saveGame(updated);
    set({ active: updated });
  },

  async undoLastRound() {
    const game = get().active;
    if (!game || game.rounds.length === 0) return;
    const updated: Game = {
      ...game,
      rounds: game.rounds.slice(0, -1),
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    };
    await saveGame(updated);
    set({ active: updated });
  },

  async finish() {
    const game = get().active;
    if (!game) return;
    const updated: Game = { ...game, status: 'finished', updatedAt: new Date().toISOString() };
    await saveGame(updated);
    set({ active: updated });
  },

  clear() {
    set({ active: null });
  },

  rotation() {
    const g = get().active;
    if (!g) return null;
    return computeRotation(g.players, g.rounds);
  },

  totals() {
    const g = get().active;
    if (!g) return {};
    return totalScores(g.players, g.rounds);
  },
}));
