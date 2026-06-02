import type { Player, PlayerId } from '../types';

interface Props {
  players: Player[];
  totals: Record<PlayerId, number>;
  highlightedPlayerId?: PlayerId | null;
  highlightedPlayerLabel?: string;
}

export default function Scoreboard({
  players,
  totals,
  highlightedPlayerId,
  highlightedPlayerLabel,
}: Props) {
  const ranked = [...players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));
  return (
    <div className="grid grid-cols-1 gap-2">
      {ranked.map((p) => {
        const score = totals[p.id] ?? 0;
        const isHighlighted = p.id === highlightedPlayerId;
        return (
          <div
            key={p.id}
            className={
              'flex items-baseline justify-between rounded-lg border px-4 py-3 ' +
              (isHighlighted
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-slate-800 bg-slate-900')
            }
          >
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-medium text-slate-100">{p.name}</span>
              {isHighlighted && highlightedPlayerLabel && (
                <span className="text-[10px] uppercase text-brand-500">
                  ·{highlightedPlayerLabel}
                </span>
              )}
            </div>
            <span
              className={
                'tabular-nums text-2xl font-semibold ' +
                (score > 0 ? 'text-emerald-400' : score < 0 ? 'text-rose-400' : 'text-slate-400')
              }
            >
              {score > 0 ? '+' : ''}
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
