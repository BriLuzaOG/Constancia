import { z } from 'zod';
import type { IssuerInfo } from '../ledger/types';
import { EMPLOYER_SIGNER_PREFIX } from './identity';

export const orgNameSchema = z.string().trim().min(2, 'Use at least 2 characters').max(80, 'Use 80 characters or fewer');

export const signerNameFor = (orgName: string): string => {
  const slug = orgName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${EMPLOYER_SIGNER_PREFIX}${slug || 'organization'}`;
};

export interface AccreditationView {
  tone: 'idle' | 'waiting' | 'active' | 'paused';
  headline: string;
  detail: string;
}

export function accreditationView(issuer: IssuerInfo | undefined): AccreditationView {
  switch (issuer?.status) {
    case 'PENDING':
      return {
        tone: 'waiting',
        headline: 'Waiting for the consortium',
        detail: `${issuer.approvals} of ${issuer.quorum} members have approved`,
      };
    case 'ACTIVE':
      return {
        tone: 'active',
        headline: 'Accredited',
        detail: 'Your organization can now issue certificates.',
      };
    case 'SUSPENDED':
      return {
        tone: 'paused',
        headline: 'Paused by the consortium',
        detail: 'Certificates you already issued stay on record, but new ones are on hold. Contact the consortium to resume.',
      };
    default:
      return {
        tone: 'idle',
        headline: 'Not applied yet',
        detail: 'Ask the consortium to accredit your organization.',
      };
  }
}
