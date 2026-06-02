import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePhase10GameStore } from '../../state/gameStore';
import {
  cloneDefaultPhase10Scoring,
  type Phase10ScoringConfig,
} from '../../config/scoringDefaults';
import {
  ALL_PHASE10_PLAYER_COUNTS,
  type Player,
  type Phase10PlayerCount,
} from '../../domain/types';

function makePlayerSlots(count: number): { id: string; name: string }[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: '' }));
}

export default function NewGameScreen() {
  const { t } = useTranslation('phase10');
  const navigate = useNavigate();
  const startGame = usePhase10GameStore((s) => s.startGame);

  const [count, setCount] = useState<Phase10PlayerCount>(4);
  const [players, setPlayers] = useState(makePlayerSlots(4));
  const [showScoring, setShowScoring] = useState(false);
  const [scoring, setScoring] = useState<Phase10ScoringConfig>(
    cloneDefaultPhase10Scoring(),
  );
  const [error, setError] = useState<string | null>(null);

  const updateCount = (n: Phase10PlayerCount): void => {
    setCount(n);
    setPlayers((prev) => {
      const next = makePlayerSlots(n);
      for (let i = 0; i < Math.min(prev.length, n); i++) next[i].name = prev[i].name;
      return next;
    });
  };

  const namesValid = useMemo(
    () => players.every((p) => p.name.trim().length > 0),
    [players],
  );

  const handleStart = async (): Promise<void> => {
    if (!namesValid) {
      setError(t('newGame.nameRequired'));
      return;
    }
    const playerList: Player[] = players.map((p) => ({
      id: p.id,
      name: p.name.trim(),
    }));
    const game = await startGame(playerList, scoring);
    navigate(`/phase10/game/${game.id}`, { replace: true });
  };

  const updateScoring = <K extends keyof Phase10ScoringConfig>(
    key: K,
    value: Phase10ScoringConfig[K],
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
          {ALL_PHASE10_PLAYER_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateCount(n)}
              className={
                'flex-1 rounded-lg border px-3 py-3 text-lg font-medium ' +
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
              label={t('newGame.penaltyLow')}
              value={scoring.penaltyLow}
              onChange={(v) => updateScoring('penaltyLow', v)}
            />
            <NumberField
              label={t('newGame.penaltyHigh')}
              value={scoring.penaltyHigh}
              onChange={(v) => updateScoring('penaltyHigh', v)}
            />
            <NumberField
              label={t('newGame.penaltySkip')}
              value={scoring.penaltySkip}
              onChange={(v) => updateScoring('penaltySkip', v)}
            />
            <NumberField
              label={t('newGame.penaltyWild')}
              value={scoring.penaltyWild}
              onChange={(v) => updateScoring('penaltyWild', v)}
            />
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
}: {
  label: string;
  value: number;
  onChange(v: number): void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.abs(Number(e.target.value) || 0))}
        className="w-24 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-right tabular-nums text-slate-100"
      />
    </label>
  );
}
