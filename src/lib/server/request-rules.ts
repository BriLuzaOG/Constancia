import type { RequestStatus } from '@/generated/prisma/enums';
import { HttpError } from './http';
import { isExpired } from './mailbox';

export interface RequestRow {
  employer: string;
  status: RequestStatus;
  expiresAt: Date;
}

/** Another employer's request, or a missing or expired one, is simply "not found". */
function assertOwn(row: RequestRow | null, account: string, now: Date): asserts row is RequestRow {
  if (!row || row.employer !== account || isExpired(row.expiresAt, now)) {
    throw new HttpError(404, 'NOT_FOUND', 'Unknown request');
  }
}

function assertPending(row: RequestRow) {
  if (row.status !== 'PENDING') throw new HttpError(409, 'NOT_PENDING', 'This request was already handled');
}

export function assertCanDeliver(
  row: RequestRow | null,
  account: string,
  employerActive: boolean,
  now = new Date(),
): void {
  assertOwn(row, account, now);
  assertPending(row);
  if (!employerActive) throw new HttpError(403, 'NOT_ACCREDITED', 'Your organization is not accredited');
}

export function assertCanDecline(row: RequestRow | null, account: string, now = new Date()): void {
  assertOwn(row, account, now);
  assertPending(row);
}
