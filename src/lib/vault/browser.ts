// Browser only: one lazily created store per page load.
import { createIndexedDbStore, type VaultStore } from './store';

let store: VaultStore | undefined;

export function vaultStore(): VaultStore {
  store ??= createIndexedDbStore();
  return store;
}
