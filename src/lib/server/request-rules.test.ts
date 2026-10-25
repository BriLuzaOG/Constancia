import { describe, expect, it } from 'vitest';
import { assertCanDecline, assertCanDeliver, type RequestRow } from './request-rules';

const now = new Date('2026-01-10T00:00:00Z');
const row = (patch: Partial<RequestRow> = {}): RequestRow => ({
  employer: '0xaaa',
  status: 'PENDING',
  expiresAt: new Date('2026-01-20T00:00:00Z'),
  ...patch,
});

const code = (run: () => void) => {
  try {
    run();
  } catch (error) {
    return (error as { status: number }).status;
  }
  return 200;
};

describe('deliver rules', () => {
  it('lets the owner deliver a pending request while accredited', () => {
    expect(code(() => assertCanDeliver(row(), '0xaaa', true, now))).toBe(200);
  });
  it('hides other employers requests, missing rows and expired rows as 404', () => {
    expect(code(() => assertCanDeliver(row(), '0xbbb', true, now))).toBe(404);
    expect(code(() => assertCanDeliver(null, '0xaaa', true, now))).toBe(404);
    expect(code(() => assertCanDeliver(row({ expiresAt: now }), '0xaaa', true, now))).toBe(404);
  });
  it('refuses a request that is not pending with 409', () => {
    for (const status of ['ISSUED', 'DECLINED', 'EXPIRED'] as const) {
      expect(code(() => assertCanDeliver(row({ status }), '0xaaa', true, now))).toBe(409);
    }
  });
  it('refuses a non-accredited employer with 403', () => {
    expect(code(() => assertCanDeliver(row(), '0xaaa', false, now))).toBe(403);
  });
});

describe('decline rules', () => {
  it('needs ownership and a pending request', () => {
    expect(code(() => assertCanDecline(row(), '0xaaa', now))).toBe(200);
    expect(code(() => assertCanDecline(row(), '0xbbb', now))).toBe(404);
    expect(code(() => assertCanDecline(row({ status: 'ISSUED' }), '0xaaa', now))).toBe(409);
  });
});
