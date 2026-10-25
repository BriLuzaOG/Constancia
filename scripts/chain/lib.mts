import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createWalletClient, http, type Abi, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { publicClient, requireEnv, rpcUrl } from './config.mjs';

const ADDRESSES_FILE = process.env.CHAIN_ADDRESSES_FILE ?? 'demo-pack/addresses.json';
export type DeployedAddresses = Partial<Record<'factory' | 'paymaster' | 'ledger', Address>> & {
  ledgerDeployBlock?: number;
};

export const relayer = () => privateKeyToAccount(requireEnv('RELAYER_PRIVATE_KEY') as Hex);

export function relayerWallet() {
  return createWalletClient({ account: relayer(), chain: sepolia, transport: http(rpcUrl()) });
}

// Sepolia persists: addresses are recorded once and never redeployed.
export function readAddresses(): DeployedAddresses {
  return existsSync(ADDRESSES_FILE) ? JSON.parse(readFileSync(ADDRESSES_FILE, 'utf8')) : {};
}

export function saveAddresses(addresses: DeployedAddresses) {
  mkdirSync('demo-pack', { recursive: true });
  writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2));
}

export async function deployArtifact(name: string, args: unknown[] = []): Promise<{ address: Address; block: number }> {
  const { abi, bytecode } = JSON.parse(readFileSync(`contracts/out/${name}.json`, 'utf8')) as {
    abi: Abi;
    bytecode: Hex;
  };
  const hash = await relayerWallet().deployContract({ abi, bytecode, args });
  const receipt = await publicClient().waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error(`${name} deployment failed (${hash})`);
  console.log(`deployed ${name} at ${receipt.contractAddress} (block ${receipt.blockNumber})`);
  return { address: receipt.contractAddress, block: Number(receipt.blockNumber) };
}
