import { create } from 'zustand';
import type {
  Player,
  PlayerId,
  Phase10Game,
  Phase10HandEntry,
} from '../domain/types';
import { computeHandScores, totalScores } from '../domain/scoring';
import {
  currentPhase as currentPhaseOf,
  isGameOver,
} from '../domain/phases';
import { validateHandEntry } from '../domain/validation';
import {
  cloneDefaultPhase10Scoring,
  type Phase10ScoringConfig,
} from '../config/scoringDefaults';
import { saveGame, getGame } from '../storage/gamesRepo';

interface Phase10GameStore {
  active: Phase10Game | null;
  loading: boolean;
  load(id: string): Promise<void>;
  startGame(
    players: Player[],
    scoring?: Phase10ScoringConfig,
  ): Promise<Phase10Game>;
  commitHand(entry: Phase10HandEntry): Promise<void>;
  undoLastHand(): Promise<void>;
  finish(): Promise<void>;
  clear(): void;
  /** Current phase (1..11) for every player given the active game. */
  phases(): Record<PlayerId, number>;
  totals(): Record<PlayerId, number>;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const usePhase10GameStore = create<Phase10GameStore>((set, get) => ({
  active: null,
  loading: false,

  async load(id) {
    set({ loading: true });
    const g = await getGame(id);
    set({ active: g ?? null, loading: false });
  },

  async startGame(players, scoring) {
    const playerCount = players.length;
    if (playerCount < 2 || playerCount > 6) {
      throw new Error(`Phase 10 supports 2–6 players (got ${playerCount}).`);
    }
    const now = new Date().toISOString();
    const game: Phase10Game = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      players,
      scoring: scoring ?? cloneDefaultPhase10Scoring(),
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

    // The wentOut player implicitly completes their current phase.
    const completedPhase = {
      ...entry.completedPhase,
      [entry.wentOutId]: true,
    };
    // Score the hand to verify (we don't store per-player hand scores; they
    // are derived via computeHandScores). We still validate it doesn't throw.
    computeHandScores({ ...entry, completedPhase }, game.players);

    const handIndex = game.hands.length;
    const updated: Phase10Game = {
      ...game,
      hands: [
        ...game.hands,
        {
          index: handIndex,
          wentOutId: entry.wentOutId,
          remainingPenalty: { ...entry.remainingPenalty },
          completedPhase,
          committedAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    if (isGameOver(updated)) {
      updated.status = 'finished';
    }
    await saveGame(updated);
    set({ active: updated });
  },

  async undoLastHand() {
    const game = get().active;
    if (!game || game.hands.length === 0) return;
    const updated: Phase10Game = {
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
    const updated: Phase10Game = {
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

  phases() {
    const g = get().active;
    if (!g) return {};
    const out: Record<PlayerId, number> = {};
    for (const p of g.players) {
      out[p.id] = currentPhaseOf(p.id, g.hands);
    }
    return out;
  },

  totals() {
    const g = get().active;
    if (!g) return {};
    return totalScores(g.players, g.hands);
  },
}));
