import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { encodeFunctionData, type Address, type Hex } from 'viem';
import { credentialHashOf, issueCredential } from '../../src/lib/credential/sdjwt';
import { generateSigner, signerFromPrivateJwk, type Es256Signer } from '../../src/lib/credential/keys';
import type { EmploymentRecord, P256PrivateJwk } from '../../src/lib/credential/types';
import { ledgerAbi } from '../../src/lib/ledger/abi';
import { publicClient } from './config.mjs';
import { readAddresses, readIdentities } from './lib.mjs';
import { accountOf, sendAccountCall } from './userop.mjs';

// Seeds the consortium on Sepolia: three employers apply and are approved to quorum, then the
// sample certificate (public, for the Lab) and the demo vault (two past certificates) are issued
// and anchored. Idempotent: it reads the ledger first and keeps files whose certificates are anchored.
const CHAIN_ID = 11155111;
const SAMPLE_FILE = 'public/demo/sample.json';
const VAULT_FILE = 'demo-pack/vault.json';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const ACTIVE = 2;
const PENDING = 1;

const SAMPLE_RECORD: EmploymentRecord = {
  givenName: 'María Fernanda',
  familyName: 'Rojas',
  nationalId: 'V-24.567.890',
  jobTitle: 'Logistics Analyst',
  department: 'Operations',
  employmentType: 'FULL_TIME',
  startDate: '2024-02-01',
  workCountry: 'VE',
  salaryMonthlyUsd: 850,
};
const PAST_RECORDS: EmploymentRecord[] = [
  { ...SAMPLE_RECORD, jobTitle: 'Quality Analyst', department: 'Quality', startDate: '2019-03-04', endDate: '2021-08-27', salaryMonthlyUsd: 420 },
  { ...SAMPLE_RECORD, jobTitle: 'Warehouse Coordinator', department: 'Logistics', startDate: '2021-10-04', endDate: '2024-01-12', salaryMonthlyUsd: 640 },
];

const addresses = readAddresses();
const ledger = (process.env.LEDGER_CONTRACT_ADDRESS ?? addresses.ledger) as Address;
const client = publicClient();
const identities = readIdentities();

const signers = async (list: { jwk: unknown }[]) =>
  Promise.all(list.map((item) => signerFromPrivateJwk(item.jwk as P256PrivateJwk)));
const members = await signers(identities.members);
const employers = await signers(identities.employers);

const issuerOf = async (account: Address) =>
  client.readContract({ address: ledger, abi: ledgerAbi, functionName: 'issuerOf', args: [account] });
const call = (signer: Es256Signer, data: Hex) => sendAccountCall({ signer, target: ledger, data });

async function accredit(signer: Es256Signer, name: string) {
  const account = await accountOf(signer);
  if ((await issuerOf(account)).status === 0) {
    await call(signer, encodeFunctionData({ abi: ledgerAbi, functionName: 'applyForAccreditation', args: [name] }));
    console.log(`applied: ${name}`);
  }
  for (const member of members) {
    const issuer = await issuerOf(account);
    if (issuer.status !== PENDING) break;
    await call(member, encodeFunctionData({ abi: ledgerAbi, functionName: 'approve', args: [account] }));
  }
  const { status } = await issuerOf(account);
  if (status !== ACTIVE) throw new Error(`${name} is not ACTIVE after the votes`);
  console.log(`accredited: ${name}`);
}

async function isAnchored(account: Address, hash: Hex) {
  const record = await client.readContract({ address: ledger, abi: ledgerAbi, functionName: 'recordOf', args: [account, hash] });
  return record.anchoredAt !== BigInt(0);
}

async function issueAndAnchor(employer: Es256Signer, record: EmploymentRecord, holder: { signer: Es256Signer; jwk: P256PrivateJwk }) {
  const account = await accountOf(employer);
  const issued = await issueCredential({
    record,
    issuer: { did: `did:constancia:${CHAIN_ID}:${account.toLowerCase()}`, keyId: employer.keyId },
    signer: employer,
    holderJwk: holder.signer.jwk,
    appUrl: APP_URL,
  });
  await call(employer, encodeFunctionData({ abi: ledgerAbi, functionName: 'anchor', args: [issued.credentialHash, employer.keyId] }));
  console.log(`anchored ${record.jobTitle} ${issued.credentialHash.slice(0, 10)}…`);
  return issued.sdJwt;
}

async function freshHolder() {
  const { signer, privateKey } = await generateSigner({ extractable: true });
  return { signer, jwk: (await crypto.subtle.exportKey('jwk', privateKey)) as P256PrivateJwk };
}

async function allAnchored(sdJwts: string[], accounts: Address[]) {
  const flags = await Promise.all(sdJwts.map((sdJwt, i) => isAnchored(accounts[i], credentialHashOf(sdJwt.split('~')[0]))));
  return flags.every(Boolean);
}

const write = (file: string, data: unknown) => {
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`wrote ${file}`);
};

for (const [i, signer] of employers.entries()) await accredit(signer, identities.employers[i].name);

const accounts = await Promise.all(employers.map(accountOf));
const sample = existsSync(SAMPLE_FILE) ? JSON.parse(readFileSync(SAMPLE_FILE, 'utf8')) : null;
if (!sample || !(await allAnchored([sample.credential], [accounts[0]]))) {
  const holderJwk = identities.holder.jwk as P256PrivateJwk;
  const holder = { signer: await signerFromPrivateJwk(holderJwk), jwk: holderJwk };
  write(SAMPLE_FILE, { credential: await issueAndAnchor(employers[0], SAMPLE_RECORD, holder), holderJwk });
}

const vault: { sdJwt: string; holderPrivateJwk: P256PrivateJwk }[] | null = existsSync(VAULT_FILE)
  ? JSON.parse(readFileSync(VAULT_FILE, 'utf8'))
  : null;
if (!vault || !(await allAnchored(vault.map((entry) => entry.sdJwt), [accounts[1], accounts[2]]))) {
  const entries = [];
  for (const [i, record] of PAST_RECORDS.entries()) {
    const holder = await freshHolder();
    entries.push({ sdJwt: await issueAndAnchor(employers[i + 1], record, holder), holderPrivateJwk: holder.jwk });
  }
  write(VAULT_FILE, entries);
}
console.log('seed done');
