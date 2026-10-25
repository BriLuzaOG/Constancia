import { encodeFunctionData, encodePacked, toHex, type Address, type Hex } from 'viem';
import { entryPoint07Address, getUserOperationHash } from 'viem/account-abstraction';
import { sepolia } from 'viem/chains';
import { accountFactoryAbi, consortiumAccountAbi } from '../../src/lib/ledger/abi';
import type { Es256Signer } from '../../src/lib/credential/keys';
import { publicClient, requireEnv } from './config.mjs';
import { jwkCoordinates, readAddresses } from './lib.mjs';

// Sends one call from a smart account, signed by a device key, through the app's bundler route.
// The signer pays nothing: the paymaster does. Used by the seed and the smoke test.
const RECEIPT_TIMEOUT_MS = 60_000;
const POLL_MS = 3_000;
const SALT = BigInt(0);

const bundlerUrl = () =>
  process.env.BUNDLER_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/bundler`;

export async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(bundlerUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body = (await response.json()) as { result?: T; error?: { message: string } };
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result as T;
}

export const factoryAddress = () =>
  (process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS ?? readAddresses().factory ?? requireEnv('NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS')) as Address;

export function accountOf(signer: Es256Signer): Promise<Address> {
  const { x, y } = jwkCoordinates(signer.jwk);
  return publicClient().readContract({
    address: factoryAddress(),
    abi: accountFactoryAbi,
    functionName: 'getAddress',
    args: [x, y, SALT],
  });
}

type Receipt = { success: boolean; actualGasCost: Hex; receipt: { transactionHash: Hex; blockNumber: Hex } };

export async function sendAccountCall(args: { signer: Es256Signer; target: Address; data: Hex }) {
  const { signer, target, data } = args;
  const client = publicClient();
  const account = await accountOf(signer);
  const deployed = (await client.getCode({ address: account })) !== undefined;
  const { x, y } = jwkCoordinates(signer.jwk);
  const request = {
    sender: account,
    ...(!deployed && {
      factory: factoryAddress(),
      factoryData: encodeFunctionData({ abi: accountFactoryAbi, functionName: 'createAccount', args: [x, y, SALT] }),
    }),
    callData: encodeFunctionData({ abi: consortiumAccountAbi, functionName: 'execute', args: [target, BigInt(0), data] }),
  };

  const { paymasterAndData: _packed, ...fields } = await rpc<Record<string, Hex>>('eth_sponsorUserOperation', [request]);
  const userOperation = {
    ...request,
    ...Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, key === 'paymaster' || key === 'paymasterData' ? value : BigInt(value)]),
    ),
    signature: '0x' as Hex,
  };
  const userOpHash = getUserOperationHash({
    userOperation: userOperation as never,
    entryPointAddress: entryPoint07Address,
    entryPointVersion: '0.7',
    chainId: sepolia.id,
  });
  const rs = await signer.sign(Buffer.from(userOpHash.slice(2), 'hex'));
  const signature = encodePacked(['bytes32', 'bytes'], [signer.keyId, toHex(rs)]);
  const wire = Object.fromEntries(
    Object.entries({ ...userOperation, signature }).map(([key, value]) => [key, typeof value === 'bigint' ? toHex(value) : value]),
  );

  await rpc('eth_sendUserOperation', [wire]);
  const started = Date.now();
  while (Date.now() - started < RECEIPT_TIMEOUT_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const receipt = await rpc<Receipt | null>('eth_getUserOperationReceipt', [userOpHash]);
    if (!receipt) continue;
    if (!receipt.success) throw new Error(`Operation reverted on chain (tx ${receipt.receipt.transactionHash})`);
    return { txHash: receipt.receipt.transactionHash, blockNumber: Number(BigInt(receipt.receipt.blockNumber)) };
  }
  throw new Error('The ledger did not confirm within 60 s (Sepolia blocks take about 12 s): the bundler may be stuck or out of gas budget');
}
