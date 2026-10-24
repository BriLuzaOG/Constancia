import { ROW_STATUS } from './check-list';
import type { RowStatus } from './check-list';

export interface TimelineItem {
  id: string;
  employer: string;
  title?: string;
  start?: string;
  // oxlint-disable-next-line typescript/no-redundant-type-constituents -- contract §11 signature, 'present' is a readable marker
  end?: string | 'present';
  status: RowStatus;
  note?: string;
}

// overlaps refer to item ids
export function Timeline({
  items,
  gaps = [],
  overlaps = [],
}: {
  items: TimelineItem[];
  gaps?: { from: string; to: string; months: number }[];
  overlaps?: { a: string; b: string }[];
}) {
  const employerOf = (id: string) => items.find((item) => item.id === id)?.employer ?? id;

  return (
    <div>
      <ol className="border-b-2 border-ink">
        {items.map((item) => {
          const dates = [item.start, item.end].filter(Boolean).join(' – ');
          return (
            <li
              key={item.id}
              data-status={item.status}
              className="grid gap-1 border-t-2 border-ink py-4 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="text-title font-bold">{item.employer}</p>
                {item.title ? <p className="text-body">{item.title}</p> : null}
                {dates ? <p className="text-small text-ink-muted">{dates}</p> : null}
                {item.note ? <p className="text-small text-ink-muted">{item.note}</p> : null}
              </div>
              <p className="text-small font-bold uppercase tracking-wide sm:text-right">
                {ROW_STATUS[item.status]}
              </p>
            </li>
          );
        })}
      </ol>
      {gaps.map((gap) => (
        <p key={`${gap.from}-${gap.to}`} className="mt-4 text-small">
          Gap · {gap.months} {gap.months === 1 ? 'month' : 'months'} ({gap.from} – {gap.to})
        </p>
      ))}
      {overlaps.map((overlap) => (
        <p key={`${overlap.a}-${overlap.b}`} className="mt-4 text-small">
          Overlap · {employerOf(overlap.a)} and {employerOf(overlap.b)}
        </p>
      ))}
    </div>
  );
}
