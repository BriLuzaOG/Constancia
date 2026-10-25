import { base64url } from 'jose';
import { sha256 } from '@noble/hashes/sha2.js';
import { describe, expect, it } from 'vitest';
import { generateSigner, verifyEs256 } from './keys';
import type { Es256Signer } from './keys';
import { issueCredential, salaryBandOf } from './sdjwt';
import type { IssuedCredential } from './sdjwt';
import type { ClaimName, EmploymentRecord } from './types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const APP_URL = 'https://constancia.test';
const ACCOUNT = '0x1f9a000000000000000000000000000000000001';
const DID = `did:constancia:11155111:${ACCOUNT}`;

const pastEmployment: EmploymentRecord = {
  givenName: 'María Fernanda',
  familyName: 'Rojas',
  nationalId: 'V-24.567.890',
  jobTitle: 'Logistics Analyst',
  department: 'Operations',
  employmentType: 'FULL_TIME',
  startDate: '2020-03-01',
  endDate: '2024-06-30',
  workCountry: 'VE',
  salaryMonthlyUsd: 1250,
};
const currentEmployment: EmploymentRecord = { ...pastEmployment, endDate: undefined };

const EXPECTED_PAST_CLAIMS: Record<ClaimName, unknown> = {
  givenName: 'María Fernanda',
  familyName: 'Rojas',
  nationalId: 'V-24.567.890',
  jobTitle: 'Logistics Analyst',
  department: 'Operations',
  employmentType: 'FULL_TIME',
  startDate: '2020-03-01',
  endDate: '2024-06-30',
  employedNow: false,
  workCountry: 'VE',
  salaryMonthlyUsd: 1250,
  salaryBand: '1000-2000',
};

type JsonObject = Record<string, unknown>;

const toJson = (segment: string): JsonObject =>
  JSON.parse(decoder.decode(base64url.decode(segment))) as JsonObject;

const digestOf = (disclosure: string): string =>
  base64url.encode(sha256(encoder.encode(disclosure)));

async function issue(record: EmploymentRecord): Promise<{
  credential: IssuedCredential;
  signer: Es256Signer;
}> {
  const { signer } = await generateSigner();
  const { signer: holder } = await generateSigner();
  const credential = await issueCredential({
    record,
    issuer: { did: DID, keyId: signer.keyId },
    signer,
    holderJwk: holder.jwk,
    appUrl: APP_URL,
  });
  return { credential, signer };
}

const splitSdJwt = (sdJwt: string): { issuerJwt: string; disclosures: string[] } => {
  const [issuerJwt, ...rest] = sdJwt.split('~');
  return { issuerJwt, disclosures: rest.slice(0, -1) };
};

const decodeDisclosure = (disclosure: string): [string, string, unknown] =>
  JSON.parse(decoder.decode(base64url.decode(disclosure))) as [string, string, unknown];

describe('issueCredential', () => {
  it('keeps the issuer JWT free of the employee strings', async () => {
    const { credential } = await issue(pastEmployment);
    const [, payload] = credential.issuerJwt.split('.');
    const payloadText = decoder.decode(base64url.decode(payload));

    for (const secret of [pastEmployment.familyName, pastEmployment.nationalId, pastEmployment.jobTitle]) {
      expect(payloadText).not.toContain(secret);
    }
  });

  it('puts exactly the twelve claim digests in _sd, sorted, one per disclosure', async () => {
    const { credential } = await issue(pastEmployment);
    const { issuerJwt, disclosures } = splitSdJwt(credential.sdJwt);
    const subject = toJson(issuerJwt.split('.')[1]).credentialSubject as {
      _sd: string[];
    };
    const expectedDigests = disclosures.map(digestOf).sort();

    expect(disclosures).toHaveLength(12);
    expect(subject._sd).toHaveLength(12);
    expect(subject._sd).toEqual(expectedDigests);
    expect(new Set(subject._sd).size).toBe(12);
  });

  it('decodes all twelve claims from the disclosures', async () => {
    const { credential } = await issue(pastEmployment);
    const { disclosures } = splitSdJwt(credential.sdJwt);
    const claims = Object.fromEntries(
      disclosures.map((d) => {
        const [, name, value] = decodeDisclosure(d);
        return [name, value];
      }),
    );

    expect(claims).toEqual(EXPECTED_PAST_CLAIMS);
  });

  it('keeps the issuer JWT under 3 KB and the full SD-JWT under 6 KB', async () => {
    const { credential } = await issue(pastEmployment);
    expect(encoder.encode(credential.issuerJwt).length).toBeLessThan(3072);
    expect(encoder.encode(credential.sdJwt).length).toBeLessThan(6144);
  });

  it('gives a current employment validUntil and exp', async () => {
    const { credential } = await issue(currentEmployment);
    const payload = toJson(credential.issuerJwt.split('.')[1]);

    expect(credential.validUntil).not.toBeNull();
    expect(payload.validUntil).toBe(credential.validUntil);
    expect(typeof payload.exp).toBe('number');
    expect(credential.claims.employedNow).toBe(true);
    expect(credential.claims).not.toHaveProperty('endDate');
  });

  it('gives an ended employment neither validUntil nor exp', async () => {
    const { credential } = await issue(pastEmployment);
    const payload = toJson(credential.issuerJwt.split('.')[1]);

    expect(credential.validUntil).toBeNull();
    expect(payload).not.toHaveProperty('validUntil');
    expect(payload).not.toHaveProperty('exp');
  });

  it('signs the header with the expected fields', async () => {
    const { credential, signer } = await issue(pastEmployment);
    const header = toJson(credential.issuerJwt.split('.')[0]);

    expect(header).toEqual({
      alg: 'ES256',
      typ: 'vc+sd-jwt',
      cty: 'vc',
      kid: `${DID}#${signer.keyId}`,
    });
  });

  it('produces an ES256 signature that verifies with the issuer key', async () => {
    const { credential, signer } = await issue(pastEmployment);
    const [header, payload, signature] = credential.issuerJwt.split('.');

    expect(
      await verifyEs256(
        signer.jwk,
        encoder.encode(`${header}.${payload}`),
        base64url.decode(signature),
      ),
    ).toBe(true);
  });

  it('rejects an invalid record with a future startDate', async () => {
    const { signer } = await generateSigner();
    const { signer: holder } = await generateSigner();
    await expect(
      issueCredential({
        record: { ...pastEmployment, startDate: '2999-01-01' },
        issuer: { did: DID, keyId: signer.keyId },
        signer,
        holderJwk: holder.jwk,
        appUrl: APP_URL,
      }),
    ).rejects.toThrow();
  });
});

describe('salaryBandOf', () => {
  it.each([
    [299, '<300'],
    [300, '300-600'],
    [599, '300-600'],
    [600, '600-1000'],
    [999, '600-1000'],
    [1000, '1000-2000'],
    [1999, '1000-2000'],
    [2000, '2000+'],
  ])('maps %i USD to %s', (monthlyUsd, band) => {
    expect(salaryBandOf(monthlyUsd)).toBe(band);
  });
});
