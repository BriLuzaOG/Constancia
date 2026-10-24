import type { Es256Signer } from './keys';
import { fromB64u, parseJsonSegment, sha256B64u, signJws, splitJws, toB64u } from './jws';
import type { ClaimName, DisclosedClaims } from './types';

const EMPLOYMENT: ClaimName[] = ['employedNow', 'startDate', 'endDate', 'workCountry'];

export const REVEAL_TEMPLATES: Record<
  'employment' | 'income' | 'role' | 'identity' | 'full',
  ClaimName[]
> = {
  employment: EMPLOYMENT,
  income: [...EMPLOYMENT, 'salaryBand'],
  role: [...EMPLOYMENT, 'jobTitle', 'department', 'employmentType'],
  identity: ['givenName', 'familyName', 'nationalId'],
  full: [
    'givenName',
    'familyName',
    'nationalId',
    'jobTitle',
    'department',
    'employmentType',
    'startDate',
    'endDate',
    'employedNow',
    'workCountry',
    'salaryMonthlyUsd',
    'salaryBand',
  ],
};

const CLAIM_NAMES = new Set<string>(REVEAL_TEMPLATES.full);

/** Message is a human sentence, shown as the TOKEN failure. */
export class TokenError extends Error {}

type JsonObject = Record<string, unknown>;

interface ParsedDisclosure {
  digest: string;
  name: ClaimName;
  value: string | number | boolean;
}

function parseDisclosure(encoded: string): ParsedDisclosure {
  let decoded: unknown;
  try {
    decoded = JSON.parse(new TextDecoder().decode(fromB64u(encoded)));
  } catch {
    throw new TokenError('A disclosure is not readable');
  }
  const [, name, value] = Array.isArray(decoded) && decoded.length === 3 ? decoded : [];
  const validValue = ['string', 'number', 'boolean'].includes(typeof value);
  if (typeof name !== 'string' || !CLAIM_NAMES.has(name) || !validValue) {
    throw new TokenError('A disclosure is malformed or names an unknown claim');
  }
  return { digest: sha256B64u(encoded), name: name as ClaimName, value };
}

const parseSegment = (segment: string, what: string): JsonObject => {
  try {
    return parseJsonSegment(segment);
  } catch {
    throw new TokenError(`The ${what} is not readable`);
  }
};

export async function presentCredential(args: {
  credential: string; // issuance form
  holder: Es256Signer;
  reveal: ClaimName[];
  aud: string;
  ttlSec: number;
  nonce?: string;
  now?: Date;
  cvSet?: string;
}): Promise<string> {
  const [issuerJwt, ...rest] = args.credential.split('~');
  const chosen = rest
    .filter((encoded) => encoded.length > 0)
    .filter((encoded) => args.reveal.includes(parseDisclosure(encoded).name));
  const prefix = [issuerJwt, ...chosen, ''].join('~');
  const iat = Math.floor((args.now ?? new Date()).getTime() / 1000);
  const payload = {
    iat,
    exp: iat + args.ttlSec,
    aud: args.aud,
    nonce: args.nonce ?? toB64u(crypto.getRandomValues(new Uint8Array(16))),
    sd_hash: sha256B64u(prefix),
    ...(args.cvSet !== undefined && { cv_set: args.cvSet }),
  };
  const kbJwt = await signJws({ alg: 'ES256', typ: 'kb+jwt' }, payload, args.holder);
  return prefix + kbJwt;
}

export interface DecodedPresentation {
  issuerJwt: string;
  header: JsonObject;
  payload: JsonObject;
  claims: DisclosedClaims; // only what the presentation discloses
  hiddenCount: number; // digests in _sd that no disclosure matched
  sdHash: string; // base64url sha256 of "<issuerJwt>~<disclosures>~"
  keyBinding: { jwt: string; header: JsonObject; payload: JsonObject } | null;
}

function decodeKeyBinding(jwt: string): NonNullable<DecodedPresentation['keyBinding']> {
  const parts = splitJws(jwt);
  if (!parts) throw new TokenError('The key-binding signature is malformed');
  return {
    jwt,
    header: parseSegment(parts[0], 'key-binding header'),
    payload: parseSegment(parts[1], 'key-binding payload'),
  };
}

export function decodePresentation(s: string): DecodedPresentation {
  const segments = s.trim().split('~');
  if (segments.length < 2) throw new TokenError('This is not a Constancia certificate');
  const [issuerJwt, ...disclosures] = segments;
  const kbJwt = disclosures.pop() ?? '';

  const parts = splitJws(issuerJwt);
  if (!parts) throw new TokenError('This is not a Constancia certificate');
  const header = parseSegment(parts[0], 'certificate header');
  const payload = parseSegment(parts[1], 'certificate body');

  const digests = (payload.credentialSubject as { _sd?: unknown } | undefined)?._sd;
  if (!Array.isArray(digests) || !digests.every((d) => typeof d === 'string')) {
    throw new TokenError('The certificate does not list its claims');
  }
  const listed = new Set<string>(digests);

  const claims: DisclosedClaims = {};
  const seen = new Set<string>();
  for (const encoded of disclosures) {
    const disclosure = parseDisclosure(encoded);
    if (!listed.has(disclosure.digest)) {
      throw new TokenError('A disclosed value was changed after the employer signed it');
    }
    if (seen.has(disclosure.digest)) throw new TokenError('A disclosure appears twice');
    seen.add(disclosure.digest);
    claims[disclosure.name] = disclosure.value;
  }

  return {
    issuerJwt,
    header,
    payload,
    claims,
    hiddenCount: listed.size - seen.size,
    sdHash: sha256B64u([issuerJwt, ...disclosures, ''].join('~')),
    keyBinding: kbJwt ? decodeKeyBinding(kbJwt) : null,
  };
}
