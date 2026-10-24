import 'server-only';
import type { Hex } from '@/lib/credential/types';

// shortcut: hand-written until A4-S1 generates the Prisma client; then re-export the Prisma types
export interface Institution {
  id: string;
  privyUserId: string;
  name: string;
  domain: string;
  did: string;
  walletAddress: string;
  publicKeyJwk: unknown;
  didVerifiedAt: Date | null;
  subscriptionActive: boolean;
  createdAt: Date;
}

// shortcut: hand-written until A4-S1 generates the Prisma client; then re-export the Prisma types
export interface Issuance {
  credentialId: string;
  institutionId: string;
  status: 'PREPARED' | 'ANCHORED';
  fundingTxHash: string | null;
  anchorTxHash: string | null;
  createdAt: Date;
  anchoredAt: Date | null;
}

export async function getInstitutionForAdmin(privyUserId: string): Promise<Institution | null> {
  void privyUserId;
  throw new Error('not implemented: A4-S1');
}

export async function assertCanIssue(privyUserId: string): Promise<Institution> {
  void privyUserId;
  throw new Error('not implemented: A4-S1');
}

export async function assertPreparedCredential(
  privyUserId: string,
  credentialId: Hex,
): Promise<Issuance> {
  void privyUserId;
  void credentialId;
  throw new Error('not implemented: A4-S1');
}
