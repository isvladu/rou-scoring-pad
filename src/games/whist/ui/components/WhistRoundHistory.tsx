import { useTranslation } from 'react-i18next';
import type { WhistGame } from '../../domain/types';

interface Props {
  game: WhistGame;
}

export default function WhistRoundHistory({ game }: Props) {
  const { t } = useTranslation('whist');
  if (game.rounds.length === 0) {
    return <p className="text-sm text-slate-500">{t('history.empty')}</p>;
  }

  return (
    <ol className="space-y-3">
      {game.rounds.map((r) => (
        <li key={r.index} className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            {t('history.handLine', { n: r.index + 1, handSize: r.handSize })}
          </div>
          <ul className="space-y-1 text-sm">
            {game.players.map((p) => {
              const bid = r.entry.bids[p.id] ?? 0;
              const tricks = r.entry.tricks[p.id] ?? 0;
              const score = r.scores[p.id] ?? 0;
              const sign = score > 0 ? '+' : '';
              return (
                <li key={p.id} className="flex items-baseline justify-between gap-3">
                  <span className="flex-1 text-slate-300">{p.name}</span>
                  <span className="tabular-nums text-slate-400">
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {t('history.bidLabel')}{' '}
                    </span>
                    {bid}
                    <span className="mx-1 text-slate-600">·</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {t('history.tricksLabel')}{' '}
                    </span>
                    {tricks}
                  </span>
                  <span
                    className={
                      'w-12 text-right tabular-nums ' +
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
      ))}
    </ol>
  );
}
