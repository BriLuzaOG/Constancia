'use client';

import { useCallback, useRef, useState } from 'react';
import type { CvVerdict } from '@/lib/credential/passport';
import type { LookupFn } from '@/lib/credential/verify';
import { createRecordingLookup } from './lookup-client';
import { CHECK_LABELS } from './types';
import type { LoadedInput, RecordedRequest, RowView } from './types';

const MIN_ROW_MS = 450;
const CODES = ['TOKEN', 'ISSUER', 'SIGNATURE', 'HOLDER', 'LEDGER'] as const;

const pendingRows = (): RowView[] =>
  CODES.map((code) => ({ code, label: CHECK_LABELS[code], status: 'PENDING' }));

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export interface CvVerification {
  entries: RowView[][]; // one list of five rows per certificate
  verdict: CvVerdict | null;
  requests: RecordedRequest[];
  running: boolean;
}

const IDLE: CvVerification = { entries: [], verdict: null, requests: [], running: false };

function entryCount(text: string): number {
  try {
    const { presentations } = JSON.parse(text) as { presentations?: unknown };
    return Array.isArray(presentations) ? Math.min(presentations.length, 12) : 0;
  } catch {
    return 0;
  }
}

/** Runs the five checks for every certificate of a Verified CV, entry by entry. */
export function useCvVerification() {
  const [state, setState] = useState<CvVerification>(IDLE);
  const runId = useRef(0);

  const run = useCallback(async (input: LoadedInput, customLookup?: LookupFn) => {
    const id = ++runId.current;
    const stale = () => runId.current !== id;
    const recording = createRecordingLookup();
    const lookup = customLookup ?? recording.lookup;

    let entries = Array.from({ length: entryCount(input.text) }, pendingRows);
    setState({ ...IDLE, entries, running: true });
    const show = (patch: Partial<CvVerification>) => {
      if (!stale()) setState((current) => ({ ...current, ...patch }));
    };

    const { verifyVerifiedCv } = await import('@/lib/credential/passport');
    const generator = verifyVerifiedCv(input.text, { lookup });
    let checkingSince = 0;
    let step = await generator.next();
    while (!step.done) {
      const event = step.value;
      if (event.status !== 'CHECKING' && event.status !== 'NOT_EXAMINED') {
        await sleep(Math.max(0, MIN_ROW_MS - (performance.now() - checkingSince)));
      }
      if (event.status === 'CHECKING') checkingSince = performance.now();
      if (stale()) return;
      entries = entries.map((rows, index) =>
        index === event.entry
          ? rows.map((row) =>
              row.code === event.code
                ? { ...row, status: event.status, measured: event.measured, detail: event.detail }
                : row,
            )
          : rows,
      );
      show({ entries });
      step = await generator.next();
    }
    show({ verdict: step.value, requests: [...recording.requests], running: false });
  }, []);

  return { ...state, run };
}
