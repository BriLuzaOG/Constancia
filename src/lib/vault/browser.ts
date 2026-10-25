// Browser only: the real dependencies of the vault, wired once.
import { loadSigner } from '@/lib/credential/keystore';
import { decryptFromIssuer } from '@/lib/credential/share-crypto';
import { verifyCertificate } from '@/lib/credential/verify';
import { lookupLedger } from '@/lib/ledger/gateway-client';
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
