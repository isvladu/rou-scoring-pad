import {
  diamondsInDeck,
  QUEENS_IN_DECK,
  TRICKS_PER_HAND,
  type Player,
  type PlayerCount,
  type PlayerId,
  type RoundEntry,
} from './types';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function sumOf(counts: Record<PlayerId, number>, players: Player[]): number {
  return players.reduce((acc, p) => acc + (counts[p.id] ?? 0), 0);
}

function nonNegative(counts: Record<PlayerId, number>, players: Player[]): boolean {
  return players.every((p) => (counts[p.id] ?? 0) >= 0 && Number.isInteger(counts[p.id] ?? 0));
}

function validateCounter(
  counts: Record<PlayerId, number>,
  players: Player[],
  expected: number,
  label: string,
): ValidationResult {
  const errors: string[] = [];
  if (!nonNegative(counts, players)) {
    errors.push(`${label} counts must be non-negative integers.`);
  }
  const sum = sumOf(counts, players);
  if (sum !== expected) {
    errors.push(`${label} sum must equal ${expected}, got ${sum}.`);
  }
  return { ok: errors.length === 0, errors };
}

function validateTaker(
  takerId: PlayerId | undefined,
  players: Player[],
  label: string,
): ValidationResult {
  const errors: string[] = [];
  if (!takerId || !players.some((p) => p.id === takerId)) {
    errors.push(`${label}: pick exactly one player.`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateRoundEntry(
  entry: RoundEntry,
  players: Player[],
): ValidationResult {
  const playerCount = players.length as PlayerCount;
  switch (entry.contract) {
    case 'noTricks':
    case 'whist':
      return validateCounter(entry.counts, players, TRICKS_PER_HAND, 'Tricks');
    case 'noDiamonds':
      return validateCounter(entry.counts, players, diamondsInDeck(playerCount), 'Diamonds');
    case 'noQueens':
      return validateCounter(entry.counts, players, QUEENS_IN_DECK, 'Queens');
    case 'noKingOfHearts':
    case 'tenOfClubs':
      return validateTaker(entry.takerId, players, 'Taker');
    case 'totals': {
      const tricks = validateCounter(entry.tricks, players, TRICKS_PER_HAND, 'Tricks');
      const diamonds = validateCounter(
        entry.diamonds,
        players,
        diamondsInDeck(playerCount),
        'Diamonds',
      );
      const queens = validateCounter(entry.queens, players, QUEENS_IN_DECK, 'Queens');
      const king = validateTaker(entry.kingOfHeartsTakerId, players, 'King of Hearts');
      const errors = [...tricks.errors, ...diamonds.errors, ...queens.errors, ...king.errors];
      return { ok: errors.length === 0, errors };
    }
    case 'rentz': {
      const errors: string[] = [];
      if (entry.finishingOrder.length !== players.length) {
        errors.push(`Rank all ${players.length} players.`);
      }
      const uniq = new Set(entry.finishingOrder);
      if (uniq.size !== entry.finishingOrder.length) {
        errors.push('Each player can appear only once.');
      }
      for (const pid of entry.finishingOrder) {
        if (!players.some((p) => p.id === pid)) {
          errors.push(`Unknown player ${pid}.`);
          break;
        }
      }
      return { ok: errors.length === 0, errors };
    }
  }
}
