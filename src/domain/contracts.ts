import type { ContractId, ContractKind } from './types';

interface ContractMeta {
  id: ContractId;
  kind: ContractKind;
  sign: 'negative' | 'positive' | 'mixed';
}

export const CONTRACT_META: Record<ContractId, ContractMeta> = {
  noTricks: { id: 'noTricks', kind: 'counter', sign: 'negative' },
  noDiamonds: { id: 'noDiamonds', kind: 'counter', sign: 'negative' },
  noQueens: { id: 'noQueens', kind: 'counter', sign: 'negative' },
  noKingOfHearts: { id: 'noKingOfHearts', kind: 'singleTaker', sign: 'negative' },
  tenOfClubs: { id: 'tenOfClubs', kind: 'singleTaker', sign: 'positive' },
  totals: { id: 'totals', kind: 'totals', sign: 'negative' },
  whist: { id: 'whist', kind: 'counter', sign: 'mixed' },
  rentz: { id: 'rentz', kind: 'rentz', sign: 'mixed' },
};
