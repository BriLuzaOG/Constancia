import 'server-only';
import type { LedgerReader } from './types';

// by LEDGER_MODE: 'memory' (dev and tests only) | 'chain'
export function getLedgerReader(): LedgerReader {
  throw new Error('not implemented: A3-S2');
}
