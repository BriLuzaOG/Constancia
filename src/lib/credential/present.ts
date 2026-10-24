import type { Es256Signer } from './keys';
import type { ClaimName, DisclosedClaims } from './types';

const EMPLOYMENT: ClaimName[] = ['employedNow', 'startDate', 'endDate', 'workCountry'];

export const REVEAL_TEMPLATES: Record<
  'employment' | 'income' | 'role' | 'identity' | 'full',
  ClaimName[]
> = {
  employment: EMPLOYMENT,
  income: [...EMPLOYMENT, 'salaryBand'],
  role: [...EMPLOYMENT, 'jobTitle', 'department', 'employmentType'],
  identity: ['givenName', 'familyName', 'nationalId'],
  full: [
    'givenName',
    'familyName',
    'nationalId',
    'jobTitle',
    'department',
    'employmentType',
    'startDate',
    'endDate',
    'employedNow',
    'workCountry',
    'salaryMonthlyUsd',
    'salaryBand',
  ],
};

export async function presentCredential(_args: {
  credential: string; // issuance form
  holder: Es256Signer;
  reveal: ClaimName[];
  aud: string;
  ttlSec: number;
  nonce?: string;
  now?: Date;
  cvSet?: string;
}): Promise<string> {
  throw new Error('not implemented: A2-S2');
}

export interface DecodedPresentation {
  issuerJwt: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  claims: DisclosedClaims; // only what the presentation discloses
  hiddenCount: number; // digests in _sd that no disclosure matched
  sdHash: string; // base64url sha256 of "<issuerJwt>~<disclosures>~"
  keyBinding: {
    jwt: string;
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
  } | null;
}

/** Message is a human sentence, shown as the TOKEN failure. */
export class TokenError extends Error {}

export function decodePresentation(_s: string): DecodedPresentation {
  throw new Error('not implemented: A2-S2');
}
