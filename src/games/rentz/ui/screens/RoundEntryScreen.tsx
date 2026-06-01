import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../../state/gameStore';
import { validateRoundEntry } from '../../domain/validation';
import { computeRoundScores } from '../../domain/scoring';
import {
  type ContractId,
  type Player,
  type PlayerCount,
  type PlayerId,
  type RoundEntry,
  diamondsInDeck,
  QUEENS_IN_DECK,
  TRICKS_PER_HAND,
} from '../../domain/types';
import PlayerStepper from '../components/PlayerStepper';
import PlayerSinglePick from '../components/PlayerSinglePick';
import PlayerRanker from '../components/PlayerRanker';

const CONTRACT_IDS: ContractId[] = [
  'noTricks',
  'noDiamonds',
  'noQueens',
  'noKingOfHearts',
  'tenOfClubs',
  'totals',
  'whist',
  'rentz',
];

function emptyCounts(players: Player[]): Record<PlayerId, number> {
  return Object.fromEntries(players.map((p) => [p.id, 0]));
}

export default function RoundEntryScreen() {
  const { t } = useTranslation();
  const { id, contract } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { active, load, commitRound } = useGameStore();
  const blind = search.get('blind') === '1';

  useEffect(() => {
    if (id && active?.id !== id) void load(id);
  }, [id, active?.id, load]);

  if (!active || active.id !== id) return <p className="text-slate-400">…</p>;
  if (!contract || !(CONTRACT_IDS as string[]).includes(contract)) {
    navigate(`/rentz/game/${active.id}/pick`, { replace: true });
    return null;
  }
  const c = contract as ContractId;
  const players = active.players;
  const count = players.length as PlayerCount;
  const opts = { blind };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
          <span>{t(`contracts.${c}.kind`)}</span>
          {blind && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-400">
              {t('game.blindBadge')} ×{active.scoring.blindMultiplier}
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold text-slate-100">{t(`contracts.${c}.label`)}</h2>
      </div>

      {c === 'noTricks' || c === 'whist' ? (
        <CounterEntry
          players={players}
          expected={TRICKS_PER_HAND}
          label={t('roundEntry.tricks')}
          onSubmit={(counts) =>
            commitRound({ contract: c, counts }, opts).then(() => navigate(`/rentz/game/${active.id}`))
          }
        />
      ) : c === 'noDiamonds' ? (
        <CounterEntry
          players={players}
          expected={diamondsInDeck(count)}
          label={t('roundEntry.diamonds')}
          onSubmit={(counts) =>
            commitRound({ contract: c, counts }, opts).then(() => navigate(`/rentz/game/${active.id}`))
          }
        />
      ) : c === 'noQueens' ? (
        <CounterEntry
          players={players}
          expected={QUEENS_IN_DECK}
          label={t('roundEntry.queens')}
          onSubmit={(counts) =>
            commitRound({ contract: c, counts }, opts).then(() => navigate(`/rentz/game/${active.id}`))
          }
        />
      ) : c === 'noKingOfHearts' ? (
        <SingleTakerEntry
          players={players}
          label={t('roundEntry.kingOfHearts')}
          onSubmit={(takerId) =>
            commitRound({ contract: c, takerId }, opts).then(() => navigate(`/rentz/game/${active.id}`))
          }
        />
      ) : c === 'tenOfClubs' ? (
        <SingleTakerEntry
          players={players}
          label={t('roundEntry.tenOfClubs')}
          onSubmit={(takerId) =>
            commitRound({ contract: c, takerId }, opts).then(() => navigate(`/rentz/game/${active.id}`))
          }
        />
      ) : c === 'totals' ? (
        <TotalsEntry
          players={players}
          count={count}
          onSubmit={(entry) =>
            commitRound(entry, opts).then(() => navigate(`/rentz/game/${active.id}`))
          }
        />
      ) : (
        <RentzEntry
          players={players}
          blind={blind}
          onSubmit={(finishingOrder) =>
            commitRound({ contract: 'rentz', finishingOrder }, opts).then(() =>
              navigate(`/rentz/game/${active.id}`),
            )
          }
        />
      )}

      <button
        type="button"
        onClick={() => navigate(`/rentz/game/${active.id}/pick`)}
        className="text-sm text-slate-400 underline"
      >
        ← {t('common.back')}
      </button>
    </div>
  );
}

function CounterEntry({
  players,
  expected,
  label,
  onSubmit,
}: {
  players: Player[];
  expected: number;
  label: string;
  onSubmit(counts: Record<PlayerId, number>): Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<Record<PlayerId, number>>(() => emptyCounts(players));
  const sum = players.reduce((acc, p) => acc + (counts[p.id] ?? 0), 0);
  const valid = sum === expected;
  return (
    <div className="space-y-4">
      <PlayerStepper
        players={players}
        values={counts}
        expectedSum={expected}
        onChange={setCounts}
        label={label}
      />
      <button
        type="button"
        disabled={!valid}
        onClick={() => void onSubmit(counts)}
        className="w-full rounded-lg bg-brand-500 px-4 py-4 text-lg font-medium text-slate-900 hover:bg-brand-600 disabled:opacity-50"
      >
        {t('common.save')}
      </button>
    </div>
  );
}

function SingleTakerEntry({
  players,
  label,
  onSubmit,
}: {
  players: Player[];
  label: string;
  onSubmit(takerId: PlayerId): Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [taker, setTaker] = useState<PlayerId | null>(null);
  return (
    <div className="space-y-4">
      <PlayerSinglePick players={players} selectedId={taker} onSelect={setTaker} label={label} />
      <button
        type="button"
        disabled={!taker}
        onClick={() => taker && void onSubmit(taker)}
        className="w-full rounded-lg bg-brand-500 px-4 py-4 text-lg font-medium text-slate-900 hover:bg-brand-600 disabled:opacity-50"
      >
        {t('common.save')}
      </button>
    </div>
  );
}

function TotalsEntry({
  players,
  count,
  onSubmit,
}: {
  players: Player[];
  count: PlayerCount;
  onSubmit(entry: RoundEntry): Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'tricks' | 'diamonds' | 'queens' | 'king'>('tricks');
  const [tricks, setTricks] = useState(() => emptyCounts(players));
  const [diamonds, setDiamonds] = useState(() => emptyCounts(players));
  const [queens, setQueens] = useState(() => emptyCounts(players));
  const [kingTaker, setKingTaker] = useState<PlayerId | null>(null);

  const entry: RoundEntry = useMemo(
    () => ({
      contract: 'totals',
      tricks,
      diamonds,
      queens,
      kingOfHeartsTakerId: kingTaker ?? '',
    }),
    [tricks, diamonds, queens, kingTaker],
  );

  const v = validateRoundEntry(entry, players);
  const tabs = [
    { id: 'tricks' as const, label: t('roundEntry.tabTricks') },
    { id: 'diamonds' as const, label: t('roundEntry.tabDiamonds') },
    { id: 'queens' as const, label: t('roundEntry.tabQueens') },
    { id: 'king' as const, label: t('roundEntry.tabKing') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex overflow-hidden rounded-lg border border-slate-800">
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={
              'flex-1 px-3 py-2 text-sm font-medium ' +
              (tab === x.id ? 'bg-brand-500 text-slate-900' : 'bg-slate-900 text-slate-300')
            }
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'tricks' && (
        <PlayerStepper
          players={players}
          values={tricks}
          expectedSum={TRICKS_PER_HAND}
          onChange={setTricks}
        />
      )}
      {tab === 'diamonds' && (
        <PlayerStepper
          players={players}
          values={diamonds}
          expectedSum={diamondsInDeck(count)}
          onChange={setDiamonds}
        />
      )}
      {tab === 'queens' && (
        <PlayerStepper
          players={players}
          values={queens}
          expectedSum={QUEENS_IN_DECK}
          onChange={setQueens}
        />
      )}
      {tab === 'king' && (
        <PlayerSinglePick
          players={players}
          selectedId={kingTaker}
          onSelect={setKingTaker}
          label={t('roundEntry.kingOfHearts')}
        />
      )}

      <button
        type="button"
        disabled={!v.ok}
        onClick={() => void onSubmit(entry)}
        className="w-full rounded-lg bg-brand-500 px-4 py-4 text-lg font-medium text-slate-900 hover:bg-brand-600 disabled:opacity-50"
      >
        {t('common.save')}
      </button>
    </div>
  );
}

function RentzEntry({
  players,
  blind,
  onSubmit,
}: {
  players: Player[];
  blind: boolean;
  onSubmit(order: PlayerId[]): Promise<unknown>;
}) {
  const { t } = useTranslation();
  const { active } = useGameStore();
  const [order, setOrder] = useState<PlayerId[]>([]);
  const complete = order.length === players.length;
  const preview = useMemo(() => {
    if (!complete || !active) return null;
    return computeRoundScores(
      { contract: 'rentz', finishingOrder: order },
      players,
      active.scoring,
      blind,
    );
  }, [order, complete, players, active, blind]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{t('roundEntry.finishingOrderHint')}</p>
      <PlayerRanker players={players} order={order} onChange={setOrder} label={t('roundEntry.finishingOrder')} />
      {complete && preview && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm">
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
            {t('roundEntry.preview')}
          </div>
          {order.map((pid, idx) => {
            const p = players.find((x) => x.id === pid);
            const pts = preview[pid] ?? 0;
            return (
              <div key={pid} className="flex justify-between">
                <span className="text-slate-200">
                  {idx + 1}. {p?.name}
                </span>
                <span
                  className={
                    'tabular-nums ' +
                    (pts > 0 ? 'text-emerald-400' : pts < 0 ? 'text-rose-400' : 'text-slate-400')
                  }
                >
                  {pts > 0 ? '+' : ''}
                  {pts}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <button
        type="button"
        disabled={!complete}
        onClick={() => void onSubmit(order)}
        className="w-full rounded-lg bg-brand-500 px-4 py-4 text-lg font-medium text-slate-900 hover:bg-brand-600 disabled:opacity-50"
      >
        {t('common.save')}
      </button>
    </div>
  );
}
