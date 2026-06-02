import { create } from 'zustand';
import type { Game, Player, PlayerId, RoundEntry } from '../domain/types';
import { computeRotation, type RotationState } from '../domain/rotation';
import { computeRoundScores, totalScores } from '../domain/scoring';
import { validateRoundEntry } from '../domain/validation';
import { canBeBlind } from '../domain/contracts';
import { cloneDefaultScoring, type ScoringConfig } from '../config/scoringDefaults';
import { saveGame, getGame } from '../storage/gamesRepo';

interface GameStore {
  active: Game | null;
  loading: boolean;
  load(id: string): Promise<void>;
  startGame(players: Player[], scoring?: ScoringConfig): Promise<Game>;
  commitRound(entry: RoundEntry, options?: { blind?: boolean }): Promise<void>;
  recordRentzRefusal(refuserId: PlayerId): Promise<void>;
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
      rentzRefusals: [],
      status: 'in_progress',
    };
    await saveGame(game);
    set({ active: game });
    return game;
  },

  async recordRentzRefusal(refuserId) {
    const game = get().active;
    if (!game) throw new Error('No active game');
    const rotation = computeRotation(game.players, game.rounds);
    if (!rotation.currentPickerId) throw new Error('Game already finished');
    if (refuserId === rotation.currentPickerId) {
      throw new Error('Picker cannot refuse their own Rentz');
    }
    const refusal = {
      pickerId: rotation.currentPickerId,
      refuserId,
      occurredAt: new Date().toISOString(),
    };
    console.log('[rentz/refusal] recorded', refusal);
    const updated: Game = {
      ...game,
      rentzRefusals: [...game.rentzRefusals, refusal],
      updatedAt: new Date().toISOString(),
    };
    await saveGame(updated);
    set({ active: updated });
  },

  async commitRound(entry, options = {}) {
    const game = get().active;
    if (!game) throw new Error('No active game');
    const validation = validateRoundEntry(entry, game.players);
    if (!validation.ok) {
      throw new Error(`Invalid round entry: ${validation.errors.map((e) => e.code).join(', ')}`);
    }
    const rotation = computeRotation(game.players, game.rounds);
    if (!rotation.currentPickerId) throw new Error('Game already finished');
    const blind = options.blind === true;
    if (blind && !canBeBlind(entry.contract)) {
      throw new Error(`Contract "${entry.contract}" cannot be played blind`);
    }
    const scores = computeRoundScores(entry, game.players, game.scoring, blind);
    const updated: Game = {
      ...game,
      rounds: [
        ...game.rounds,
        {
          index: rotation.currentRoundIndex,
          pickerId: rotation.currentPickerId,
          entry,
          blind,
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
