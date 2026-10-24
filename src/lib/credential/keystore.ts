// Browser only: IndexedDB holds non-extractable CryptoKeys, so they survive reloads.
// shortcut: no automated test (needs a browser); covered by manual checks and /dev/identity.
import { signerFromKey, type Es256Signer } from './keys';
import type { P256Jwk, P256PrivateJwk } from './types';

const DB_NAME = 'constancia-keys';
const STORE = 'signers';

interface StoredSigner {
  privateKey: CryptoKey;
  jwk: P256Jwk;
}

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

function openDb(): Promise<IDBDatabase> {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE);
  return requestResult(request);
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await requestResult(run(db.transaction(STORE, mode).objectStore(STORE)));
  } finally {
    db.close();
  }
}

const save = (name: string, stored: StoredSigner) =>
  withStore('readwrite', (store) => store.put(stored, name));

export async function createStoredSigner(name: string): Promise<Es256Signer> {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify'],
  );
  const jwk = (await crypto.subtle.exportKey('jwk', publicKey)) as P256Jwk;
  await save(name, { privateKey, jwk });
  return signerFromKey(privateKey, jwk);
}

export async function loadSigner(name: string): Promise<Es256Signer | null> {
  const stored = await withStore<StoredSigner | undefined>('readonly', (store) =>
    store.get(name),
  );
  return stored ? signerFromKey(stored.privateKey, stored.jwk) : null;
}

export async function importStoredSigner(name: string, jwk: P256PrivateJwk): Promise<Es256Signer> {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  await save(name, { privateKey, jwk });
  return signerFromKey(privateKey, jwk);
}

export async function listSignerNames(): Promise<string[]> {
  const keys = await withStore('readonly', (store) => store.getAllKeys());
  return keys.map(String);
}
