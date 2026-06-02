import { create } from 'zustand';
import type {
  Player,
  PlayerId,
  WhistGame,
  WhistRoundEntry,
} from '../domain/types';
import { generateSchedule, dealerForRound, pickerForRound } from '../domain/schedule';
import { computeRoundScores, totalScores } from '../domain/scoring';
import { validateRoundEntry } from '../domain/validation';
import {
  cloneDefaultWhistScoring,
  type WhistScoringConfig,
} from '../config/scoringDefaults';
import { saveGame, getGame } from '../storage/gamesRepo';

export interface WhistRoundInfo {
  roundIndex: number;
  totalRounds: number;
  handSize: number;
  pickerId: PlayerId;
  dealerId: PlayerId;
}

interface WhistGameStore {
  active: WhistGame | null;
  loading: boolean;
  load(id: string): Promise<void>;
  startGame(players: Player[], scoring?: WhistScoringConfig): Promise<WhistGame>;
  commitRound(entry: WhistRoundEntry): Promise<void>;
  undoLastRound(): Promise<void>;
  finish(): Promise<void>;
  clear(): void;
  currentRoundInfo(): WhistRoundInfo | null;
  totals(): Record<string, number>;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useWhistGameStore = create<WhistGameStore>((set, get) => ({
  active: null,
  loading: false,

  async load(id) {
    set({ loading: true });
    const g = await getGame(id);
    set({ active: g ?? null, loading: false });
  },

  async startGame(players, scoring) {
    const now = new Date().toISOString();
    const playerCount = players.length;
    if (playerCount < 4 || playerCount > 6) {
      throw new Error(`Whist supports 4-6 players (got ${playerCount}).`);
    }
    const game: WhistGame = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      players,
      schedule: generateSchedule(playerCount as 4 | 5 | 6),
      scoring: scoring ?? cloneDefaultWhistScoring(),
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
    const roundIndex = game.rounds.length;
    if (roundIndex >= game.schedule.length) {
      throw new Error('Game already finished');
    }
    const handSize = game.schedule[roundIndex];
    const validation = validateRoundEntry(entry, handSize, game.players, game.scoring);
    if (!validation.ok) {
      throw new Error(`Invalid round entry: ${validation.errors.map((e) => e.code).join(', ')}`);
    }
    const picker = pickerForRound(roundIndex, game.players);
    const scores = computeRoundScores(entry, handSize, game.players, game.scoring);
    const updated: WhistGame = {
      ...game,
      rounds: [
        ...game.rounds,
        {
          index: roundIndex,
          handSize,
          pickerId: picker.id,
          entry,
          scores,
          committedAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    if (updated.rounds.length >= updated.schedule.length) {
      updated.status = 'finished';
    }
    await saveGame(updated);
    set({ active: updated });
  },

  async undoLastRound() {
    const game = get().active;
    if (!game || game.rounds.length === 0) return;
    const updated: WhistGame = {
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
    const updated: WhistGame = {
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

  currentRoundInfo() {
    const g = get().active;
    if (!g) return null;
    const roundIndex = g.rounds.length;
    if (roundIndex >= g.schedule.length) return null;
    return {
      roundIndex,
      totalRounds: g.schedule.length,
      handSize: g.schedule[roundIndex],
      pickerId: pickerForRound(roundIndex, g.players).id,
      dealerId: dealerForRound(roundIndex, g.players).id,
    };
  },

  totals() {
    const g = get().active;
    if (!g) return {};
    return totalScores(g.players, g.rounds);
  },
}));
