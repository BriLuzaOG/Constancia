// Isomorphic (browser, Node scripts). Memory client: account-client-memory.ts; chain client: account-client-chain.ts.
import { createChainAccountClient } from './account-client-chain';
import { createMemoryAccountClient } from './account-client-memory';
import type { AccountClient, AccountClientArgs } from './account-types';

export { LedgerWriteError } from './account-types';
export type { AccountClient, AccountClientArgs, TxResult } from './account-types';

// Follows NEXT_PUBLIC_LEDGER_MODE (browser) or LEDGER_MODE (Node); Next inlines the literal below.
const ledgerMode = () => process.env.NEXT_PUBLIC_LEDGER_MODE ?? process.env.LEDGER_MODE;

export async function createAccountClient(args: AccountClientArgs): Promise<AccountClient> {
  return ledgerMode() === 'chain' ? createChainAccountClient(args) : createMemoryAccountClient(args);
}
