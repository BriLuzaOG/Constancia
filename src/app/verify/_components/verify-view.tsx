'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckList, CheckRow } from '@/components/ui/check-list';
import { DropZone } from '@/components/ui/drop-zone';
import { Field } from '@/components/ui/field';
import { LineField } from '@/components/ui/line-field';
import { Panel } from '@/components/ui/panel';
import { takeHandoffFile } from '@/lib/handoff';
import type { LookupFn } from '@/lib/credential/verify';
import { makeSample } from '../_lib/fixture';
import {
  fetchShareText,
  InputError,
  inputFromText,
  parseShareFragment,
  readInputFile,
} from '../_lib/load-input';
import type { LoadedInput } from '../_lib/types';
import { useVerification } from '../_lib/use-verification';
import { CvView } from './cv-view';
import { ReceiptPanel } from './receipt-panel';
import { TechnicalDetails } from './technical-details';
import { VerdictPanel } from './verdict-panel';

const bandState = (running: boolean, verdictKind: string | undefined) => {
  if (verdictKind === 'AUTHENTIC') return 'resolved-ok';
  if (verdictKind === 'NOT_AUTHENTIC') return 'resolved-fail';
  if (verdictKind === 'UNAVAILABLE') return 'resolved-unavailable';
  return running ? 'scanning' : 'rest';
};

const RESOLVED = new Set(['VERIFIED', 'FAILED', 'UNAVAILABLE', 'NOT_EXAMINED']);

export function VerifyView() {
  const verification = useVerification();
  const [input, setInput] = useState<LoadedInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [useFixture, setUseFixture] = useState(false);
  const sampleLookup = useRef<LookupFn | undefined>(undefined);
  const started = useRef(false);

  const start = useCallback(
    (next: LoadedInput, lookup?: LookupFn) => {
      sampleLookup.current = lookup;
      setError(null);
      setInput(next);
      if (next.kind === 'presentation') void verification.run(next, lookup);
    },
    [verification.run],
  );

  const attempt = useCallback(
    async (load: () => Promise<LoadedInput>) => {
      try {
        start(await load());
      } catch (caught) {
        setError(caught instanceof InputError ? caught.message : 'This could not be read.');
      }
    },
    [start],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setUseFixture(new URLSearchParams(window.location.search).has('fixture'));
    const share = parseShareFragment(window.location.hash);
    const file = takeHandoffFile();
    if (share) {
      void attempt(async () =>
        inputFromText(await fetchShareText(share.id, share.key), 'link', share.id),
      );
    } else if (file) {
      void attempt(async () => inputFromText(await readInputFile(file), 'file'));
    }
  }, [attempt]);

  const { rows, verdict, decoded, requests, running } = verification;
  const resolvedCount = rows.filter((row) => RESOLVED.has(row.status)).length;
  const latest = [...rows].reverse().find((row) => row.status !== 'PENDING');

  const reset = () => {
    setInput(null);
    setPasted('');
  };

  if (!input) {
    return (
      <div className="mt-8 flex flex-col gap-8">
        <LineField interactive className="border-y-4 border-ink">
          <div className="px-gutter py-12">
            <DropZone
              onFile={(file) => void attempt(async () => inputFromText(await readInputFile(file), 'file'))}
              label="Drop a certificate to check it"
              hint="The file stays in your browser."
            />
          </div>
        </LineField>
        {error ? (
          <p role="alert" className="max-w-[65ch] text-body font-bold text-red-text">
            {error}
          </p>
        ) : null}
        <Panel title="Or paste it" tone="quiet">
          <Field label="Certificate text" hint="A share link also works: open it directly.">
            <textarea
              rows={4}
              value={pasted}
              onChange={(event) => {
                setPasted(event.target.value);
              }}
              className="font-mono"
            />
          </Field>
          <div className="mt-4 flex flex-wrap gap-4">
            <Button
              disabled={pasted.trim().length === 0}
              onClick={() => void attempt(async () => inputFromText(pasted, 'paste'))}
            >
              Check pasted text
            </Button>
            {useFixture ? (
              <Button
                variant="secondary"
                onClick={() =>
                  void (async () => {
                    const sample = await makeSample();
                    start(sample.input, sample.lookup);
                  })()
                }
              >
                Try a sample
              </Button>
            ) : null}
          </div>
        </Panel>
      </div>
    );
  }

  if (input.kind === 'cv') {
    return (
      <div className="mt-8">
        <CvView input={input} onReset={reset} />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <LineField
        state={bandState(running, verdict?.kind)}
        progress={running ? resolvedCount : undefined}
        className="h-24 border-y-4 border-ink"
      />
      <p role="status" className="sr-only">
        {latest ? `${latest.label}: ${latest.status.toLowerCase()}. ${latest.detail ?? ''}` : ''}
      </p>
      <CheckList>
        {rows.map((row, index) => (
          <CheckRow
            key={row.code}
            index={index + 1}
            label={row.label}
            status={row.status}
            measured={row.measured}
            detail={row.detail}
          />
        ))}
      </CheckList>
      {verdict ? (
        <VerdictPanel
          verdict={verdict}
          checking={running}
          onCheckAgain={() => {
            start(input, sampleLookup.current);
          }}
        />
      ) : null}
      {verdict ? (
        <ReceiptPanel
          requests={requests}
          shareId={input.shareId}
          claims={verdict.kind === 'AUTHENTIC' ? verdict.claims : null}
        />
      ) : null}
      {verdict?.kind === 'AUTHENTIC' && decoded ? (
        <TechnicalDetails verdict={verdict} decoded={decoded} />
      ) : null}
      <div>
        <Button variant="quiet" onClick={reset}>
          Check another
        </Button>
      </div>
    </div>
  );
}
