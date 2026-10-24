import { z } from 'zod';
import type { AnchorInfo } from '@/lib/chain/anchor';
import type { LookupRequest, LookupResponse } from '@/lib/did/types';

export type Hex = `0x${string}`;

/** Lives only in the registrar's browser. Never sent to any server. */
export interface GraduateRecord {
  fullName: string;
  nationalId: string;
  program: string;
  degreeLevel: 'Technician' | 'Bachelor' | 'Master' | 'Doctorate';
  graduationDate: string;
  honors?: string;
}

export interface IssuerInfo {
  did: string;
  name: string;
  kid: string;
}

export interface SecpJwk {
  kty: 'EC';
  crv: 'secp256k1';
  x: string;
  y: string;
}

/** Signs a 32-byte SHA-256 digest. Returns 64-byte compact r||s (low-s). */
export type DigestSigner = (digest: Uint8Array) => Promise<Uint8Array>;

export interface GraduationCredential {
  '@context': ['https://www.w3.org/ns/credentials/v2', string];
  id: string;
  type: ['VerifiableCredential', 'GraduationCredential'];
  issuer: { id: string; name: string };
  validFrom: string;
  credentialSubject: {
    type: 'Graduate';
    name: string;
    nationalId: string;
    degree: { type: GraduateRecord['degreeLevel']; name: string; honors?: string };
    graduationDate: string;
  };
  documentSeal: { alg: 'sha-256'; digest: string; region: 8192 };
}

export interface SealedCredential {
  pdf: Uint8Array;
  jwt: string;
  credentialId: Hex;
  sealDigest: string;
}

export const graduateRecordSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  nationalId: z.string().trim().min(3).max(32),
  program: z.string().trim().min(2).max(120),
  degreeLevel: z.enum(['Technician', 'Bachelor', 'Master', 'Doctorate']),
  graduationDate: z.iso.date(),
  honors: z
    .string()
    .trim()
    .max(60)
    .transform((s) => (s === '' ? undefined : s))
    .optional(),
});

// verification events (contracts §4.5)
export type CheckCode = 'TOKEN' | 'ISSUER' | 'SIGNATURE' | 'SEAL' | 'ANCHOR';
export type CheckStatus =
  | 'PENDING'
  | 'CHECKING'
  | 'VERIFIED'
  | 'FAILED'
  | 'UNAVAILABLE'
  | 'NOT_EXAMINED';

export interface CheckEvent {
  index: 1 | 2 | 3 | 4 | 5;
  code: CheckCode;
  status: CheckStatus;
  measured?: string;
  detail?: string;
  elapsedMs?: number;
}

export type Verdict =
  | {
      kind: 'AUTHENTIC';
      credential: GraduationCredential;
      issuerDomain: string;
      anchor: AnchorInfo;
    }
  | { kind: 'NOT_AUTHENTIC'; failedAt: CheckCode; reason: string }
  | { kind: 'UNAVAILABLE'; failedAt: 'ISSUER' | 'ANCHOR'; reason: string };

export type LookupFn = (req: LookupRequest) => Promise<LookupResponse>;
