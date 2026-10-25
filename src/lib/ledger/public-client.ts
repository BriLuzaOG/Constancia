import 'server-only';
import { createPublicClient, fallback, http } from 'viem';
import { sepolia } from 'viem/chains';
import { z } from 'zod';
import type { ChainClient, ChainConfig } from './chain';

const ADDRESS = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/)
  .refine((value) => !/^0x0{40}$/.test(value), 'contract not deployed yet')
  .transform((value) => value.toLowerCase() as `0x${string}`);
const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.url().optional());

const ENV = z.object({
  LEDGER_RPC_URL: z.url(),
  LEDGER_RPC_URL_BACKUP: optionalUrl,
  LEDGER_CONTRACT_ADDRESS: ADDRESS,
  NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS: ADDRESS,
  LEDGER_DEPLOY_BLOCK: z.string().regex(/^\d+$/).transform(Number),
});

/** What the gateway needs, read lazily so builds and the memory mode never see these variables. */
function chainEnv() {
  const result = ENV.safeParse(process.env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Invalid environment variables: ${names.join(', ')}`);
  }
  return result.data;
}

// The primary RPC first, the backup (when set) only if the primary fails.
export function createSepoliaClient(env = chainEnv()): ChainClient {
  const urls = [env.LEDGER_RPC_URL, env.LEDGER_RPC_URL_BACKUP].filter((url) => url !== undefined);
  const client = createPublicClient({
    chain: sepolia,
    transport: fallback(urls.map((url) => http(url))),
  });
  return client as unknown as ChainClient;
}

export function chainSettings(): { client: ChainClient; config: ChainConfig } {
  const env = chainEnv();
  return {
    client: createSepoliaClient(env),
    config: {
      ledger: env.LEDGER_CONTRACT_ADDRESS,
      factory: env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS,
      deployBlock: env.LEDGER_DEPLOY_BLOCK,
    },
  };
}

// The Ledger's address for write clients (browsers have no server env); absent in memory mode.
export function ledgerAddress(): `0x${string}` | undefined {
  return process.env.LEDGER_MODE === 'chain' ? chainEnv().LEDGER_CONTRACT_ADDRESS : undefined;
}
