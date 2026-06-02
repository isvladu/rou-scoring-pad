import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useWhistGameStore } from '../../state/gameStore';
import { totalScores } from '../../domain/scoring';
import Scoreboard from '../../../../core/components/Scoreboard';
import WhistRoundHistory from '../components/WhistRoundHistory';

export default function GameScreen() {
  const { t } = useTranslation('whist');
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, undoLastRound, currentRoundInfo } = useWhistGameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  if (active.status === 'finished')
    return <Navigate to={`/whist/game/${active.id}/summary`} replace />;

  const info = currentRoundInfo();
  if (!info) return null;
  const picker = active.players.find((p) => p.id === info.pickerId);
  const dealer = active.players.find((p) => p.id === info.dealerId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section>
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
          {t('game.roundOf', { n: info.roundIndex + 1, total: info.totalRounds })}
        </div>
        <h2 className="text-lg font-medium text-slate-100">
          {t('game.handSize', { n: info.handSize })}
        </h2>
        {picker && (
          <p className="text-sm text-slate-300">
            {t('game.pickerIs', { name: picker.name })}
          </p>
        )}
        {dealer && (
          <p className="text-xs text-slate-500">
            {t('game.dealerIs', { name: dealer.name })}
          </p>
        )}
      </section>

      <Scoreboard
        players={active.players}
        totals={totalScores(active.players, active.rounds)}
        highlightedPlayerId={info.pickerId}
        highlightedPlayerLabel={t('game.leadsLabel')}
      />

      {active.rounds.length > 0 && (
        <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <summary className="cursor-pointer text-sm text-slate-400">
            {t('history.title')}
          </summary>
          <div className="mt-3">
            <WhistRoundHistory game={active} />
          </div>
        </details>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate(`/whist/game/${active.id}/round`)}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-4 text-lg font-medium text-slate-900 hover:bg-brand-600"
        >
          {t('game.nextRound')}
        </button>
        {active.rounds.length > 0 && (
          <button
            type="button"
            onClick={() => void undoLastRound()}
            className="rounded-lg border border-slate-700 px-4 py-4 text-sm text-slate-300 hover:border-slate-500"
          >
            ↶ {t('game.undoRound')}
          </button>
        )}
      </div>
    </div>
  );
}
