import type { NetworkState } from '@/lib/ledger/types';
import { fixtureState } from './fixture';

// TEMP swap point: once A3-S2 is on main, replace the body with `return fetchNetworkState()`
// from '@/lib/ledger/gateway-client' and delete fixture.ts.
export async function loadState(): Promise<NetworkState> {
  return fixtureState();
}
