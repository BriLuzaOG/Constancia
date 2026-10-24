'use client';

import type { DigestSigner, Hex, SecpJwk } from '@/lib/credential/types';

// shortcut: stub until A3-S2 wire the Privy embedded wallet (secp256k1_sign)
export function usePrivySigner(): {
  ready: boolean;
  address: Hex | null;
  sign: DigestSigner;
  proveKey(): Promise<{ jwk: SecpJwk; proof: { digest: Hex; signature: Hex } }>;
} {
  return {
    ready: false,
    address: null,
    sign: async () => {
      throw new Error('not implemented: A3-S2');
    },
    proveKey: async () => {
      throw new Error('not implemented: A3-S2');
    },
  };
}
