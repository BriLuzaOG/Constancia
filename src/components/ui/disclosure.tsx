import type { ReactNode } from 'react';

export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group border-t-2 border-ink py-3">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
        {summary}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
          strokeLinecap="square"
          className="size-4 shrink-0 fill-none stroke-ink stroke-2"
        >
          <path d="M2 8h12" />
          <path d="M8 2v12" className="group-open:hidden" />
        </svg>
      </summary>
      <div className="pt-3 text-body">{children}</div>
    </details>
  );
}
