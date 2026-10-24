import type { ReactNode } from 'react';

export const ROW_STATUS = {
  PENDING: 'Pending',
  CHECKING: 'Checking…',
  VERIFIED: 'Verified',
  FAILED: 'Failed',
  UNAVAILABLE: 'Unavailable',
  NOT_EXAMINED: 'Not examined',
  DONE: 'Done',
} as const;

export type RowStatus = keyof typeof ROW_STATUS;

export function CheckList({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title ? <h2>{title}</h2> : null}
      <ol>{children}</ol>
    </section>
  );
}

export function CheckRow({
  index,
  label,
  status,
  measured,
  detail,
  href,
}: {
  index: number;
  label: string;
  status: RowStatus;
  measured?: string;
  detail?: string;
  href?: string;
}) {
  return (
    <li data-status={status}>
      <span>{index}</span> <span>{label}</span> <span>{ROW_STATUS[status]}</span>
      {measured ? <code>{measured}</code> : null}
      {detail ? <p>{detail}</p> : null}
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          View on explorer
        </a>
      ) : null}
    </li>
  );
}
