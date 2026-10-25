// Browser only: the real dependencies of the vault, wired once.
import { listSignerNames, loadSigner } from '@/lib/credential/keystore';
import type { P256Jwk } from '@/lib/credential/types';
import { decryptFromIssuer } from '@/lib/credential/share-crypto';
import { verifyCertificate } from '@/lib/credential/verify';
import { lookupLedger } from '@/lib/ledger/gateway-client';
import type { AttachDeps } from './cv-entries';
import { drainVerdict } from './drain-verdict';
import type { ReceiveDeps } from './receive';
import { ackRequest, getRequest } from './requests-client';
import { createIndexedDbStore, type VaultStore } from './store';

let store: VaultStore | undefined;

export function vaultStore(): VaultStore {
  store ??= createIndexedDbStore();
  return store;
}

export const verifyInVault = (sdJwt: string) =>
  drainVerdict(verifyCertificate(sdJwt, { lookup: lookupLedger }));

/** The keystore name of the vault key that matches this public key, if this vault has it. */
async function findKeyName(jwk: P256Jwk): Promise<string | null> {
  for (const name of await listSignerNames()) {
    if (!name.startsWith('cert:')) continue;
    const signer = await loadSigner(name);
    if (signer?.jwk.x === jwk.x && signer.jwk.y === jwk.y) return name;
  }
  return null;
}

export const attachDeps = (): AttachDeps => ({ findKeyName, verify: verifyInVault });

export function receiveDeps(): ReceiveDeps {
  return {
    store: vaultStore(),
    getRequest,
    ackRequest,
    decrypt: decryptFromIssuer,
    loadSigner,
    verify: verifyInVault,
  };
}
