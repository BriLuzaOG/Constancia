import type { ClaimView } from '@/components/ui/claim-list';
import { REVEAL_TEMPLATES } from '@/lib/credential/present';
import type { ClaimName, DisclosedClaims } from '@/lib/credential/types';

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

export const formatClaim = (value: DisclosedClaims[ClaimName]): string =>
  typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

/** Every claim the certificate holds, read-only: the holder may see all of them. */
export function ownClaimViews(claims: DisclosedClaims): ClaimView[] {
  return REVEAL_TEMPLATES.full
    .filter((name) => claims[name] !== undefined)
    .map((name) => ({
      name,
      label: CLAIM_LABELS[name],
      value: formatClaim(claims[name]),
      state: 'shown' as const,
    }));
}
