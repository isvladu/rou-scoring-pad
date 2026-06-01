import type { ContractId, ContractKind } from './types';

/**
 * Every contract is either positive (taker/winner gains points) or negative
 * (taker/loser is penalized). Scoring values in `ScoringConfig` are always
 * stored as non-negative magnitudes; the calculator applies the sign based on
 * this metadata.
 */
export type ContractSign = 'negative' | 'positive';

interface ContractMeta {
  id: ContractId;
  kind: ContractKind;
  sign: ContractSign;
  /**
   * Whether this contract can be picked "blind" (pe nevăzute).
   * Rentz is finishing-order ranking — the picker isn't committing to any
   * card-related performance, so declaring blind has no game-theoretic meaning.
   */
  canBeBlind: boolean;
}

export const CONTRACT_META: Record<ContractId, ContractMeta> = {
  noTricks: { id: 'noTricks', kind: 'counter', sign: 'negative', canBeBlind: true },
  noDiamonds: { id: 'noDiamonds', kind: 'counter', sign: 'negative', canBeBlind: true },
  noQueens: { id: 'noQueens', kind: 'counter', sign: 'negative', canBeBlind: true },
  noKingOfHearts: {
    id: 'noKingOfHearts',
    kind: 'singleTaker',
    sign: 'negative',
    canBeBlind: true,
  },
  tenOfClubs: { id: 'tenOfClubs', kind: 'singleTaker', sign: 'positive', canBeBlind: true },
  totals: { id: 'totals', kind: 'totals', sign: 'negative', canBeBlind: true },
  whist: { id: 'whist', kind: 'counter', sign: 'positive', canBeBlind: true },
  rentz: { id: 'rentz', kind: 'rentz', sign: 'positive', canBeBlind: false },
};

export function canBeBlind(contractId: ContractId): boolean {
  return CONTRACT_META[contractId].canBeBlind;
}

/** Applies the contract's sign to a magnitude pulled from `ScoringConfig`. */
export function signed(contractId: ContractId, value: number): number {
  return CONTRACT_META[contractId].sign === 'negative' ? -value : value;
}
