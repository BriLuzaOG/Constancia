import { existsSync, readFileSync } from 'node:fs';
import { Client } from 'pg';
import { formatEther, parseEther, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { entryPoint07Abi, entryPoint07Address } from 'viem/account-abstraction';
import { consortiumAccountAbi, ledgerAbi } from '../src/lib/ledger/abi';
import { credentialHashOf } from '../src/lib/credential/sdjwt';
import { verifyCertificate, type LookupFn } from '../src/lib/credential/verify';
import { publicClient } from './chain/config.mjs';
import { readAddresses } from './chain/lib.mjs';

// Demo pre-flight: one row per thing that can embarrass us on stage. Exit code 1 when any row is red.
const FLOOR = parseEther('0.05');
const MAX_BLOCK_AGE_SEC = 60;
const TIMEOUT_MS = 8_000;
const SAMPLE_FILE = 'public/demo/sample.json';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const addresses = readAddresses();
const ledger = (process.env.LEDGER_CONTRACT_ADDRESS ?? addresses.ledger) as Address;
const paymaster = (process.env.PAYMASTER_ADDRESS ?? addresses.paymaster) as Address;

type Row = { label: string; ok: boolean; detail: string };
const rows: Row[] = [];
async function check(label: string, run: () => Promise<string>) {
  try {
    rows.push({ label, ok: true, detail: await run() });
  } catch (error) {
    rows.push({ label, ok: false, detail: error instanceof Error ? error.message.split('\n')[0] : 'failed' });
  }
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const withTimeout = <T,>(promise: Promise<T>) =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timed out')), TIMEOUT_MS))]);

const client = publicClient();
const topUp = 'run: pnpm chain:deposit 0.1 (paymaster) or use a Sepolia faucet (sponsor)';

for (const [label, url] of [
  ['RPC', process.env.LEDGER_RPC_URL],
  ['RPC backup', process.env.LEDGER_RPC_URL_BACKUP],
] as const) {
  if (!url) {
    if (label === 'RPC') rows.push({ label, ok: false, detail: 'LEDGER_RPC_URL not set' });
    continue;
  }
  await check(`Sepolia ${label}`, async () => {
    const rpcClient = publicClient(url);
    const block = await withTimeout(rpcClient.getBlock());
    const age = Math.floor(Date.now() / 1000) - Number(block.timestamp);
    assert((await rpcClient.getChainId()) === 11155111, 'wrong chain id');
    assert(age <= MAX_BLOCK_AGE_SEC, `block is ${age}s old`);
    return `block ${block.number}, ${age}s old`;
  });
}

const hasCode = async (address: Address) => (await client.getCode({ address })) !== undefined;
await check('EntryPoint code', async () => {
  assert(await hasCode(entryPoint07Address), 'no code at the EntryPoint');
  return entryPoint07Address;
});
await check('Ledger code', async () => {
  assert(ledger && (await hasCode(ledger)), 'no code at LEDGER_CONTRACT_ADDRESS');
  return ledger;
});
await check('Sponsor balance', async () => {
  const sponsor = privateKeyToAccount(process.env.RELAYER_PRIVATE_KEY as Hex).address;
  const balance = await client.getBalance({ address: sponsor });
  assert(balance >= FLOOR, `${formatEther(balance)} ETH is below ${formatEther(FLOOR)}; ${topUp}`);
  return `${formatEther(balance)} ETH`;
});
await check('Paymaster deposit', async () => {
  const deposit = await client.readContract({ address: entryPoint07Address, abi: entryPoint07Abi, functionName: 'balanceOf', args: [paymaster] });
  assert(deposit >= FLOOR, `${formatEther(deposit)} ETH is below ${formatEther(FLOOR)}; ${topUp}`);
  return `${formatEther(deposit)} ETH`;
});
await check('Bundler (relayer)', async () => {
  const response = await withTimeout(
    fetch(`${APP_URL}/api/bundler`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_supportedEntryPoints', params: [] }),
    }),
  );
  const body = (await response.json()) as { result?: string[] };
  assert(body.result?.[0]?.toLowerCase() === entryPoint07Address.toLowerCase(), 'bundler did not answer');
  return 'answers eth_supportedEntryPoints';
});

const b64u = (hex: Hex) => Buffer.from(hex.slice(2), 'hex').toString('base64url');
const STATUS = ['NONE', 'PENDING', 'ACTIVE', 'SUSPENDED'] as const;
const nullIfZero = (value: bigint) => (value === BigInt(0) ? null : Number(value));

// Same answer as POST /api/ledger/lookup, read straight from the chain.
const directLookup: LookupFn = async ({ issuer, keyId, credentialHash }) => {
  const [block, info, quorum, record] = await Promise.all([
    client.getBlock(),
    client.readContract({ address: ledger, abi: ledgerAbi, functionName: 'issuerOf', args: [issuer] }),
    client.readContract({ address: ledger, abi: ledgerAbi, functionName: 'quorum' }),
    client.readContract({ address: ledger, abi: ledgerAbi, functionName: 'recordOf', args: [issuer, credentialHash] }),
  ]);
  const [x, y, addedAt, removedAt] = await client.readContract({ address: issuer, abi: consortiumAccountAbi, functionName: 'ownerInfo', args: [keyId] });
  return {
    head: { number: Number(block.number), time: Number(block.timestamp) },
    issuer: { account: issuer, name: info.name, status: STATUS[info.status], approvals: info.approvals, quorum, accreditedAt: nullIfZero(info.accreditedAt) },
    key: addedAt === BigInt(0) ? null : { keyId, jwk: { kty: 'EC', crv: 'P-256', x: b64u(x), y: b64u(y) }, addedAt: Number(addedAt), removedAt: nullIfZero(removedAt) },
    record: record.anchoredAt === BigInt(0) ? null : { credentialHash, issuer, keyId: record.keyId, anchoredAt: Number(record.anchoredAt), revokedAt: nullIfZero(record.revokedAt), blockNumber: Number(record.blockNumber) },
  } as Awaited<ReturnType<LookupFn>>;
};

const sample = existsSync(SAMPLE_FILE) ? (JSON.parse(readFileSync(SAMPLE_FILE, 'utf8')) as { credential: string }) : null;
const [issuerJwt] = sample?.credential.split('~') ?? [];
const header = issuerJwt ? JSON.parse(Buffer.from(issuerJwt.split('.')[0], 'base64url').toString()) : null;
const [, issuerAccount, keyId] = header ? (/^did:constancia:\d+:(0x[0-9a-f]{40})#(0x[0-9a-f]{64})$/.exec(header.kid) ?? []) : [];

let gatewayAnswers = false;
await check('Gateway lookup (sample)', async () => {
  assert(sample && issuerAccount, `${SAMPLE_FILE} missing: run pnpm chain:seed`);
  const response = await withTimeout(
    fetch(`${APP_URL}/api/ledger/lookup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ issuer: issuerAccount, keyId, credentialHash: credentialHashOf(issuerJwt) }),
    }),
  );
  assert(response.ok, `POST /api/ledger/lookup answered ${response.status}`);
  gatewayAnswers = true;
  return 'answers';
});
await check('Sample verifies (A2 pipeline)', async () => {
  assert(sample, `${SAMPLE_FILE} missing`);
  const lookup: LookupFn = gatewayAnswers
    ? async (request) =>
        (await fetch(`${APP_URL}/api/ledger/lookup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) })).json()
    : directLookup;
  const run = verifyCertificate(sample.credential, { lookup });
  let step = await run.next();
  while (!step.done) step = await run.next();
  assert(step.value.kind === 'AUTHENTIC', step.value.kind === 'AUTHENTIC' ? '' : `${step.value.kind}: ${'reason' in step.value ? step.value.reason : ''}`);
  return gatewayAnswers ? 'AUTHENTIC via the gateway' : 'AUTHENTIC (direct chain read)';
});
await check('APP_URL reachable', async () => {
  const response = await withTimeout(fetch(APP_URL));
  assert(response.ok, `${APP_URL} answered ${response.status}`);
  return APP_URL;
});
await check('DATABASE_URL reachable', async () => {
  assert(process.env.DATABASE_URL, 'DATABASE_URL not set');
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: TIMEOUT_MS });
  await db.connect();
  await db.query('select 1');
  await db.end();
  return 'select 1 ok';
});
await check('Ledger mode', async () => {
  assert(process.env.LEDGER_MODE === 'chain' && process.env.NEXT_PUBLIC_LEDGER_MODE === 'chain', 'LEDGER_MODE and NEXT_PUBLIC_LEDGER_MODE must be chain');
  return 'chain';
});

for (const { label, ok, detail } of rows) console.log(`${ok ? 'GREEN' : 'RED  '}  ${label.padEnd(28)} ${detail}`);
if (rows.some((row) => !row.ok)) process.exit(1);
