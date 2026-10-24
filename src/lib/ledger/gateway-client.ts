// Browser: talks only to the read gateway routes.
import type { LookupRequest, LookupResponse, NetworkState } from './types';

export async function lookupLedger(_req: LookupRequest): Promise<LookupResponse> {
  // POST /api/ledger/lookup
  throw new Error('not implemented: A3-S2');
}

export async function fetchNetworkState(): Promise<NetworkState> {
  throw new Error('not implemented: A3-S2');
}
