// Browser only. What this device issued, as hashes and opaque employee numbers: no claims, no names.
export interface IssuedLogEntry {
  credentialHash: `0x${string}`;
  keyId: `0x${string}`;
  employeeRef: string;
  issuedAt: string;
  kind: 'CURRENT' | 'PAST';
}

const DB_NAME = 'constancia-issued';
const STORE = 'issued';

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
  open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: 'credentialHash' });
  const db = await requestResult(open);
  try {
    return await requestResult(run(db.transaction(STORE, mode).objectStore(STORE)));
  } finally {
    db.close();
  }
}

export async function appendIssued(entry: IssuedLogEntry): Promise<void> {
  await withStore('readwrite', (store) => store.put(entry));
}

export async function listIssued(): Promise<IssuedLogEntry[]> {
  const all = await withStore<IssuedLogEntry[]>('readonly', (store) => store.getAll());
  return all.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}
