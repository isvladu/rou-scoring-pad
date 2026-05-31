import { useTranslation } from 'react-i18next';
import type { Game } from '../../domain/types';
import { totalScores } from '../../domain/scoring';

interface Props {
  game: Game;
  highlightPickerId?: string | null;
}

export default function Scoreboard({ game, highlightPickerId }: Props) {
  const { t } = useTranslation();
  const totals = totalScores(game.players, game.rounds);
  const ranked = [...game.players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));
  return (
    <div className="grid grid-cols-1 gap-2">
      {ranked.map((p) => {
        const score = totals[p.id] ?? 0;
        const isPicker = p.id === highlightPickerId;
        return (
          <div
            key={p.id}
            className={
              'flex items-baseline justify-between rounded-lg border px-4 py-3 ' +
              (isPicker
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-slate-800 bg-slate-900')
            }
          >
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-medium text-slate-100">{p.name}</span>
              {isPicker && (
                <span className="text-[10px] uppercase text-brand-500">
                  ·{t('game.picksLabel')}
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
