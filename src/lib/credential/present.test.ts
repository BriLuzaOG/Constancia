import { describe, expect, it } from 'vitest';
import { fromB64u, sha256B64u, splitJws, utf8 } from './jws';
import { generateSigner, type Es256Signer, verifyEs256 } from './keys';
import {
  decodePresentation,
  presentCredential,
  REVEAL_TEMPLATES,
  TokenError,
} from './present';
import { issueCredential, type IssuedCredential } from './sdjwt';
import type { ClaimName, EmploymentRecord, P256Jwk } from './types';

const NOW = new Date('2026-10-24T20:00:00Z');
const APP_URL = 'http://localhost:3000';
const ISSUER_DID = 'did:constancia:24024:0x1f9a000000000000000000000000000000000001';
const TTL_SEC = 3600;

// Current employment: endDate absent, so the issued claims are the other eleven.
const RECORD: EmploymentRecord = {
  givenName: 'María Fernanda',
  familyName: 'Rojas',
  nationalId: 'V-24.567.890',
  jobTitle: 'Logistics Analyst',
  department: 'Operations',
  employmentType: 'FULL_TIME',
  startDate: '2024-03-01',
  workCountry: 'VE',
  salaryMonthlyUsd: 850,
};

async function fixture(): Promise<{
  holder: Es256Signer;
  credential: IssuedCredential;
}> {
  const issuer = (await generateSigner()).signer;
  const holder = (await generateSigner()).signer;
  const credential = await issueCredential({
    record: RECORD,
    issuer: { did: ISSUER_DID, keyId: issuer.keyId },
    signer: issuer,
    holderJwk: holder.jwk,
    appUrl: APP_URL,
    now: NOW,
  });
  return { holder, credential };
}

const presentFor = (
  credential: IssuedCredential,
  holder: Es256Signer,
  reveal: ClaimName[],
  extra: { nonce?: string; cvSet?: string } = {},
): Promise<string> =>
  presentCredential({
    credential: credential.sdJwt,
    holder,
    reveal,
    aud: 'Banco Demo',
    ttlSec: TTL_SEC,
    now: NOW,
    ...extra,
  });

const disclosuresOf = (presentation: string): string[] => presentation.split('~').slice(1, -1);

const decodeText = (segment: string): string => new TextDecoder().decode(fromB64u(segment));

const prefixOf = (presentation: string): string =>
  presentation.slice(0, presentation.lastIndexOf('~') + 1);

const kbPayloadOf = (presentation: string) => decodePresentation(presentation).keyBinding?.payload;

async function kbSignatureValid(presentation: string, jwk: P256Jwk): Promise<boolean> {
  const jwt = decodePresentation(presentation).keyBinding?.jwt ?? '';
  const [header, body, signature] = splitJws(jwt) ?? [];
  if (!header || !body || !signature) return false;
  return verifyEs256(jwk, utf8(`${header}.${body}`), fromB64u(signature));
}

const issuedNames = (credential: IssuedCredential): ClaimName[] =>
  Object.keys(credential.claims) as ClaimName[];

describe('presentCredential and decodePresentation', () => {
  it.each(Object.entries(REVEAL_TEMPLATES))(
    'the %s template reveals exactly its issued claims',
    async (_name, template) => {
      const { holder, credential } = await fixture();
      const presentation = await presentFor(credential, holder, template);
      const decoded = decodePresentation(presentation);
      const expected = template.filter((claim) => issuedNames(credential).includes(claim)).sort();

      expect(Object.keys(decoded.claims).sort()).toEqual(expected);
      expect(decoded.hiddenCount).toBe(issuedNames(credential).length - expected.length);
    },
  );

  it('current employment reveals no endDate', async () => {
    const { holder, credential } = await fixture();
    const decoded = decodePresentation(await presentFor(credential, holder, REVEAL_TEMPLATES.employment));
    expect(decoded.claims).toEqual({ employedNow: true, startDate: '2024-03-01', workCountry: 'VE' });
  });

  it('the employment presentation leaks none of the hidden identity values', async () => {
    const { holder, credential } = await fixture();
    const presentation = await presentFor(credential, holder, REVEAL_TEMPLATES.employment);
    const hidden = [RECORD.familyName, RECORD.nationalId, RECORD.jobTitle];

    for (const value of hidden) {
      expect(presentation).not.toContain(value);
      for (const disclosure of disclosuresOf(presentation)) {
        expect(decodeText(disclosure)).not.toContain(value);
      }
    }
  });

  it('verifies the key-binding JWT with the holder key from cnf.jwk', async () => {
    const { holder, credential } = await fixture();
    const presentation = await presentFor(credential, holder, REVEAL_TEMPLATES.income);
    const cnfJwk = (decodePresentation(presentation).payload.cnf as { jwk: P256Jwk }).jwk;

    expect(await kbSignatureValid(presentation, cnfJwk)).toBe(true);
  });

  it('binds the key-binding payload to the presentation prefix', async () => {
    const { holder, credential } = await fixture();
    const presentation = await presentFor(credential, holder, REVEAL_TEMPLATES.role);
    const decoded = decodePresentation(presentation);

    expect(decoded.keyBinding?.payload.sd_hash).toBe(decoded.sdHash);
    expect(decoded.sdHash).toBe(sha256B64u(prefixOf(presentation)));
  });

  it('sets aud, nonce, iat and exp = iat + ttlSec in the key-binding payload', async () => {
    const { holder, credential } = await fixture();
    const presentation = await presentFor(credential, holder, REVEAL_TEMPLATES.employment);
    const iat = Math.floor(NOW.getTime() / 1000);

    expect(kbPayloadOf(presentation)).toMatchObject({
      aud: 'Banco Demo',
      iat,
      exp: iat + TTL_SEC,
    });
    expect(kbPayloadOf(presentation)?.nonce).toEqual(expect.any(String));
  });

  it('uses an explicit nonce as given', async () => {
    const { holder, credential } = await fixture();
    const presentation = await presentFor(credential, holder, REVEAL_TEMPLATES.employment, {
      nonce: 'verifier-nonce-1',
    });
    expect(kbPayloadOf(presentation)?.nonce).toBe('verifier-nonce-1');
  });

  it('includes cv_set only when one is passed', async () => {
    const { holder, credential } = await fixture();
    const plain = await presentFor(credential, holder, REVEAL_TEMPLATES.employment);
    const inCv = await presentFor(credential, holder, REVEAL_TEMPLATES.employment, {
      cvSet: 'cv-set-digest',
    });

    expect(kbPayloadOf(plain)).not.toHaveProperty('cv_set');
    expect(kbPayloadOf(inCv)).toMatchObject({ cv_set: 'cv-set-digest' });
  });

  it('rejects a disclosure whose bytes were changed', async () => {
    const { holder, credential } = await fixture();
    const [issuerJwt, first, ...rest] = (await presentFor(credential, holder, REVEAL_TEMPLATES.employment)).split('~');
    const flipped = (first.startsWith('W') ? 'X' : 'W') + first.slice(1);
    const tampered = [issuerJwt, flipped, ...rest].join('~');

    expect(() => decodePresentation(tampered)).toThrow(TokenError);
  });

  it('rejects a disclosure taken from a different credential', async () => {
    const { holder, credential } = await fixture();
    const other = await fixture();
    const otherPresentation = await presentFor(other.credential, other.holder, ['startDate']);
    const [, foreignDisclosure] = otherPresentation.split('~');

    const presentation = await presentFor(credential, holder, ['startDate']);
    const [issuerJwt, , kbJwt] = presentation.split('~');
    const forged = [issuerJwt, foreignDisclosure, kbJwt].join('~');

    expect(() => decodePresentation(forged)).toThrow(TokenError);
  });

  it('rejects a duplicated disclosure', async () => {
    const { holder, credential } = await fixture();
    const [issuerJwt, disclosure, kbJwt] = (await presentFor(credential, holder, ['startDate'])).split('~');
    const duplicated = [issuerJwt, disclosure, disclosure, kbJwt].join('~');

    expect(() => decodePresentation(duplicated)).toThrow(TokenError);
  });

  it('rejects random text', () => {
    expect(() => decodePresentation('hello')).toThrow(TokenError);
  });

  it('reads an issuance form as a presentation without key binding', async () => {
    const { credential } = await fixture();
    const decoded = decodePresentation(credential.sdJwt);

    expect(decoded.keyBinding).toBeNull();
    expect(Object.keys(decoded.claims).sort()).toEqual(issuedNames(credential).sort());
    expect(decoded.hiddenCount).toBe(0);
  });
});
