import type { Player, PlayerId } from '../../../core/types';
import type { RemiScoringConfig } from '../config/scoringDefaults';

export type { Player, PlayerId };

export type RemiPlayerCount = 2 | 3 | 4;
export const ALL_REMI_PLAYER_COUNTS: readonly RemiPlayerCount[] = [2, 3, 4] as const;

export interface RemiPerPlayerEntry {
  /** Did this player meld any tiles at all this hand? Drives the no-meld branch. */
  melded: boolean;
  /** Sum of values of tiles this player put on the table. 0 when !melded. */
  meldedValue: number;
  /** Sum of values of tiles left on this player's rack at hand end.
   *  Forced to 0 for the winner. */
  rackValue: number;
  /** This player was the first to lay a Joly into a meld. At most one
   *  player per hand. */
  jolyFirstMelded: boolean;
  /** This player ended the hand with a Joly remaining on their rack. */
  jolyOnRack: boolean;
  /** This player declared at hand start that they were dealt the tile
   *  identical to the initial-exposed-tile of the wall. */
  declaredIdenticalExposed: boolean;
}

export interface RemiHandEntry {
  /** Player who emptied their rack but for the discard. null = wall ran out
   *  with no winner — no winnerBonus given. */
  winnerId: PlayerId | null;
  /** Winner melded all 14 tiles at once with no prior meld. */
  selfWin: boolean;
  /** Winner's last tile discarded was a Joly. Drives the
   *  `doubleScoreOnJolyDiscardWin` house rule when enabled. */
  winnerDiscardedJoly: boolean;
  /** Per-player numerics and flags. */
  perPlayer: Record<PlayerId, RemiPerPlayerEntry>;
}

export interface RemiHand extends RemiHandEntry {
  /** 0-based index in Game.hands. */
  index: number;
  /** Per-player computed scores, persisted so summaries don't recompute. */
  scores: Record<PlayerId, number>;
  committedAt: string;
}

/** End condition picked when creating the game. */
export type RemiEndCondition =
  | { kind: 'targetScore'; targetScore: number }
  | { kind: 'handCount'; handCount: number };

export type RemiGameStatus = 'in_progress' | 'finished';

export interface RemiGame {
  id: string;
  createdAt: string;
  updatedAt: string;
  players: Player[];
  endCondition: RemiEndCondition;
  scoring: RemiScoringConfig;
  hands: RemiHand[];
  status: RemiGameStatus;
}

/** Per-player blank entry — used by the UI when initialising a hand form. */
export function blankPerPlayer(): RemiPerPlayerEntry {
  return {
    melded: true,
    meldedValue: 0,
    rackValue: 0,
    jolyFirstMelded: false,
    jolyOnRack: false,
    declaredIdenticalExposed: false,
  };
}
