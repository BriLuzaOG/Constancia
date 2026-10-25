import { encodeFunctionData, encodePacked, formatEther, keccak256, toHex, type Address, type Hex } from 'viem';
import { entryPoint07Abi, entryPoint07Address, getUserOperationHash } from 'viem/account-abstraction';
import { sepolia } from 'viem/chains';
import { accountFactoryAbi, consortiumAccountAbi } from '../../src/lib/ledger/abi';
import { publicClient } from './config.mjs';
import { jwkCoordinates, readAddresses, relayer } from './lib.mjs';

// A3-S3 spike: a WebCrypto P-256 key controls a zero-balance account on Sepolia; the paymaster pays.
// Needs the app running (pnpm dev) with the same env: the bundler route is the system under test.
const BUNDLER_URL = process.env.BUNDLER_URL ?? 'http://localhost:3000/api/bundler';
const RECEIPT_TIMEOUT_MS = 120_000;
const SALT = BigInt(0);

const client = publicClient();
const addresses = readAddresses();
const factory = (process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS ?? addresses.factory) as Address;
const paymaster = (process.env.PAYMASTER_ADDRESS ?? addresses.paymaster) as Address;

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(BUNDLER_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body = (await response.json()) as { result?: T; error?: { message: string } };
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result as T;
}

async function newDeviceKey() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const { x, y } = jwkCoordinates(jwk as { x: string; y: string });
  return { privateKey: pair.privateKey, x, y, keyId: keccak256(encodePacked(['bytes32', 'bytes32'], [x, y])) };
}

const sponsorBalances = async () => ({
  deposit: await client.readContract({
    address: entryPoint07Address,
    abi: entryPoint07Abi,
    functionName: 'balanceOf',
    args: [paymaster],
  }),
  relayer: await client.getBalance({ address: relayer().address }),
});

const owner = await newDeviceKey();
const second = await newDeviceKey();
const account = await client.readContract({
  address: factory,
  abi: accountFactoryAbi,
  functionName: 'getAddress',
  args: [owner.x, owner.y, SALT],
});
console.log(`account ${account} (counterfactual, key ${owner.keyId.slice(0, 10)}…)`);

const callData = encodeFunctionData({
  abi: consortiumAccountAbi,
  functionName: 'execute',
  args: [
    account,
    BigInt(0),
    encodeFunctionData({ abi: consortiumAccountAbi, functionName: 'addOwner', args: [second.x, second.y] }),
  ],
});
const request = {
  sender: account,
  factory,
  factoryData: encodeFunctionData({ abi: accountFactoryAbi, functionName: 'createAccount', args: [owner.x, owner.y, SALT] }),
  callData,
};

const before = { account: await client.getBalance({ address: account }), ...(await sponsorBalances()) };
const sponsorship = await rpc<Record<string, Hex>>('eth_sponsorUserOperation', [request]);
const { paymasterAndData: _packed, ...fields } = sponsorship;
const userOperation = {
  ...request,
  ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, key === 'paymaster' || key === 'paymasterData' ? value : BigInt(value)])),
  signature: '0x' as Hex,
};
const userOpHash = getUserOperationHash({
  userOperation: userOperation as never,
  entryPointAddress: entryPoint07Address,
  entryPointVersion: '0.7',
  chainId: sepolia.id,
});
const rs = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, owner.privateKey, Buffer.from(userOpHash.slice(2), 'hex')));
const signature = encodePacked(['bytes32', 'bytes'], [owner.keyId, toHex(rs)]);

const started = Date.now();
await rpc('eth_sendUserOperation', [
  Object.fromEntries(
    Object.entries({ ...userOperation, signature }).map(([key, value]) => [key, typeof value === 'bigint' ? toHex(value) : value]),
  ),
]);

type Receipt = { success: boolean; actualGasCost: Hex; receipt: { transactionHash: Hex; blockNumber: Hex } };
let receipt: Receipt | null = null;
while (!receipt && Date.now() - started < RECEIPT_TIMEOUT_MS) {
  await new Promise((resolve) => setTimeout(resolve, 3_000));
  receipt = await rpc<Receipt | null>('eth_getUserOperationReceipt', [userOpHash]);
}
if (!receipt) throw new Error('No receipt within 120 s');

const after = { account: await client.getBalance({ address: account }), ...(await sponsorBalances()) };
const [, , addedAt] = await client.readContract({
  address: account,
  abi: consortiumAccountAbi,
  functionName: 'ownerInfo',
  args: [second.keyId],
});
const fee = BigInt(receipt.actualGasCost);
console.log(`tx ${receipt.receipt.transactionHash} (block ${BigInt(receipt.receipt.blockNumber)}), ${Date.now() - started} ms`);
console.log(`account balance: ${formatEther(before.account)} -> ${formatEther(after.account)} ETH`);
console.log(`paymaster deposit fell by ${formatEther(before.deposit - after.deposit)} ETH (fee ${formatEther(fee)})`);
console.log(`relayer net change ${formatEther(after.relayer - before.relayer)} ETH`);

const checks = [
  ['op succeeded', receipt.success],
  ['second owner added on chain', addedAt > BigInt(0)],
  ['account balance stayed 0', before.account === BigInt(0) && after.account === BigInt(0)],
  ['deposit fell by exactly the fee', before.deposit - after.deposit === fee],
] as const;
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
if (checks.some(([, ok]) => !ok)) process.exit(1);
console.log('AA is GO');
