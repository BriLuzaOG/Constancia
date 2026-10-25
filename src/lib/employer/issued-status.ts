import type { LookupResponse } from '../ledger/types';

export type CertificateStatus =
  | { kind: 'ACTIVE' }
  | { kind: 'REVOKED'; revokedAt: number }
  | { kind: 'NOT_ON_LEDGER' };

/** The live state of one issued certificate, read from the ledger lookup. */
export function certificateStatus(response: LookupResponse): CertificateStatus {
  const { record } = response;
  if (!record) return { kind: 'NOT_ON_LEDGER' };
  return record.revokedAt === null ? { kind: 'ACTIVE' } : { kind: 'REVOKED', revokedAt: record.revokedAt };
}

export const formatDate = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString().slice(0, 10);
