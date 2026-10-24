import type { IssuerInfo, IssuerStatus, KeyInfo, LookupRequest, RecordInfo, Head } from '../ledger/types';
import { generateSigner, type Es256Signer } from './keys';
import { issueCredential, type IssuedCredential } from './sdjwt';
import type { LookupFn } from './verify';
import type { Address, EmploymentRecord } from './types';

export const APP_URL = 'http://localhost:3000';
export const ACCOUNT: Address = '0x1f9a000000000000000000000000000000000001';
export const DID = `did:constancia:24024:${ACCOUNT}`;
export const ISSUER_NAME = 'Empresa Demo A';
export const BLOCK_NUMBER = 1204;

const EMPLOYMENT: EmploymentRecord = {
  givenName: 'María Fernanda',
  familyName: 'Rojas',
  nationalId: 'V-24.567.890',
  jobTitle: 'Logistics Analyst',
  department: 'Operations',
  employmentType: 'FULL_TIME',
  startDate: '2020-03-01',
  workCountry: 'VE',
  salaryMonthlyUsd: 1250,
};

export interface LookupOverrides {
  head?: Partial<Head>;
  issuer?: Partial<IssuerInfo>;
  key?: Partial<KeyInfo> | null;
  record?: Partial<RecordInfo> | null;
  throws?: Error;
}

export interface World {
  issuerSigner: Es256Signer;
  holderSigner: Es256Signer;
  did: string;
  account: Address;
  credential: IssuedCredential;
  anchoredAt: number;
  addedAt: number;
  calls: LookupRequest[];
  lookup: LookupFn;
  setLookup(overrides: LookupOverrides): void;
}

export async function makeWorld(): Promise<World> {
  const issuerSigner = (await generateSigner()).signer;
  const holderSigner = (await generateSigner()).signer;
  const credential = await issueCredential({
    record: EMPLOYMENT,
    issuer: { did: DID, keyId: issuerSigner.keyId },
    signer: issuerSigner,
    holderJwk: holderSigner.jwk,
    appUrl: APP_URL,
  });

  const nowSec = Math.floor(Date.now() / 1000);
  const anchoredAt = nowSec - 60;
  const addedAt = nowSec - 120;
  const head: Head = { number: 1300, time: nowSec + 5 };
  const issuer: IssuerInfo = {
    account: ACCOUNT,
    name: ISSUER_NAME,
    status: 'ACTIVE' as IssuerStatus,
    approvals: 3,
    quorum: 3,
    accreditedAt: addedAt,
  };
  const key: KeyInfo = { keyId: issuerSigner.keyId, jwk: issuerSigner.jwk, addedAt, removedAt: null };
  const record: RecordInfo = {
    credentialHash: credential.credentialHash,
    issuer: ACCOUNT,
    keyId: issuerSigner.keyId,
    anchoredAt,
    revokedAt: null,
    blockNumber: BLOCK_NUMBER,
  };

  let overrides: LookupOverrides = {};
  const calls: LookupRequest[] = [];

  const lookup: LookupFn = async (req) => {
    calls.push(req);
    if (overrides.throws) throw overrides.throws;
    const isThisCredential = req.credentialHash === credential.credentialHash;
    const recordFound = overrides.record !== null && isThisCredential;
    return {
      head: { ...head, ...overrides.head },
      issuer: { ...issuer, ...overrides.issuer },
      key: overrides.key === null ? null : { ...key, ...overrides.key },
      record: recordFound ? { ...record, ...overrides.record } : null,
    };
  };

  return {
    issuerSigner,
    holderSigner,
    did: DID,
    account: ACCOUNT,
    credential,
    anchoredAt,
    addedAt,
    calls,
    lookup,
    setLookup(next) {
      overrides = next;
    },
  };
}
