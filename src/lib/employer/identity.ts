// Browser only. The local record of who this device signs in as; the private key itself lives in the keystore.
import { listSignerNames, loadSigner } from '../credential/keystore';
import type { Address } from '../credential/types';

export const EMPLOYER_SIGNER_PREFIX = 'employer:';

export interface EmployerIdentity {
  signerName: string;
  account: Address;
  orgName: string;
}

const DB_NAME = 'constancia-employer';
const STORE = 'identity';

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const open = indexedDB.open(DB_NAME, 1);
  open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: 'signerName' });
  const db = await requestResult(open);
  try {
    return await requestResult(run(db.transaction(STORE, mode).objectStore(STORE)));
  } finally {
    db.close();
  }
}

export const saveIdentity = (identity: EmployerIdentity) =>
  withStore('readwrite', (store) => store.put(identity)).then(() => undefined);

const storedIdentities = () => withStore<EmployerIdentity[]>('readonly', (store) => store.getAll());

/** A key imported from the demo pack has no record yet: its account is derived from the public key. */
async function deriveIdentity(signerName: string): Promise<EmployerIdentity | null> {
  const signer = await loadSigner(signerName);
  if (!signer) return null;
  const { x, y } = signer.jwk;
  const response = await fetch(`/api/ledger/account?x=${x}&y=${y}`);
  if (!response.ok) return null;
  const { address } = (await response.json()) as { address: Address };
  return { signerName, account: address, orgName: signerName.slice(EMPLOYER_SIGNER_PREFIX.length) };
}

/** Every organization this device can sign in as: saved records plus orphan "employer:*" keys. */
export async function listIdentities(): Promise<EmployerIdentity[]> {
  const stored = await storedIdentities();
  const known = new Set(stored.map((identity) => identity.signerName));
  const orphanNames = (await listSignerNames()).filter(
    (name) => name.startsWith(EMPLOYER_SIGNER_PREFIX) && !known.has(name),
  );
  const derived = await Promise.all(orphanNames.map(deriveIdentity));
  return [...stored, ...derived.filter((identity) => identity !== null)];
}
