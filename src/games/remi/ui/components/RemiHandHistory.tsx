import { useTranslation } from 'react-i18next';
import type { RemiGame } from '../../domain/types';

interface Props {
  game: RemiGame;
}

export default function RemiHandHistory({ game }: Props) {
  const { t } = useTranslation('remi');
  if (game.hands.length === 0) {
    return <p className="text-sm text-slate-500">{t('history.empty')}</p>;
  }

  return (
    <ol className="space-y-3">
      {game.hands.map((h) => {
        const winner = h.winnerId ? game.players.find((p) => p.id === h.winnerId) : null;
        return (
          <li
            key={h.index}
            className="rounded-md border border-slate-800 bg-slate-900/40 p-3"
          >
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              {t('history.handLine', { n: h.index + 1 })}{' '}
              {winner ? (
                <span className="text-slate-300">
                  · {t('history.wonBy', { name: winner.name })}
                </span>
              ) : (
                <span className="text-slate-500">· {t('history.noWinnerLine')}</span>
              )}
            </div>
            <ul className="space-y-1 text-sm">
              {game.players.map((p) => {
                const score = h.scores[p.id] ?? 0;
                const sign = score > 0 ? '+' : '';
                return (
                  <li
                    key={p.id}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="flex-1 text-slate-300">{p.name}</span>
                    <span
                      className={
                        'w-16 text-right tabular-nums ' +
                        (score > 0
                          ? 'text-emerald-400'
                          : score < 0
                            ? 'text-rose-400'
                            : 'text-slate-400')
                      }
                    >
                      {sign}
                      {score}
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
