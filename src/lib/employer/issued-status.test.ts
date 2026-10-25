import { describe, expect, it } from 'vitest';
import type { LookupResponse, RecordInfo } from '../ledger/types';
import { certificateStatus, formatDate } from './issued-status';

const lookup = (record: RecordInfo | null) => ({ record }) as LookupResponse;
const record = (revokedAt: number | null): RecordInfo => ({
  credentialHash: `0x${'1'.repeat(64)}`,
  issuer: `0x${'2'.repeat(40)}`,
  keyId: `0x${'3'.repeat(64)}`,
  anchoredAt: 1,
  revokedAt,
  blockNumber: 5,
});

describe('certificateStatus', () => {
  it('reads the three states from the lookup', () => {
    expect(certificateStatus(lookup(null))).toEqual({ kind: 'NOT_ON_LEDGER' });
    expect(certificateStatus(lookup(record(null)))).toEqual({ kind: 'ACTIVE' });
    expect(certificateStatus(lookup(record(1_790_000_000)))).toEqual({ kind: 'REVOKED', revokedAt: 1_790_000_000 });
  });

  it('formats the revocation date in UTC', () => {
    expect(formatDate(1_790_000_000)).toBe('2026-09-21');
  });
});
