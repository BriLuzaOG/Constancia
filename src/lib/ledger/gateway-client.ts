// Browser: talks only to the read gateway routes.
import type { LookupRequest, LookupResponse, NetworkState } from './types';

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`ledger gateway answered ${response.status}`);
  return (await response.json()) as T;
}

export async function lookupLedger(req: LookupRequest): Promise<LookupResponse> {
  return readJson(
    await fetch('/api/ledger/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    }),
  );
}

export async function fetchNetworkState(): Promise<NetworkState> {
  return readJson(await fetch('/api/ledger/state', { cache: 'no-store' }));
}
