import 'server-only';
import type { Hex } from '@/lib/credential/types';

export interface AnchorInfo {
  anchored: boolean;
  anchoredAt: number | null;
  txHash: Hex | null;
  explorerUrl: string | null;
}

export async function readAnchor(_issuer: Hex, _credentialId: Hex): Promise<AnchorInfo> {
  throw new Error('not implemented: A3-S4');
}
