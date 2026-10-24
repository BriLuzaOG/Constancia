import { CHECK_LABELS } from '@/app/verify/_lib/types';
import { Button, LinkButton } from '@/components/ui/button';
import { ClaimList, type ClaimView } from '@/components/ui/claim-list';
import { Mono } from '@/components/ui/mono';
import { Panel } from '@/components/ui/panel';
import { Verdict as VerdictBand } from '@/components/ui/verdict';
import type { ClaimName, DisclosedClaims } from '@/lib/credential/types';
import type { Verdict } from '@/lib/credential/verify';

type AuthenticVerdict = Extract<Verdict, { kind: 'AUTHENTIC' }>;

const TITLE: Record<Verdict['kind'], string> = {
  AUTHENTIC: 'Authentic',
  NOT_AUTHENTIC: 'Not authentic',
  UNAVAILABLE: 'Cannot verify right now',
};

export const CLAIM_LABELS: Record<ClaimName, string> = {
  givenName: 'Given name',
  familyName: 'Family name',
  nationalId: 'National ID',
  jobTitle: 'Job title',
  department: 'Department',
  employmentType: 'Employment type',
  startDate: 'Start date',
  endDate: 'End date',
  employedNow: 'Employed now',
  workCountry: 'Country of work',
  salaryMonthlyUsd: 'Monthly salary (USD)',
  salaryBand: 'Salary band (USD/month)',
};

function reasonOf(verdict: Verdict): string | undefined {
  switch (verdict.kind) {
    case 'AUTHENTIC':
      return undefined;
    case 'NOT_AUTHENTIC':
      return `Failed at "${CHECK_LABELS[verdict.failedAt]}". ${verdict.reason}`;
    case 'UNAVAILABLE':
      return `${verdict.reason} Try again.`;
  }
}

function formatValue(value: DisclosedClaims[ClaimName]): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function hiddenCaption(count: number): string {
  return count === 1
    ? '1 more claim stays hidden by the holder'
    : `${count} more claims stay hidden by the holder`;
}

function claimRows(claims: DisclosedClaims, hiddenCount: number): ClaimView[] {
  const shown = (Object.keys(claims) as ClaimName[]).map(
    (name): ClaimView => ({
      name,
      label: CLAIM_LABELS[name],
      value: formatValue(claims[name]),
      state: 'shown',
    }),
  );
  const hidden = Array.from(
    { length: hiddenCount },
    (_, index): ClaimView => ({ name: `hidden-${index}`, label: 'Not shown', state: 'hidden' }),
  );
  return [...shown, ...hidden];
}

function HolderLines({ verdict }: { verdict: AuthenticVerdict }) {
  const { claims, keyBound, validUntil } = verdict;
  const namesDisclosed = claims.givenName !== undefined || claims.familyName !== undefined;
  return (
    <div className="mt-6 flex flex-col gap-1 text-small">
      {keyBound ? (
        <p>
          {namesDisclosed ? 'Holder: bound to a key' : 'Holder: bound to a key, not a name'}
        </p>
      ) : null}
      {validUntil ? <p>Valid until {validUntil.slice(0, 10)}</p> : null}
    </div>
  );
}

function IssuerPanel({ verdict }: { verdict: AuthenticVerdict }) {
  const { claims, hiddenCount, issuer } = verdict;
  return (
    <Panel title="Read from the signed certificate">
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-title font-bold">{issuer.name}</span>
        <Mono value={issuer.account} shorten />
      </p>
      <div className="mt-6">
        <ClaimList
          claims={claimRows(claims, hiddenCount)}
          caption={hiddenCount > 0 ? hiddenCaption(hiddenCount) : undefined}
        />
      </div>
      <HolderLines verdict={verdict} />
    </Panel>
  );
}

export function VerdictPanel({
  verdict,
  onCheckAgain,
  checking,
}: {
  verdict: Verdict;
  onCheckAgain: () => void;
  checking: boolean;
}) {
  return (
    <div className="flex flex-col gap-12">
      <VerdictBand kind={verdict.kind} title={TITLE[verdict.kind]} reason={reasonOf(verdict)} />
      {verdict.kind === 'AUTHENTIC' ? <IssuerPanel verdict={verdict} /> : null}
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" disabled={checking} onClick={onCheckAgain}>
          Check again
        </Button>
        <LinkButton variant="quiet" href="/verify/lab">
          Try to forge it →
        </LinkButton>
      </div>
    </div>
  );
}
