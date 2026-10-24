// Browser only: IndexedDB holds non-extractable CryptoKeys, so they survive reloads.
import type { Es256Signer } from './keys';
import type { P256PrivateJwk } from './types';

export async function createStoredSigner(_name: string): Promise<Es256Signer> {
  throw new Error('not implemented: A2-S1');
}

export async function loadSigner(_name: string): Promise<Es256Signer | null> {
  throw new Error('not implemented: A2-S1');
}

export async function importStoredSigner(
  _name: string,
  _jwk: P256PrivateJwk,
): Promise<Es256Signer> {
  throw new Error('not implemented: A2-S1');
}

export async function listSignerNames(): Promise<string[]> {
  throw new Error('not implemented: A2-S1');
}
