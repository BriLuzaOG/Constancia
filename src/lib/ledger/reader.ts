import 'server-only';
import { getMemoryWorld } from './memory';
import type { LedgerReader } from './types';

const memoryLedger = async () => (await getMemoryWorld()).ledger.reader();

// Resolves the world on each call: the memory ledger is a lazily booted singleton.
const memoryReader: LedgerReader = {
  head: async () => (await memoryLedger()).head(),
  issuer: async (account) => (await memoryLedger()).issuer(account),
  key: async (account, keyId) => (await memoryLedger()).key(account, keyId),
  keys: async (account) => (await memoryLedger()).keys(account),
  record: async (issuer, hash) => (await memoryLedger()).record(issuer, hash),
  state: async () => (await memoryLedger()).state(),
  accountAddress: async (jwk, salt) => (await memoryLedger()).accountAddress(jwk, salt),
  isDeployed: async (account) => (await memoryLedger()).isDeployed(account),
};

// by LEDGER_MODE: 'memory' (dev and tests only) | 'chain'
export function getLedgerReader(): LedgerReader {
  const mode = process.env.LEDGER_MODE ?? (process.env.NODE_ENV === 'production' ? '' : 'memory');
  if (mode === 'memory') return memoryReader;
  if (mode === 'chain') throw new Error('not implemented: A3-S5');
  throw new Error('LEDGER_MODE must be "memory" or "chain"');
}
