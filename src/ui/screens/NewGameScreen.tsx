import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cloneDefaultScoring, type ScoringConfig } from '../../config/scoringDefaults';
import type { Player, PlayerCount } from '../../domain/types';
import { useGameStore } from '../../state/gameStore';

const COUNTS: PlayerCount[] = [4, 5, 6];

function makePlayerSlots(count: number): { id: string; name: string }[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: '' }));
}

export default function NewGameScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const startGame = useGameStore((s) => s.startGame);

  const [count, setCount] = useState<PlayerCount>(4);
  const [players, setPlayers] = useState(makePlayerSlots(4));
  const [showScoring, setShowScoring] = useState(false);
  const [scoring, setScoring] = useState<ScoringConfig>(() => cloneDefaultScoring());
  const [error, setError] = useState<string | null>(null);

  const updateCount = (n: PlayerCount): void => {
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
    navigate(`/game/${game.id}`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">{t('newGame.title')}</h1>

      <section className="space-y-2">
        <label className="text-sm uppercase tracking-wide text-slate-400">
          {t('newGame.playerCount')}
        </label>
        <div className="flex gap-2">
          {COUNTS.map((n) => (
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
          <ScoringEditor count={count} scoring={scoring} onChange={setScoring} />
        )}
      </section>

      {error && <p className="rounded-md bg-rose-900/30 px-3 py-2 text-sm text-rose-300">{error}</p>}

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

function toNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ScoringRow({
  label,
  value,
  onValue,
}: {
  label: string;
  value: number;
  onValue: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onValue(toNum(e.target.value))}
        className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right tabular-nums text-slate-100"
      />
    </div>
  );
}

function ScoringEditor({
  count,
  scoring,
  onChange,
}: {
  count: PlayerCount;
  scoring: ScoringConfig;
  onChange(next: ScoringConfig): void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-3 space-y-1 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <p className="text-xs text-slate-500">{t('newGame.scoringHint')}</p>
      <ScoringRow
        label={t('contracts.noTricks.label') + ' / ' + t('roundEntry.tricks')}
        value={scoring.noTricks.perTrick}
        onValue={(n) => onChange({ ...scoring, noTricks: { perTrick: n } })}
      />
      <ScoringRow
        label={t('contracts.noDiamonds.label')}
        value={scoring.noDiamonds.perDiamond}
        onValue={(n) => onChange({ ...scoring, noDiamonds: { perDiamond: n } })}
      />
      <ScoringRow
        label={t('contracts.noQueens.label')}
        value={scoring.noQueens.perQueen}
        onValue={(n) => onChange({ ...scoring, noQueens: { perQueen: n } })}
      />
      <ScoringRow
        label={t('contracts.noKingOfHearts.label')}
        value={scoring.noKingOfHearts.takingIt}
        onValue={(n) => onChange({ ...scoring, noKingOfHearts: { takingIt: n } })}
      />
      <ScoringRow
        label={t('contracts.tenOfClubs.label')}
        value={scoring.tenOfClubs.takingIt}
        onValue={(n) => onChange({ ...scoring, tenOfClubs: { takingIt: n } })}
      />
      <ScoringRow
        label={t('contracts.totals.label') + ' ×'}
        value={scoring.totals.multiplier}
        onValue={(n) => onChange({ ...scoring, totals: { multiplier: n } })}
      />
      <ScoringRow
        label={t('contracts.whist.label')}
        value={scoring.whist.perTrick}
        onValue={(n) => onChange({ ...scoring, whist: { perTrick: n } })}
      />
      <ScoringRow
        label={t('newGame.blindMultiplier')}
        value={scoring.blindMultiplier}
        onValue={(n) => onChange({ ...scoring, blindMultiplier: n })}
      />
      <div className="mt-2 border-t border-slate-800 pt-2">
        <span className="text-sm text-slate-300">
          {t('contracts.rentz.label')} ({count}p)
        </span>
        <div className="mt-1 flex flex-wrap gap-2">
          {scoring.rentz.byPosition[count].map((v, idx) => (
            <input
              key={idx}
              type="number"
              value={v}
              onChange={(e) => {
                const arr = [...scoring.rentz.byPosition[count]];
                arr[idx] = toNum(e.target.value);
                onChange({
                  ...scoring,
                  rentz: {
                    byPosition: { ...scoring.rentz.byPosition, [count]: arr },
                  },
                });
              }}
              className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right tabular-nums text-slate-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
