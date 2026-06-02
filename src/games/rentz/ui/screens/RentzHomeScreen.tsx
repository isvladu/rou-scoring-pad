import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { deleteGame, listGames } from '../../storage/gamesRepo';
import { importFromAnyFormat } from '../../../../core/storage/unifiedExportImport';
import type { Game } from '../../domain/types';
import { totalScores } from '../../domain/scoring';

export default function RentzHomeScreen() {
  const { t, i18n } = useTranslation('rentz');
  const [games, setGames] = useState<Game[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const refresh = (): void => {
    void listGames().then(setGames);
  };

  useEffect(refresh, []);

  const handleDelete = async (g: Game): Promise<void> => {
    if (!window.confirm(t('home.deleteConfirm'))) return;
    await deleteGame(g.id);
    refresh();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      // Auto-detects scoring-pad, rentz-scoring-app, or whist-scoring-app —
      // games for other types still get saved to their own stores.
      await importFromAnyFormat(text);
      refresh();
    } catch (err) {
      window.alert(String(err));
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate('/rentz/new')}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-3 text-lg font-medium text-slate-900 hover:bg-brand-600"
        >
          + {t('home.newGame')}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-slate-700 px-4 py-3 text-slate-200 hover:border-slate-500"
        >
          {t('home.importGame')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {games.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
          {t('home.noGames')}
        </p>
      ) : (
        <ul className="space-y-2">
          {games.map((g) => {
            const totals = totalScores(g.players, g.rounds);
            const leader = [...g.players].sort(
              (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0),
            )[0];
            return (
              <li
                key={g.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
              >
                <Link to={`/rentz/game/${g.id}`} className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-slate-100">
                      {g.players.map((p) => p.name).join(', ')}
                    </span>
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-[10px] uppercase ' +
                        (g.status === 'finished'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-emerald-700 text-emerald-100')
                      }
                    >
                      {t(g.status === 'finished' ? 'home.finished' : 'home.inProgress')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {t('home.createdAt')}:{' '}
                    {new Date(g.createdAt).toLocaleString(i18n.resolvedLanguage)} ·{' '}
                    {g.rounds.length} {t('common.rounds').toLowerCase()}
                    {leader && (
                      <>
                        {' · '}
                        {leader.name} {totals[leader.id] >= 0 ? '+' : ''}
                        {totals[leader.id]}
                      </>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(g)}
                  className="ml-3 text-xs uppercase text-slate-500 hover:text-rose-400"
                >
                  {t('common.delete')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
