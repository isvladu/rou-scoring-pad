import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../state/gameStore';
import Scoreboard from '../components/Scoreboard';
import RotationGrid from '../components/RotationGrid';

export default function GameScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { active, load, undoLastRound, rotation } = useGameStore();

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  if (active.status === 'finished') return <Navigate to={`/game/${active.id}/summary`} replace />;

  const rot = rotation();
  if (!rot) return null;
  const dealer = active.players.find((p) => p.id === rot.currentDealerId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section>
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
          {t('game.roundOf', { n: rot.roundsPlayed + 1, total: rot.totalRounds })}
        </div>
        <h2 className="text-lg font-medium text-slate-100">
          {dealer ? t('game.dealerIs', { name: dealer.name }) : ''}
        </h2>
      </section>

      <Scoreboard game={active} highlightDealerId={rot.currentDealerId} />

      <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
        <summary className="cursor-pointer text-sm text-slate-400">{t('game.rotation')}</summary>
        <div className="mt-3">
          <RotationGrid players={active.players} rounds={active.rounds} rotation={rot} />
        </div>
      </details>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate(`/game/${active.id}/pick`)}
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
