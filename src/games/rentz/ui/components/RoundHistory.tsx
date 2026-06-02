import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Game, PlayerId, RentzRefusal, Round } from '../../domain/types';

interface Props {
  game: Game;
}

type TimelineItem =
  | { kind: 'round'; at: string; round: Round }
  | { kind: 'refusal'; at: string; refusal: RentzRefusal };

function buildTimeline(game: Game): TimelineItem[] {
  const items: TimelineItem[] = [
    ...game.rounds.map((r) => ({ kind: 'round' as const, at: r.committedAt, round: r })),
    ...game.rentzRefusals.map((r) => ({
      kind: 'refusal' as const,
      at: r.occurredAt,
      refusal: r,
    })),
  ];
  // Newest first — most recent activity is glanceable without scrolling.
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return items;
}

export default function RoundHistory({ game }: Props) {
  const { t } = useTranslation('rentz');
  const timeline = useMemo(() => buildTimeline(game), [game]);

  const nameOf = (id: PlayerId): string =>
    game.players.find((p) => p.id === id)?.name ?? id;

  if (timeline.length === 0) {
    return <p className="text-sm text-slate-500">{t('history.empty')}</p>;
  }

  return (
    <ol className="space-y-2">
      {timeline.map((item) =>
        item.kind === 'refusal' ? (
          <RefusalCard
            key={`refusal-${item.at}-${item.refusal.refuserId}`}
            line={t('history.refusalLine', {
              refuser: nameOf(item.refusal.refuserId),
              picker: nameOf(item.refusal.pickerId),
            })}
          />
        ) : (
          <RoundCard
            key={`round-${item.round.index}`}
            round={item.round}
            players={game.players}
            pickerName={nameOf(item.round.pickerId)}
            blindBadge={t('game.blindBadge')}
          />
        ),
      )}
    </ol>
  );
}

function RefusalCard({ line }: { line: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
      <span aria-hidden="true">✕</span>
      <span>{line}</span>
    </li>
  );
}

function RoundCard({
  round,
  players,
  pickerName,
  blindBadge,
}: {
  round: Round;
  players: Game['players'];
  pickerName: string;
  blindBadge: string;
}) {
  const { t } = useTranslation('rentz');
  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 text-xs">
          <span className="font-medium text-slate-300">R{round.index + 1}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-100">
            {t(`contracts.${round.entry.contract}.short`)}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">{pickerName}</span>
        </div>
        {round.blind && (
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-400">
            {blindBadge}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {players.map((p) => {
          const delta = round.scores[p.id] ?? 0;
          const tone =
            delta > 0
              ? 'text-emerald-400'
              : delta < 0
                ? 'text-rose-400'
                : 'text-slate-500';
          return (
            <span key={p.id} className="flex items-baseline gap-1">
              <span className="text-slate-300">{p.name}</span>
              <span className={`tabular-nums font-medium ${tone}`}>
                {delta > 0 ? '+' : ''}
                {delta}
              </span>
            </span>
          );
        })}
      </div>
    </li>
  );
}
