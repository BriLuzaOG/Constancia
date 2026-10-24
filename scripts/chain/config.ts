import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';

export const ENTRY_POINT: Address = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';
export const SEPOLIA_PUBLIC_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

export function env(name: string): string | undefined {
  const value = process.env[name];
  return value ? value : undefined;
}

export function requireEnv(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

// Un RPC local de desarrollo viejo en .env no sirve: Sepolia es la única red.
export function rpcUrl(): string {
  const url = env('LEDGER_RPC_URL');
  return url && !/127\.0\.0\.1|localhost/.test(url) ? url : SEPOLIA_PUBLIC_RPC;
}

export function publicClient(url = rpcUrl()) {
  return createPublicClient({ chain: sepolia, transport: http(url) });
}
