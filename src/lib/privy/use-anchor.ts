'use client';

import type { Hex } from '@/lib/credential/types';

// shortcut: stub until A3-S5 wires the JIT-funded anchor transaction
export function useAnchorCredential(): (credentialId: Hex) => Promise<{
  fundingTxHash: Hex | null;
  anchorTxHash: Hex;
  blockNumber: string;
  topUpWei: string;
}> {
  return async () => {
    throw new Error('not implemented: A3-S5');
  };
}
