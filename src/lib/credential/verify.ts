import { keyIdOf, verifyEs256 } from './keys';
import { fromB64u, splitJws, utf8 } from './jws';
import { credentialHashOf } from './sdjwt';
import { decodePresentation, TokenError, type DecodedPresentation } from './present';
import type { Address, DisclosedClaims, Hex, P256Jwk } from './types';
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

// shortcut: chain ID fixed to the demo ledger, read it from env when a second network exists.
const CHAIN_ID = '24024';
const CHECK_CODES: CheckCode[] = ['TOKEN', 'ISSUER', 'SIGNATURE', 'HOLDER', 'LEDGER'];
const DID_PATTERN = /^did:constancia:(\d+):(0x[0-9a-f]{40})$/;
const DEFAULT_SKEW_SEC = 300;
const MAX_INPUT_BYTES = 256 * 1024;
const CONTEXT_SUFFIX = '/contexts/constancia-v1.jsonld';
const KEY_ID_PATTERN = /^0x[0-9a-f]{64}$/;

class CheckFailure extends Error {
  constructor(
    message: string,
    readonly status: 'FAILED' | 'UNAVAILABLE' = 'FAILED',
  ) {
    super(message);
  }
}

interface Entry {
  decoded: DecodedPresentation;
  did: string;
  account: Address;
  keyId: Hex;
  credentialHash: Hex;
  holderJwk: P256Jwk;
  lookup?: LookupResponse;
}

interface Outcome {
  measured?: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatInt = (n: number): string => n.toLocaleString('en-US');

function checkToken(decoded: DecodedPresentation): Entry {
  const { header, payload } = decoded;
  const context = payload['@context'];
  const type = payload.type;
  if (header.alg !== 'ES256' || header.typ !== 'vc+sd-jwt' || header.cty !== 'vc') {
    throw new CheckFailure('The certificate header is not a Constancia credential header');
  }
  if (!Array.isArray(context) || context[0] !== 'https://www.w3.org/ns/credentials/v2') {
    throw new CheckFailure('The certificate does not use the expected credential context');
  }
  if (typeof context[1] !== 'string' || !context[1].endsWith(CONTEXT_SUFFIX)) {
    throw new CheckFailure('The certificate uses an unknown vocabulary');
  }
  if (!Array.isArray(type) || !type.includes('EmploymentCredential')) {
    throw new CheckFailure('This is not an employment certificate');
  }
  const did = payload.issuer;
  const match = typeof did === 'string' ? DID_PATTERN.exec(did) : null;
  if (!match || payload.iss !== did) throw new CheckFailure('The certificate names no valid issuer');
  if (match[1] !== CHAIN_ID) throw new CheckFailure('The issuer belongs to a different network');
  const kid = typeof header.kid === 'string' ? header.kid : '';
  const [kidDid, keyId = ''] = kid.split('#');
  if (kidDid !== did || !KEY_ID_PATTERN.test(keyId)) {
    throw new CheckFailure('The signing key reference does not match the issuer');
  }
  const holderJwk = isObject(payload.cnf) ? payload.cnf.jwk : undefined;
  if (!isObject(holderJwk) || holderJwk.crv !== 'P-256' || holderJwk.kty !== 'EC') {
    throw new CheckFailure('The certificate is not bound to a holder key');
  }
  return {
    decoded,
    did: did as string,
    account: match[2] as Address,
    keyId: keyId as Hex,
    credentialHash: credentialHashOf(decoded.issuerJwt),
    holderJwk: holderJwk as unknown as P256Jwk,
  };
}

const statusReasons = {
  NONE: 'The employer is not accredited by the consortium',
  PENDING: 'The employer’s accreditation is still waiting for approval',
  SUSPENDED: 'The employer’s accreditation was suspended by the consortium',
} as const;

async function checkIssuer(entry: Entry, ctx: VerifyContext): Promise<Outcome> {
  let response: LookupResponse;
  try {
    // Only these three fields ever leave the browser.
    response = await ctx.lookup({
      issuer: entry.account,
      keyId: entry.keyId,
      credentialHash: entry.credentialHash,
    });
  } catch {
    throw new CheckFailure('The ledger did not answer. Try again in a moment', 'UNAVAILABLE');
  }
  entry.lookup = response;
  const { issuer, key } = response;
  if (issuer.status !== 'ACTIVE') throw new CheckFailure(statusReasons[issuer.status]);
  if (!key) throw new CheckFailure('The signing key is not registered to this employer');
  return { measured: issuer.name };
}

async function checkSignature(entry: Entry): Promise<Outcome> {
  const key = entry.lookup!.key!;
  if (keyIdOf(key.jwk) !== entry.keyId) {
    throw new CheckFailure('The ledger key does not match the key named in the certificate');
  }
  const [header, payload, signature] = splitJws(entry.decoded.issuerJwt)!;
  const started = performance.now();
  const valid = await verifyEs256(key.jwk, utf8(`${header}.${payload}`), fromB64u(signature));
  if (!valid) throw new CheckFailure('The employer’s signature does not match this certificate');
  return { measured: `ES256 · ${(performance.now() - started).toFixed(1)} ms` };
}

async function checkHolder(
  entry: Entry,
  ctx: VerifyContext,
  expectCvSet: string | undefined,
): Promise<Outcome> {
  const { keyBinding, sdHash } = entry.decoded;
  if (!keyBinding) throw new CheckFailure('This presentation carries no holder signature');
  const { header, payload, jwt } = keyBinding;
  if (header.alg !== 'ES256' || header.typ !== 'kb+jwt') {
    throw new CheckFailure('The holder signature header is not valid');
  }
  const [h, p, signature] = splitJws(jwt)!;
  if (!(await verifyEs256(entry.holderJwk, utf8(`${h}.${p}`), fromB64u(signature)))) {
    throw new CheckFailure('The holder signature was not made with the key this certificate names');
  }
  if (payload.sd_hash !== sdHash) {
    throw new CheckFailure('The holder signature covers a different set of claims');
  }
  if (typeof payload.aud !== 'string' || payload.aud.length === 0) {
    throw new CheckFailure('The presentation does not say who it was made for');
  }
  if (typeof payload.nonce !== 'string') throw new CheckFailure('The presentation has no nonce');
  if (ctx.expectNonce !== undefined && payload.nonce !== ctx.expectNonce) {
    throw new CheckFailure('The presentation answers a different challenge');
  }
  const ledgerNow = entry.lookup!.head.time;
  if (typeof payload.iat === 'number' && payload.iat > ledgerNow + (ctx.maxSkewSec ?? DEFAULT_SKEW_SEC)) {
    throw new CheckFailure('This share is dated in the future. Check the clock of the device that made it');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= ledgerNow) {
    throw new CheckFailure('This share has expired. Ask the holder for a new one');
  }
  if (expectCvSet !== undefined && payload.cv_set !== expectCvSet) {
    throw new CheckFailure('This certificate was not sealed together with the others');
  }
  return { measured: `key ${entry.keyId.slice(0, 4)}… · bound` };
}

function checkLedger(entry: Entry, maxSkewSec: number): Outcome {
  const { key, record, head } = entry.lookup!;
  const issuedAt = entry.decoded.payload.iat;
  if (typeof issuedAt === 'number' && issuedAt > head.time + maxSkewSec) {
    throw new CheckFailure('This certificate is dated in the future');
  }
  if (!record) throw new CheckFailure('The ledger has no record of this certificate');
  if (record.keyId !== entry.keyId) {
    throw new CheckFailure('The ledger record was anchored with a different key');
  }
  if (key!.addedAt > record.anchoredAt) {
    throw new CheckFailure('The signing key was added after this certificate was recorded');
  }
  if (key!.removedAt !== null && key!.removedAt <= record.anchoredAt) {
    throw new CheckFailure('The signing key had been removed before this certificate was recorded');
  }
  if (record.revokedAt !== null) throw new CheckFailure('The employer revoked this certificate');
  const validUntil = entry.decoded.payload.validUntil;
  if (typeof validUntil === 'string' && Date.parse(validUntil) / 1000 < head.time) {
    throw new CheckFailure('This certificate has expired');
  }
  return { measured: `block ${formatInt(record.blockNumber)}` };
}

/** Shared by presentations, certificates and every entry of a Verified CV. */
export async function* verifyEntry(
  input: string,
  ctx: VerifyContext,
  opts: { requireKeyBinding: boolean; expectCvSet?: string },
): AsyncGenerator<CheckEvent, Verdict> {
  let entry!: Entry;

  const steps: (() => Promise<Outcome> | Outcome)[] = [
    () => {
      if (typeof input !== 'string' || input.trim().length === 0) {
        throw new CheckFailure('Nothing to check: this is not text');
      }
      const bytes = utf8(input).length;
      if (bytes > MAX_INPUT_BYTES) {
        throw new CheckFailure('This is too large to be a certificate (limit 256 KB)');
      }
      let decoded: DecodedPresentation;
      try {
        decoded = decodePresentation(input);
      } catch (error) {
        if (error instanceof TokenError) throw new CheckFailure(error.message);
        throw new CheckFailure('This is not a Constancia certificate');
      }
      entry = checkToken(decoded);
      return { measured: `${formatInt(bytes)} bytes · ${decoded.hiddenCount} hidden` };
    },
    () => checkIssuer(entry, ctx),
    () => checkSignature(entry),
    () => checkHolder(entry, ctx, opts.expectCvSet),
    () => checkLedger(entry, ctx.maxSkewSec ?? DEFAULT_SKEW_SEC),
  ];

  let failure: { code: CheckCode; error: CheckFailure } | null = null;
  for (const [i, run] of steps.entries()) {
    const code = CHECK_CODES[i];
    const index = (i + 1) as CheckEvent['index'];
    if (failure) {
      yield { index, code, status: 'NOT_EXAMINED' };
      continue;
    }
    if (code === 'HOLDER' && !opts.requireKeyBinding) {
      yield {
        index,
        code,
        status: 'NOT_EXAMINED',
        detail: 'Not checked: this certificate is not being presented',
      };
      continue;
    }
    yield { index, code, status: 'CHECKING' };
    const started = performance.now();
    try {
      const outcome = await run();
      yield {
        index,
        code,
        status: 'VERIFIED',
        measured: outcome.measured,
        elapsedMs: performance.now() - started,
      };
    } catch (error) {
      if (!(error instanceof CheckFailure)) throw error;
      failure = { code, error };
      yield {
        index,
        code,
        status: error.status,
        detail: error.message,
        elapsedMs: performance.now() - started,
      };
    }
  }

  if (failure) {
    const { code, error } = failure;
    if (error.status === 'UNAVAILABLE') {
      return { kind: 'UNAVAILABLE', failedAt: code as 'ISSUER' | 'LEDGER', reason: error.message };
    }
    return { kind: 'NOT_AUTHENTIC', failedAt: code, reason: error.message };
  }

  const { decoded, lookup } = entry;
  const validUntil = decoded.payload.validUntil;
  return {
    kind: 'AUTHENTIC',
    claims: decoded.claims,
    hiddenCount: decoded.hiddenCount,
    issuer: { did: entry.did, account: entry.account, name: lookup!.issuer.name },
    record: lookup!.record!,
    keyBound: opts.requireKeyBinding,
    validUntil: typeof validUntil === 'string' ? validUntil : null,
  };
}

export function verifyPresentation(
  input: string,
  ctx: VerifyContext,
): AsyncGenerator<CheckEvent, Verdict> {
  return verifyEntry(input, ctx, { requireKeyBinding: ctx.requireKeyBinding ?? true });
}

// no KB: vault, CV portal
export function verifyCertificate(
  sdJwt: string,
  ctx: Omit<VerifyContext, 'requireKeyBinding'>,
): AsyncGenerator<CheckEvent, Verdict> {
  return verifyEntry(sdJwt, ctx, { requireKeyBinding: false });
}
