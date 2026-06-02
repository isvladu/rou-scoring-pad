import type { Player, PlayerId } from '../../../core/types';
import type { Phase10ScoringConfig } from '../config/scoringDefaults';

export type { Player, PlayerId };

export type Phase10PlayerCount = 2 | 3 | 4 | 5 | 6;
export const ALL_PHASE10_PLAYER_COUNTS: readonly Phase10PlayerCount[] = [
  2, 3, 4, 5, 6,
] as const;

/** Phases 1..10. Higher means "completed more phases" — once a player's
 *  count exceeds 10, they've cleared all of them. */
export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export const ALL_PHASES: readonly PhaseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export interface Phase10HandEntry {
  /** The single player who played out all their cards this hand. */
  wentOutId: PlayerId;
  /** Sum of penalty points each player has left in hand at end of hand.
   *  remainingPenalty[wentOutId] MUST be 0 (enforced by validation). */
  remainingPenalty: Record<PlayerId, number>;
  /** Did this player complete their CURRENT phase this hand? The wentOut
   *  player implicitly has true (they finished their phase + emptied hand);
   *  other players who managed to meld their phase but had cards left also
   *  count as true. */
  completedPhase: Record<PlayerId, boolean>;
}

export interface Phase10Hand extends Phase10HandEntry {
  /** 0-based index in Game.hands. */
  index: number;
  committedAt: string;
}

export type Phase10GameStatus = 'in_progress' | 'finished';

export interface Phase10Game {
  id: string;
  createdAt: string;
  updatedAt: string;
  players: Player[];
  scoring: Phase10ScoringConfig;
  hands: Phase10Hand[];
  status: Phase10GameStatus;
}
