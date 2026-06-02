import { useTranslation } from 'react-i18next';
import type { Player, PlayerId } from '../../domain/types';

interface Props {
  players: Player[];
  values: Record<PlayerId, number>;
  /** Maximum per-player bid (= hand size). */
  maxPerPlayer: number;
  /** When sum equals this value, show a warning (dealer constraint). */
  forbiddenSum: number | null;
  onChange(values: Record<PlayerId, number>): void;
  label?: string;
}

/**
 * Whist bid entry. Unlike PlayerStepper (which enforces a target sum), bids
 * are independent — players may collectively over- or under-bid. The sum is
 * only validated against the dealer constraint, surfaced as a warning here.
 */
export default function WhistBidStepper({
  players,
  values,
  maxPerPlayer,
  forbiddenSum,
  onChange,
  label,
}: Props) {
  const { t } = useTranslation('whist');
  const sum = players.reduce((acc, p) => acc + (values[p.id] ?? 0), 0);
  const warn = forbiddenSum !== null && sum === forbiddenSum;

  const set = (id: PlayerId, v: number): void => {
    const next = Math.max(0, Math.min(maxPerPlayer, v));
    onChange({ ...values, [id]: next });
  };

  return (
    <div className="space-y-3">
      {label && <div className="text-sm uppercase tracking-wide text-slate-400">{label}</div>}
      {players.map((p) => {
        const v = values[p.id] ?? 0;
        return (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
          >
            <span className="text-base text-slate-100">{p.name}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set(p.id, v - 1)}
                disabled={v <= 0}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 text-xl text-slate-200 disabled:opacity-30"
              >
                −
              </button>
              <span className="w-8 text-center tabular-nums text-xl text-slate-100">{v}</span>
              <button
                type="button"
                onClick={() => set(p.id, v + 1)}
                disabled={v >= maxPerPlayer}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 text-xl text-slate-200 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
      <div
        className={
          'rounded-md px-3 py-2 text-sm ' +
          (warn ? 'bg-rose-900/40 text-rose-300' : 'bg-slate-800/40 text-slate-300')
        }
      >
        {warn
          ? t('roundEntry.bidSumWarning', { n: forbiddenSum })
          : t('roundEntry.bidSumOK', { n: sum })}
      </div>
    </div>
  );
}
