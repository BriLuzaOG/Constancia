'use client';

import { useEffect, useState } from 'react';
import { MARK } from './check-list';
import { LineField } from './line-field';
import type { LineFieldState } from './line-field';

type Kind = 'AUTHENTIC' | 'NOT_AUTHENTIC' | 'UNAVAILABLE';

const RESOLVED: Record<Kind, LineFieldState> = {
  AUTHENTIC: 'resolved-ok',
  NOT_AUTHENTIC: 'resolved-fail',
  UNAVAILABLE: 'resolved-unavailable',
};

const MARK_KEY = {
  AUTHENTIC: 'VERIFIED',
  NOT_AUTHENTIC: 'FAILED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

// A resolved band with a huge word. It mounts as lines and floods to its colour (the page's one motion).
export function Verdict({
  kind,
  title,
  reason,
  issuerDomain,
}: {
  kind: Kind;
  title: string;
  reason?: string;
  issuerDomain?: string;
}) {
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setResolved(true);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section data-kind={kind} className="border-4 border-ink bg-white">
      {/* announced once resolved: a live region mounted together with its text is often skipped */}
      <p role="status" className="sr-only">
        {resolved ? `${title}. ${reason ?? ''}` : ''}
      </p>
      <LineField state={resolved ? RESOLVED[kind] : 'rest'} className="min-h-56">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-gutter py-10">
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center border-4 border-ink bg-white text-ink sm:size-28"
          >
            <svg
              viewBox="0 0 20 20"
              className="size-3/5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d={MARK[MARK_KEY[kind]]} strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
          </span>
          {/* unavailable floods yellow with ink hatching: the word gets a solid plate so it stays legible */}
          <h2
            className={`font-display text-headline font-extrabold font-stretch-expanded text-balance text-ink sm:text-display ${kind === 'UNAVAILABLE' ? 'w-fit bg-line-yellow px-3 py-1' : ''}`}
          >
            {title}
          </h2>
        </div>
      </LineField>
      {reason || issuerDomain ? (
        <div className="flex flex-col gap-3 border-t-4 border-ink p-6">
          {reason ? <p className="max-w-[65ch] text-body">{reason}</p> : null}
          {issuerDomain ? (
            <p className="text-small">
              <span className="font-bold">Issuer domain</span> <code>{issuerDomain}</code>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
