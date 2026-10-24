'use client';

import { useEffect } from 'react';
import { Button, LinkButton } from '@/components/ui/button';
import { CheckList, CheckRow } from '@/components/ui/check-list';
import { Disclosure } from '@/components/ui/disclosure';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import { Verdict as VerdictBand } from '@/components/ui/verdict';
import type { CareerTimeline, CvVerdict } from '@/lib/credential/passport';
import { useCvVerification } from '../_lib/use-cv-verification';
import { CHECK_LABELS } from '../_lib/types';
import type { LoadedInput } from '../_lib/types';
import { ReceiptPanel } from './receipt-panel';
import { IssuerPanel } from './verdict-panel';

type AuthenticCv = Extract<CvVerdict, { kind: 'AUTHENTIC' }>;

const TITLE = {
  AUTHENTIC: 'Authentic',
  NOT_AUTHENTIC: 'Not authentic',
  UNAVAILABLE: 'Cannot verify right now',
} as const;

function reasonOf(verdict: CvVerdict): string | undefined {
  if (verdict.kind === 'AUTHENTIC') return undefined;
  if (verdict.kind === 'UNAVAILABLE') return `${verdict.reason} Try again.`;
  const where = verdict.failedEntry === null ? '' : `Certificate ${verdict.failedEntry + 1}: `;
  return `${where}failed at "${CHECK_LABELS[verdict.failedAt]}". ${verdict.reason}`;
}

function timelineItems(timeline: CareerTimeline): TimelineItem[] {
  return timeline.items.map((item) => ({
    id: item.id,
    employer: item.employer,
    title: item.jobTitle,
    start: item.startDate,
    end: item.endDate ?? (item.employedNow ? 'present' : undefined),
    status: 'VERIFIED',
    note: item.datesHidden ? 'dates hidden' : undefined,
  }));
}

function Summary({ verdict }: { verdict: AuthenticCv }) {
  const employers = new Set(verdict.entries.map((entry) => entry.issuer.account)).size;
  const count = verdict.entries.length;
  return (
    <p className="text-title font-bold">
      {count} {count === 1 ? 'certificate' : 'certificates'} · {employers}{' '}
      {employers === 1 ? 'employer' : 'employers'} · sealed together
    </p>
  );
}

export function CvView({ input, onReset }: { input: LoadedInput; onReset: () => void }) {
  const { entries, verdict, requests, running, run } = useCvVerification();

  useEffect(() => {
    void run(input);
  }, [input, run]);

  return (
    <div className="flex flex-col gap-8">
      {verdict?.kind === 'AUTHENTIC' ? (
        <>
          <Summary verdict={verdict} />
          <Timeline
            items={timelineItems(verdict.timeline)}
            gaps={verdict.timeline.gaps}
            overlaps={verdict.timeline.overlaps}
          />
        </>
      ) : null}
      {entries.map((rows, index) => {
        const entry = verdict?.kind === 'AUTHENTIC' ? verdict.entries[index] : undefined;
        return (
          <Disclosure key={index} summary={`Certificate ${index + 1}${entry ? ` · ${entry.issuer.name}` : ''}`}>
            <CheckList>
              {rows.map((row, rowIndex) => (
                <CheckRow
                  key={row.code}
                  index={rowIndex + 1}
                  label={row.label}
                  status={row.status}
                  measured={row.measured}
                  detail={row.detail}
                />
              ))}
            </CheckList>
            {entry ? <IssuerPanel verdict={entry} /> : null}
          </Disclosure>
        );
      })}
      {verdict ? (
        <VerdictBand kind={verdict.kind} title={TITLE[verdict.kind]} reason={reasonOf(verdict)} />
      ) : null}
      {verdict ? (
        <div className="flex flex-wrap gap-4">
          <Button
            variant="secondary"
            disabled={running}
            onClick={() => {
              void run(input);
            }}
          >
            Check again
          </Button>
          <LinkButton variant="quiet" href="/verify/lab">
            Try to forge it →
          </LinkButton>
        </div>
      ) : null}
      {verdict ? <ReceiptPanel requests={requests} shareId={input.shareId} claims={null} /> : null}
      <div>
        <Button variant="quiet" onClick={onReset}>
          Check another
        </Button>
      </div>
    </div>
  );
}
