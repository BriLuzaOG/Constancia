import type { CheckEvent, LookupFn, Verdict } from '@/lib/credential/types';

// oxlint-disable-next-line require-yield -- stub until A2-S3 adds the yields
export async function* verifyCredential(
  _pdf: Uint8Array,
  _lookup: LookupFn,
): AsyncGenerator<CheckEvent, Verdict> {
  throw new Error('not implemented: A2-S3');
}
