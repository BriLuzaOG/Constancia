import type { Address, DisclosedClaims } from './types';
import type { LookupRequest, LookupResponse, RecordInfo } from '../ledger/types';

export type CheckCode = 'TOKEN' | 'ISSUER' | 'SIGNATURE' | 'HOLDER' | 'LEDGER';
export type CheckStatus =
  | 'PENDING'
  | 'CHECKING'
  | 'VERIFIED'
  | 'FAILED'
  | 'UNAVAILABLE'
  | 'NOT_EXAMINED';

export interface CheckEvent {
  index: 1 | 2 | 3 | 4 | 5; // TOKEN=1 ISSUER=2 SIGNATURE=3 HOLDER=4 LEDGER=5
  code: CheckCode;
  status: CheckStatus;
  measured?: string; // "1,842 bytes · 7 hidden" · "Empresa Demo A" · "ES256 · 1.1 ms" · "key 0x9c… · bound" · "block 1,204"
  detail?: string; // one human sentence
  elapsedMs?: number;
}

export type Verdict =
  | {
      kind: 'AUTHENTIC';
      claims: DisclosedClaims;
      hiddenCount: number;
      issuer: { did: string; account: Address; name: string };
      record: RecordInfo;
      keyBound: boolean;
      validUntil: string | null;
    }
  | { kind: 'NOT_AUTHENTIC'; failedAt: CheckCode; reason: string }
  | { kind: 'UNAVAILABLE'; failedAt: 'ISSUER' | 'LEDGER'; reason: string }; // ledger gateway unreachable

export type LookupFn = (req: LookupRequest) => Promise<LookupResponse>; // the verifier injects lookupLedger

export interface VerifyContext {
  lookup: LookupFn;
  expectNonce?: string;
  requireKeyBinding?: boolean /* default true */;
  maxSkewSec?: number /* default 300 */;
}

export function verifyPresentation(
  _input: string,
  _ctx: VerifyContext,
): AsyncGenerator<CheckEvent, Verdict> {
  throw new Error('not implemented: A2-S3');
}

// no KB: vault, CV portal
export function verifyCertificate(
  _sdJwt: string,
  _ctx: Omit<VerifyContext, 'requireKeyBinding'>,
): AsyncGenerator<CheckEvent, Verdict> {
  throw new Error('not implemented: A2-S3');
}
