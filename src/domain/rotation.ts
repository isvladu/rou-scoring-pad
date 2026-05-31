import { ALL_CONTRACTS, type ContractId, type Player, type PlayerId, type Round } from './types';

export interface RotationState {
  totalRounds: number;
  roundsPlayed: number;
  isFinished: boolean;
  currentRoundIndex: number;
  currentDealerId: PlayerId | null;
  legalContracts: ContractId[];
  dealtByPlayer: Record<PlayerId, ContractId[]>;
}

export function computeRotation(players: Player[], rounds: Round[]): RotationState {
  const totalRounds = players.length * ALL_CONTRACTS.length;
  const roundsPlayed = rounds.length;
  const isFinished = roundsPlayed >= totalRounds;

  const dealtByPlayer: Record<PlayerId, ContractId[]> = Object.fromEntries(
    players.map((p) => [p.id, []]),
  );
  for (const r of rounds) {
    dealtByPlayer[r.dealerId]?.push(r.entry.contract);
  }

  if (isFinished) {
    return {
      totalRounds,
      roundsPlayed,
      isFinished,
      currentRoundIndex: roundsPlayed,
      currentDealerId: null,
      legalContracts: [],
      dealtByPlayer,
    };
  }

  const currentDealer = players[roundsPlayed % players.length];
  const dealt = new Set(dealtByPlayer[currentDealer.id] ?? []);
  const legal = ALL_CONTRACTS.filter((c) => !dealt.has(c));

  return {
    totalRounds,
    roundsPlayed,
    isFinished,
    currentRoundIndex: roundsPlayed,
    currentDealerId: currentDealer.id,
    legalContracts: legal,
    dealtByPlayer,
  };
}
