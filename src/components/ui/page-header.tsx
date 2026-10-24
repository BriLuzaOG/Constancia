import type { ReactNode } from 'react';

export function PageHeader({
  kicker,
  title,
  lead,
  actions,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
}) {
  return (
    <header>
      {kicker && <p>{kicker}</p>}
      <h1>{title}</h1>
      {lead && <p>{lead}</p>}
      {actions}
    </header>
  );
}
