import type { ScoringConfig } from '../config/scoringDefaults';
import type { Player, PlayerId } from '../../../core/types';

export type { Player, PlayerId };

export type PlayerCount = 4 | 5 | 6;

export type ContractId =
  | 'noTricks'
  | 'noDiamonds'
  | 'noQueens'
  | 'noKingOfHearts'
  | 'tenOfClubs'
  | 'totals'
  | 'whist'
  | 'rentz';

export const ALL_CONTRACTS: readonly ContractId[] = [
  'noTricks',
  'noDiamonds',
  'noQueens',
  'noKingOfHearts',
  'tenOfClubs',
  'totals',
  'whist',
  'rentz',
] as const;

export type ContractKind = 'counter' | 'singleTaker' | 'totals' | 'rentz';

export type RoundEntry =
  | {
      contract: 'noTricks' | 'noDiamonds' | 'noQueens' | 'whist';
      counts: Record<PlayerId, number>;
    }
  | {
      contract: 'noKingOfHearts' | 'tenOfClubs';
      takerId: PlayerId;
    }
  | {
      contract: 'totals';
      tricks: Record<PlayerId, number>;
      diamonds: Record<PlayerId, number>;
      queens: Record<PlayerId, number>;
      kingOfHeartsTakerId: PlayerId;
    }
  | {
      contract: 'rentz';
      finishingOrder: PlayerId[];
    };

export interface Round {
  index: number;
  /** The player whose turn it is to pick the contract and lead play. */
  pickerId: PlayerId;
  entry: RoundEntry;
  /** True if the picker declared blind ("pe nevăzute") before seeing the cards. */
  blind: boolean;
  scores: Record<PlayerId, number>;
  committedAt: string;
}

export type GameStatus = 'in_progress' | 'finished';

/**
 * A single recorded Rentz refusal. The picker had selected Rentz; another
 * player declined, the cards were shuffled, and the picker had to pick again.
 * No `Round` is committed for a refused attempt — only this event.
 */
export interface RentzRefusal {
  pickerId: PlayerId;
  refuserId: PlayerId;
  occurredAt: string;
}

export interface Game {
  id: string;
  createdAt: string;
  updatedAt: string;
  players: Player[];
  scoring: ScoringConfig;
  rounds: Round[];
  rentzRefusals: RentzRefusal[];
  status: GameStatus;
}

export const DECK_SIZE_BY_PLAYER_COUNT: Record<PlayerCount, number> = {
  4: 32,
  5: 40,
  6: 48,
};

export const TRICKS_PER_HAND = 8;

export function diamondsInDeck(playerCount: PlayerCount): number {
  return DECK_SIZE_BY_PLAYER_COUNT[playerCount] / 4;
}

export const QUEENS_IN_DECK = 4;
