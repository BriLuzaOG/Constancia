import type { VaultCertificate, VaultRequest } from './types';

export interface VaultStore {
  putRequest(request: VaultRequest): Promise<void>;
  getRequest(id: string): Promise<VaultRequest | undefined>;
  listRequests(): Promise<VaultRequest[]>;
  deleteRequest(id: string): Promise<void>;
  putCertificate(certificate: VaultCertificate): Promise<void>;
  getCertificate(id: string): Promise<VaultCertificate | undefined>;
  listCertificates(): Promise<VaultCertificate[]>;
  deleteCertificate(id: string): Promise<void>;
}

export function createMemoryStore(): VaultStore {
  const requests = new Map<string, VaultRequest>();
  const certificates = new Map<string, VaultCertificate>();
  return {
    putRequest: async (request) => void requests.set(request.id, request),
    getRequest: async (id) => requests.get(id),
    listRequests: async () => [...requests.values()].toSorted((a, b) => b.createdAt - a.createdAt),
    deleteRequest: async (id) => void requests.delete(id),
    putCertificate: async (certificate) => void certificates.set(certificate.id, certificate),
    getCertificate: async (id) => certificates.get(id),
    listCertificates: async () =>
      [...certificates.values()].toSorted((a, b) => b.receivedAt - a.receivedAt),
    deleteCertificate: async (id) => void certificates.delete(id),
  };
}

const DB_NAME = 'constancia-vault';
const REQUESTS = 'requests';
const CERTIFICATES = 'certificates';

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

function openDb(): Promise<IDBDatabase> {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore(REQUESTS, { keyPath: 'id' });
    request.result.createObjectStore(CERTIFICATES, { keyPath: 'id' });
  };
  return requestResult(request);
}

async function withStore<T>(
  name: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await requestResult(run(db.transaction(name, mode).objectStore(name)));
  } finally {
    db.close();
  }
}

/** shortcut: no automated test (needs a browser); the in-memory store covers the logic. */
export function createIndexedDbStore(): VaultStore {
  const put = (name: string) => (value: object) =>
    withStore(name, 'readwrite', (store) => store.put(value)).then(() => undefined);
  const get =
    <T>(name: string) =>
    (id: string) =>
      withStore<T | undefined>(name, 'readonly', (store) => store.get(id));
  const all =
    <T>(name: string, order: (item: T) => number) =>
    async () =>
      (await withStore<T[]>(name, 'readonly', (store) => store.getAll())).toSorted(
        (a, b) => order(b) - order(a),
      );
  const remove = (name: string) => (id: string) =>
    withStore(name, 'readwrite', (store) => store.delete(id)).then(() => undefined);

  return {
    putRequest: put(REQUESTS),
    getRequest: get<VaultRequest>(REQUESTS),
    listRequests: all<VaultRequest>(REQUESTS, (item) => item.createdAt),
    deleteRequest: remove(REQUESTS),
    putCertificate: put(CERTIFICATES),
    getCertificate: get<VaultCertificate>(CERTIFICATES),
    listCertificates: all<VaultCertificate>(CERTIFICATES, (item) => item.receivedAt),
    deleteCertificate: remove(CERTIFICATES),
  };
}
