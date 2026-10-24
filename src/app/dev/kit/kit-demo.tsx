'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckList, CheckRow } from '@/components/ui/check-list';
import type { RowStatus } from '@/components/ui/check-list';
import { ClaimList } from '@/components/ui/claim-list';
import type { ClaimView } from '@/components/ui/claim-list';
import { DropZone } from '@/components/ui/drop-zone';
import { LineField } from '@/components/ui/line-field';
import type { LineFieldState } from '@/components/ui/line-field';
import { Verdict } from '@/components/ui/verdict';

type FieldMode =
  | 'rest'
  | 'drift'
  | 'progress'
  | 'resolved-ok'
  | 'resolved-fail'
  | 'resolved-unavailable';

const FIELD_MODES: FieldMode[] = [
  'rest',
  'drift',
  'progress',
  'resolved-ok',
  'resolved-fail',
  'resolved-unavailable',
];

const FIELD_STATE_NAME: Record<FieldMode, string> = {
  rest: 'rest',
  drift: 'scanning',
  progress: 'scanning, with progress',
  'resolved-ok': 'resolved-ok',
  'resolved-fail': 'resolved-fail',
  'resolved-unavailable': 'resolved-unavailable',
};

const MAX_PROGRESS = 5;

export function LineFieldDemo() {
  const [mode, setMode] = useState<FieldMode>('rest');
  const [progress, setProgress] = useState(0);

  const state: LineFieldState = mode === 'drift' || mode === 'progress' ? 'scanning' : mode;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        {FIELD_MODES.map((m) => (
          <Button
            key={m}
            variant={m === mode ? 'primary' : 'secondary'}
            aria-pressed={m === mode}
            onClick={() => {
              setMode(m);
            }}
          >
            {FIELD_STATE_NAME[m]}
          </Button>
        ))}
      </div>

      {mode === 'progress' ? (
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            aria-label="Less progress"
            disabled={progress <= 0}
            onClick={() => {
              setProgress((p) => Math.max(0, p - 1));
            }}
          >
            −
          </Button>
          <span className="tnum font-mono text-small">progress {progress}/5</span>
          <Button
            variant="secondary"
            aria-label="More progress"
            disabled={progress >= MAX_PROGRESS}
            onClick={() => {
              setProgress((p) => Math.min(MAX_PROGRESS, p + 1));
            }}
          >
            +
          </Button>
        </div>
      ) : null}

      <LineField
        state={state}
        progress={mode === 'progress' ? progress : undefined}
        interactive
        className="flex h-72 items-center justify-center border-2 border-ink"
      >
        <div className="border-4 border-ink bg-white px-6 py-4 font-display text-title font-extrabold font-stretch-expanded">
          {FIELD_STATE_NAME[mode]}
        </div>
      </LineField>
    </div>
  );
}

const VERIFIER_CHECKS = [
  {
    label: 'Token found',
    measured: '1,842 bytes',
  },
  {
    label: "Issuer key from the university's own domain",
    measured: 'waraira-university.onrender.com',
  },
  {
    label: 'Signature matches',
    measured: '3.1 ms',
  },
  {
    label: 'Document seal intact',
    measured: '212 KB hashed',
  },
  {
    label: 'Public anchor exists',
    measured: 'block 18,442,107',
    href: 'https://sepolia.basescan.org/',
  },
];

const ALL_STATUSES: RowStatus[] = [
  'PENDING',
  'CHECKING',
  'VERIFIED',
  'FAILED',
  'UNAVAILABLE',
  'NOT_EXAMINED',
  'DONE',
];

// the failing run breaks at the third check (index 2); the two after it are never examined
const FAIL_AT = 2;
const TICK_MS = 600;

interface CheckRun {
  mode: 'ok' | 'fail';
  // rows before `tick` are finished; row `tick` is being checked
  tick: number;
}

function statusOf(index: number, run: CheckRun | null): RowStatus {
  if (!run) return 'PENDING';
  if (run.mode === 'fail' && index > FAIL_AT) {
    return run.tick > FAIL_AT ? 'NOT_EXAMINED' : 'PENDING';
  }
  if (index < run.tick) {
    return run.mode === 'fail' && index === FAIL_AT ? 'FAILED' : 'VERIFIED';
  }
  return index === run.tick ? 'CHECKING' : 'PENDING';
}

export function CheckListDemo() {
  const [run, setRun] = useState<CheckRun | null>(null);

  useEffect(() => {
    if (!run) return undefined;
    const lastTick = run.mode === 'ok' ? VERIFIER_CHECKS.length : FAIL_AT + 1;
    if (run.tick >= lastTick) return undefined;
    const timer = setTimeout(() => {
      setRun({ mode: run.mode, tick: run.tick + 1 });
    }, TICK_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [run]);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => {
              setRun({ mode: 'ok', tick: 0 });
            }}
          >
            Run verification
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setRun({ mode: 'fail', tick: 0 });
            }}
          >
            Run failing verification
          </Button>
        </div>
        <CheckList>
          {VERIFIER_CHECKS.map((check, i) => {
            const status = statusOf(i, run);
            return (
              <CheckRow
                key={check.label}
                index={i + 1}
                label={check.label}
                status={status}
                measured={status === 'VERIFIED' ? check.measured : undefined}
                href={check.href}
              />
            );
          })}
        </CheckList>
      </div>

      <CheckList title="Every status">
        {ALL_STATUSES.map((status, i) => (
          <CheckRow key={status} index={i + 1} label="Sample check" status={status} />
        ))}
      </CheckList>
    </div>
  );
}

type VerdictKind = 'AUTHENTIC' | 'NOT_AUTHENTIC' | 'UNAVAILABLE';

const VERDICT_KINDS: VerdictKind[] = ['AUTHENTIC', 'NOT_AUTHENTIC', 'UNAVAILABLE'];

const VERDICT_COPY: Record<VerdictKind, { title: string; reason: string }> = {
  AUTHENTIC: {
    title: 'AUTHENTIC',
    reason: 'Signed by Universidad Waraira (demo institution). Every check passed.',
  },
  NOT_AUTHENTIC: {
    title: 'NOT AUTHENTIC',
    reason: 'Failed at: Document seal. The visible certificate was edited after signing.',
  },
  UNAVAILABLE: {
    title: 'CANNOT VERIFY RIGHT NOW',
    reason: "The issuer's domain did not answer in time. Try again.",
  },
};

export function VerdictDemo() {
  const [kind, setKind] = useState<VerdictKind>('AUTHENTIC');
  const copy = VERDICT_COPY[kind];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        {VERDICT_KINDS.map((k) => (
          <Button
            key={k}
            variant={k === kind ? 'primary' : 'secondary'}
            aria-pressed={k === kind}
            onClick={() => {
              setKind(k);
            }}
          >
            {k}
          </Button>
        ))}
      </div>
      {/* key remounts the verdict so its flood replays on every pick */}
      <Verdict
        key={kind}
        kind={kind}
        title={copy.title}
        reason={copy.reason}
        issuerDomain="waraira-university.onrender.com"
      />
    </div>
  );
}

// one row per state; the two toggles are live, the rest are fixed
export function ClaimListDemo() {
  const [shared, setShared] = useState({ tenure: true, salary: false });

  const claims: ClaimView[] = [
    {
      name: 'employer',
      label: 'Employer',
      value: 'Empresa Demo A',
      state: 'shown',
    },
    {
      name: 'role',
      label: 'Role',
      value: 'Analyst (synthetic)',
      state: 'hidden',
    },
    {
      name: 'tenure',
      label: 'Tenure',
      value: '2 years',
      state: shared.tenure ? 'on' : 'off',
    },
    {
      name: 'salary',
      label: 'Salary band',
      value: 'Band C',
      state: shared.salary ? 'on' : 'off',
    },
  ];

  return (
    <div className="max-w-xl">
      <ClaimList
        caption="Choose what this share shows. Hidden claims stay in your vault."
        claims={claims}
        onToggle={(name, next) => {
          setShared((current) => ({ ...current, [name]: next }));
        }}
      />
    </div>
  );
}

export function DropZoneDemo() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <LineField interactive className="border-2 border-ink p-6 sm:p-12">
          <DropZone
            label="Drop a certificate"
            hint="The file never leaves your browser."
            onFile={setFile}
          />
        </LineField>
        {file ? (
          <p className="text-small">
            <span className="font-bold">{file.name}</span> · {file.size.toLocaleString('en-US')}{' '}
            bytes
          </p>
        ) : null}
      </div>
      <DropZone
        label="Drop a certificate"
        hint="The file never leaves your browser."
        disabled
        onFile={() => undefined}
      />
    </div>
  );
}
