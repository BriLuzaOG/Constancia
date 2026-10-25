'use client';

import { useEffect, useState } from 'react';
import type { RowStatus } from '@/components/ui/check-list';
import { verifyCertificate, type CheckCode, type Verdict } from '@/lib/credential/verify';
import { lookupLedger } from '@/lib/ledger/gateway-client';

export interface CheckRowView {
  code: CheckCode;
  status: RowStatus;
  measured?: string;
  detail?: string;
}

const CODES: CheckCode[] = ['TOKEN', 'ISSUER', 'SIGNATURE', 'HOLDER', 'LEDGER'];

/** The five checks of one certificate, row by row, as they resolve. */
export function useCertificateChecks(sdJwt: string): { rows: CheckRowView[]; verdict: Verdict | null } {
  const [rows, setRows] = useState<CheckRowView[]>(
    CODES.map((code) => ({ code, status: 'PENDING' })),
  );
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const generator = verifyCertificate(sdJwt, { lookup: lookupLedger });
      let step = await generator.next();
      while (!step.done && live) {
        const event = step.value;
        setRows((current) =>
          current.map((row) =>
            row.code === event.code
              ? { code: row.code, status: event.status, measured: event.measured, detail: event.detail }
              : row,
          ),
        );
        step = await generator.next();
      }
      if (live && step.done) setVerdict(step.value);
    })();
    return () => {
      live = false;
    };
  }, [sdJwt]);

  return { rows, verdict };
}
