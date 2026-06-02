import type { Player, PlayerId } from '../../../core/types';
import type { WhistScoringConfig } from '../config/scoringDefaults';

export type { Player, PlayerId };

export type WhistPlayerCount = 3 | 4 | 5 | 6;
export const ALL_WHIST_PLAYER_COUNTS: readonly WhistPlayerCount[] = [3, 4, 5, 6] as const;

export interface WhistRoundEntry {
  /** Per-player bid (0..handSize). */
  bids: Record<PlayerId, number>;
  /** Per-player tricks taken (0..handSize). Must sum to handSize. */
  tricks: Record<PlayerId, number>;
}

export interface WhistRound {
  /** 0-based index into Game.schedule. */
  index: number;
  /** Hand size for this round (1..8), denormalised from the schedule. */
  handSize: number;
  /** Player who picks/leads first this round. Rotates by index. */
  pickerId: PlayerId;
  entry: WhistRoundEntry;
  scores: Record<PlayerId, number>;
  committedAt: string;
}

export type WhistGameStatus = 'in_progress' | 'finished';

export interface WhistGame {
  id: string;
  createdAt: string;
  updatedAt: string;
  players: Player[];
  /** Generated schedule of hand sizes per round, length = 3N + 12. */
  schedule: number[];
  scoring: WhistScoringConfig;
  rounds: WhistRound[];
  status: WhistGameStatus;
}
