import { ALL_CONTRACTS, type ContractId, type Player, type PlayerId, type Round } from './types';

export interface RotationState {
  totalRounds: number;
  roundsPlayed: number;
  isFinished: boolean;
  currentRoundIndex: number;
  /** The player whose turn it is to pick the contract and lead play. */
  currentPickerId: PlayerId | null;
  /** The player who deals the cards this round — the seat before the picker. */
  currentDealerId: PlayerId | null;
  legalContracts: ContractId[];
  /** For each player, the contracts they've already picked. */
  pickedByPlayer: Record<PlayerId, ContractId[]>;
}

/** Returns the seat immediately before `pickerId` (wraps around). */
export function dealerForPicker(players: Player[], pickerId: PlayerId): PlayerId {
  const i = players.findIndex((p) => p.id === pickerId);
  if (i < 0) throw new Error(`Unknown picker ${pickerId}`);
  return players[(i - 1 + players.length) % players.length].id;
}

export function computeRotation(players: Player[], rounds: Round[]): RotationState {
  const totalRounds = players.length * ALL_CONTRACTS.length;
  const roundsPlayed = rounds.length;
  const isFinished = roundsPlayed >= totalRounds;

  const pickedByPlayer: Record<PlayerId, ContractId[]> = Object.fromEntries(
    players.map((p) => [p.id, []]),
  );
  for (const r of rounds) {
    pickedByPlayer[r.pickerId]?.push(r.entry.contract);
  }

  if (isFinished) {
    return {
      totalRounds,
      roundsPlayed,
      isFinished,
      currentRoundIndex: roundsPlayed,
      currentPickerId: null,
      currentDealerId: null,
      legalContracts: [],
      pickedByPlayer,
    };
  }

  const picker = players[roundsPlayed % players.length];
  const dealerId = dealerForPicker(players, picker.id);
  const picked = new Set(pickedByPlayer[picker.id] ?? []);
  const legal = ALL_CONTRACTS.filter((c) => !picked.has(c));

  return {
    totalRounds,
    roundsPlayed,
    isFinished,
    currentRoundIndex: roundsPlayed,
    currentPickerId: picker.id,
    currentDealerId: dealerId,
    legalContracts: legal,
    pickedByPlayer,
  };
}
