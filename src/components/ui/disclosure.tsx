import type { ReactNode } from 'react';

export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
