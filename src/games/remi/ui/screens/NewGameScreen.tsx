import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useRemiGameStore } from '../../state/gameStore';
import {
  cloneDefaultRemiScoring,
  type NoMeldPenaltyMode,
  type RemiScoringConfig,
} from '../../config/scoringDefaults';
import {
  ALL_REMI_PLAYER_COUNTS,
  type Player,
  type RemiEndCondition,
  type RemiPlayerCount,
} from '../../domain/types';

function makePlayerSlots(count: number): { id: string; name: string }[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: '' }));
}

export default function NewGameScreen() {
  const { t } = useTranslation('remi');
  const navigate = useNavigate();
  const startGame = useRemiGameStore((s) => s.startGame);

  const [count, setCount] = useState<RemiPlayerCount>(3);
  const [players, setPlayers] = useState(makePlayerSlots(3));
  const [endMode, setEndMode] = useState<'targetScore' | 'handCount'>('targetScore');
  const [targetScore, setTargetScore] = useState(1000);
  const [handCount, setHandCount] = useState(12);
  const [showScoring, setShowScoring] = useState(false);
  const [scoring, setScoring] = useState<RemiScoringConfig>(cloneDefaultRemiScoring());
  const [error, setError] = useState<string | null>(null);

  const updateCount = (n: RemiPlayerCount): void => {
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
    const endCondition: RemiEndCondition =
      endMode === 'targetScore'
        ? { kind: 'targetScore', targetScore: Math.max(1, targetScore) }
        : { kind: 'handCount', handCount: Math.max(1, handCount) };
    const game = await startGame(playerList, endCondition, scoring);
    navigate(`/remi/game/${game.id}`, { replace: true });
  };

  const updateScoring = <K extends keyof RemiScoringConfig>(
    key: K,
    value: RemiScoringConfig[K],
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
          {ALL_REMI_PLAYER_COUNTS.map((n) => (
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

      <section className="space-y-2">
        <label className="text-sm uppercase tracking-wide text-slate-400">
          {t('newGame.endCondition')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEndMode('targetScore')}
            className={
              'flex-1 rounded-lg border px-3 py-2 text-sm ' +
              (endMode === 'targetScore'
                ? 'border-brand-500 bg-brand-500/15 text-slate-100'
                : 'border-slate-800 bg-slate-900 text-slate-300')
            }
          >
            {t('newGame.targetScore')}
          </button>
          <button
            type="button"
            onClick={() => setEndMode('handCount')}
            className={
              'flex-1 rounded-lg border px-3 py-2 text-sm ' +
              (endMode === 'handCount'
                ? 'border-brand-500 bg-brand-500/15 text-slate-100'
                : 'border-slate-800 bg-slate-900 text-slate-300')
            }
          >
            {t('newGame.handCount')}
          </button>
        </div>
        {endMode === 'targetScore' ? (
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">{t('newGame.targetScoreValue')}</span>
            <input
              type="number"
              min={1}
              value={targetScore}
              onChange={(e) => setTargetScore(Math.max(1, Number(e.target.value) || 0))}
              className="w-28 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-right tabular-nums text-slate-100"
            />
          </label>
        ) : (
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">{t('newGame.handCountValue')}</span>
            <input
              type="number"
              min={1}
              value={handCount}
              onChange={(e) => setHandCount(Math.max(1, Number(e.target.value) || 0))}
              className="w-28 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-right tabular-nums text-slate-100"
            />
          </label>
        )}
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
              label={t('newGame.winnerBonus')}
              value={scoring.winnerBonus}
              onChange={(v) => updateScoring('winnerBonus', v)}
            />
            <NumberField
              label={t('newGame.selfWinBonus')}
              value={scoring.selfWinBonus}
              onChange={(v) => updateScoring('selfWinBonus', v)}
            />
            <NumberField
              label={t('newGame.jolyFirstMeldBonus')}
              value={scoring.jolyFirstMeldBonus}
              onChange={(v) => updateScoring('jolyFirstMeldBonus', v)}
            />
            <NumberField
              label={t('newGame.jolyRackPenalty')}
              value={scoring.jolyRackPenalty}
              onChange={(v) => updateScoring('jolyRackPenalty', v)}
              prefix="−"
            />
            <NumberField
              label={t('newGame.identicalExposedBonus')}
              value={scoring.identicalExposedBonus}
              onChange={(v) => updateScoring('identicalExposedBonus', v)}
            />
            <NumberField
              label={t('newGame.noMeldPenalty')}
              value={scoring.noMeldPenalty}
              onChange={(v) => updateScoring('noMeldPenalty', v)}
              prefix="−"
            />
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {t('newGame.noMeldPenaltyMode')}
              </span>
              <div className="flex gap-2">
                {(['fixed', 'rackBased'] as NoMeldPenaltyMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateScoring('noMeldPenaltyMode', mode)}
                    className={
                      'flex-1 rounded border px-2 py-1.5 text-xs ' +
                      (scoring.noMeldPenaltyMode === mode
                        ? 'border-brand-500 bg-brand-500/15 text-slate-100'
                        : 'border-slate-800 bg-slate-900 text-slate-300')
                    }
                  >
                    {mode === 'fixed'
                      ? t('newGame.noMeldModeFixed', { n: scoring.noMeldPenalty })
                      : t('newGame.noMeldModeRackBased')}
                  </button>
                ))}
              </div>
            </div>
            <NumberField
              label={t('newGame.initialMeldThreshold')}
              value={scoring.initialMeldThreshold}
              onChange={(v) => updateScoring('initialMeldThreshold', v)}
            />
            <label className="flex items-start gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={scoring.doubleScoreOnJolyDiscardWin}
                onChange={(e) =>
                  updateScoring('doubleScoreOnJolyDiscardWin', e.target.checked)
                }
                className="mt-0.5"
              />
              <span>{t('newGame.doubleScoreOnJolyDiscardWin')}</span>
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
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-slate-400">{prefix}</span>}
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.abs(Number(e.target.value) || 0))}
          className="w-24 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-right tabular-nums text-slate-100"
        />
      </div>
    </label>
  );
}
