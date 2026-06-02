import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useWhistGameStore } from '../../state/gameStore';
import {
  cloneDefaultWhistScoring,
  type WhistScoringConfig,
} from '../../config/scoringDefaults';
import {
  ALL_WHIST_PLAYER_COUNTS,
  type Player,
  type WhistPlayerCount,
} from '../../domain/types';

function makePlayerSlots(count: number): { id: string; name: string }[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: '' }));
}

export default function NewGameScreen() {
  const { t } = useTranslation('whist');
  const navigate = useNavigate();
  const startGame = useWhistGameStore((s) => s.startGame);

  const [count, setCount] = useState<WhistPlayerCount>(4);
  const [players, setPlayers] = useState(makePlayerSlots(4));
  const [showScoring, setShowScoring] = useState(false);
  const [scoring, setScoring] = useState<WhistScoringConfig>(cloneDefaultWhistScoring());
  const [error, setError] = useState<string | null>(null);

  const updateCount = (n: WhistPlayerCount): void => {
    setCount(n);
    setPlayers((prev) => {
      const next = makePlayerSlots(n);
      for (let i = 0; i < Math.min(prev.length, n); i++) next[i].name = prev[i].name;
      return next;
    });
  };

  const namesValid = useMemo(() => players.every((p) => p.name.trim().length > 0), [players]);

  const handleStart = async (): Promise<void> => {
    if (!namesValid) {
      setError(t('newGame.nameRequired'));
      return;
    }
    const playerList: Player[] = players.map((p) => ({ id: p.id, name: p.name.trim() }));
    const game = await startGame(playerList, scoring);
    navigate(`/whist/game/${game.id}`, { replace: true });
  };

  const updateScoring = <K extends keyof WhistScoringConfig>(
    key: K,
    value: WhistScoringConfig[K],
  ): void => {
    setScoring((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">{t('newGame.title')}</h1>

      <section className="space-y-2">
        <label className="text-sm uppercase tracking-wide text-slate-400">
          {t('newGame.playerCount')}
        </label>
        <div className="flex gap-2">
          {ALL_WHIST_PLAYER_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateCount(n)}
              className={
                'flex-1 rounded-lg border px-4 py-3 text-lg font-medium ' +
                (count === n
                  ? 'border-brand-500 bg-brand-500/15 text-slate-100'
                  : 'border-slate-800 bg-slate-900 text-slate-300')
              }
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        {players.map((p, i) => (
          <input
            key={p.id}
            value={p.name}
            placeholder={t('newGame.playerNamePlaceholder', { n: i + 1 })}
            onChange={(e) => {
              const next = [...players];
              next[i] = { ...next[i], name: e.target.value };
              setPlayers(next);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
        ))}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowScoring((v) => !v)}
          className="text-sm text-slate-400 underline"
        >
          {t('newGame.scoringOverrides')} {showScoring ? '−' : '+'}
        </button>
        {showScoring && (
          <div className="mt-3 space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <p className="text-xs text-slate-500">{t('newGame.scoringHint')}</p>
            <NumberField
              label={t('newGame.hitBonus')}
              value={scoring.hitBonus}
              onChange={(v) => updateScoring('hitBonus', v)}
            />
            <NumberField
              label={t('newGame.missPenaltyPerTrick')}
              value={scoring.missPenaltyPerTrick}
              onChange={(v) => updateScoring('missPenaltyPerTrick', v)}
              prefix="−"
            />
            <NumberField
              label={t('newGame.zeroBidHitBonus')}
              value={scoring.zeroBidHitBonus}
              onChange={(v) => updateScoring('zeroBidHitBonus', v)}
            />
            <NumberField
              label={t('newGame.maxBidHitBonus')}
              value={scoring.maxBidHitBonus}
              onChange={(v) => updateScoring('maxBidHitBonus', v)}
            />
            <NumberField
              label={t('newGame.premiereStreakLength')}
              value={scoring.premiereStreakLength}
              onChange={(v) => updateScoring('premiereStreakLength', v)}
            />
            <NumberField
              label={t('newGame.premiereBonus')}
              value={scoring.premiereBonus}
              onChange={(v) => updateScoring('premiereBonus', v)}
            />
            <label className="flex items-start gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={scoring.enforceDealerConstraint}
                onChange={(e) =>
                  updateScoring('enforceDealerConstraint', e.target.checked)
                }
                className="mt-0.5"
              />
              <span>
                {t('newGame.enforceDealerConstraint')}
                <span className="ml-1 block text-xs text-slate-500">
                  {t('newGame.enforceDealerConstraintHint')}
                </span>
              </span>
            </label>
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-md bg-rose-900/30 px-3 py-2 text-sm text-rose-300">{error}</p>
      )}

      <button
        type="button"
        onClick={() => void handleStart()}
        disabled={!namesValid}
        className="w-full rounded-lg bg-brand-500 px-4 py-4 text-lg font-medium text-slate-900 hover:bg-brand-600 disabled:opacity-50"
      >
        {t('newGame.start')}
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange(v: number): void;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        {prefix && <span className="text-slate-400">{prefix}</span>}
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.abs(Number(e.target.value) || 0))}
          className="w-24 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
        />
      </div>
    </label>
  );
}
