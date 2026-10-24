import 'server-only';
import type { Hex } from '@/lib/credential/types';

export interface SponsorResult {
  fundingTxHash: Hex | null; // null when the wallet already had enough
  topUpWei: string;
  gas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export async function sponsorAnchorGas(_admin: Hex, _credentialId: Hex): Promise<SponsorResult> {
  throw new Error('not implemented: A3-S4');
}
