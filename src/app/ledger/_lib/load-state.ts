import { fetchNetworkState } from '@/lib/ledger/gateway-client';
import type { NetworkState } from '@/lib/ledger/types';

export function loadState(): Promise<NetworkState> {
  return fetchNetworkState();
}
