import { useTranslation } from 'react-i18next';
import type { Phase10Game } from '../../domain/types';

interface Props {
  game: Phase10Game;
}

export default function Phase10HandHistory({ game }: Props) {
  const { t } = useTranslation('phase10');
  if (game.hands.length === 0) {
    return <p className="text-sm text-slate-500">{t('history.empty')}</p>;
  }

  return (
    <ol className="space-y-3">
      {game.hands.map((h) => {
        const wentOut = game.players.find((p) => p.id === h.wentOutId);
        return (
          <li
            key={h.index}
            className="rounded-md border border-slate-800 bg-slate-900/40 p-3"
          >
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              {t('history.handLine', {
                n: h.index + 1,
                name: wentOut?.name ?? h.wentOutId,
              })}
            </div>
            <ul className="space-y-1 text-sm">
              {game.players.map((p) => {
                const penalty = p.id === h.wentOutId ? 0 : (h.remainingPenalty[p.id] ?? 0);
                const completed = h.completedPhase[p.id] ?? false;
                return (
                  <li
                    key={p.id}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="flex-1 text-slate-300">{p.name}</span>
                    {completed && (
                      <span className="rounded-full bg-emerald-700/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200">
                        {t('history.completedBadge')}
                      </span>
                    )}
                    <span
                      className={
                        'w-12 text-right tabular-nums ' +
                        (penalty === 0
                          ? 'text-slate-400'
                          : 'text-rose-400')
                      }
                    >
                      {penalty === 0 ? '0' : `+${penalty}`}
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
