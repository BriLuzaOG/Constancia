// Wire format of the memory ledger's signed operations (browser and Node share it).
import { z } from 'zod';
import { utf8 } from '../credential/jws';
import type { Address } from '../credential/types';

const ADDRESS = z.string().regex(/^0x[0-9a-f]{40}$/);
const BYTES32 = z.string().regex(/^0x[0-9a-f]{64}$/);
const COORDINATE = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const JWK = z.object({ kty: z.literal('EC'), crv: z.literal('P-256'), x: COORDINATE, y: COORDINATE });

export const memoryCallSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('applyForAccreditation'), name: z.string().min(1).max(64) }),
  z.object({ method: z.literal('anchor'), credentialHash: BYTES32, keyId: BYTES32 }),
  z.object({ method: z.literal('revoke'), credentialHash: BYTES32 }),
  z.object({ method: z.literal('approve'), issuer: ADDRESS }),
  z.object({ method: z.literal('suspend'), issuer: ADDRESS }),
  z.object({ method: z.literal('addKey'), jwk: JWK }),
  z.object({ method: z.literal('removeKey'), keyId: BYTES32 }),
]);
export type MemoryCall = z.infer<typeof memoryCallSchema>;

export const signedOpSchema = z.object({
  account: ADDRESS,
  keyId: BYTES32,
  jwk: JWK, // the signing key's public half: deploys the account on its first op
  salt: z.string().regex(/^\d{1,20}$/),
  nonce: z.string().regex(/^[0-9a-f]{32}$/),
  payload: z.string().max(2048), // the exact JSON of the call, as signed
  signature: z.string().max(128), // base64url, 64 bytes r||s
});
export type SignedOp = z.infer<typeof signedOpSchema>;

export const opMessage = (account: Address, nonce: string, payload: string): Uint8Array =>
  utf8(`constancia-op:${account}:${nonce}:${payload}`);

export type LedgerErrorCode =
  | 'BAD_CONSORTIUM'
  | 'NOT_MEMBER'
  | 'BAD_NAME'
  | 'WRONG_STATUS'
  | 'ALREADY_VOTED'
  | 'KEY_NOT_LIVE'
  | 'ALREADY_EXISTS'
  | 'NOT_FOUND'
  | 'ALREADY_REVOKED'
  | 'NOT_AUTHORIZED'
  | 'OWNER_EXISTS'
  | 'OWNER_UNKNOWN'
  | 'LAST_OWNER'
  | 'REPLAY';

/** A rejected operation; the codes mirror the contract's custom errors. */
export class LedgerOpError extends Error {
  constructor(readonly code: LedgerErrorCode) {
    super(code);
  }
}
