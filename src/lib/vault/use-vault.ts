'use client';

import { useCallback, useEffect, useState } from 'react';
import { receiveDeps, vaultStore } from './browser';
import { syncRequest } from './receive';
import type { VaultCertificate, VaultRequest } from './types';

const POLL_MS = 3000;

export type VaultView =
  | { status: 'loading' }
  | { status: 'ready'; requests: VaultRequest[]; certificates: VaultCertificate[] };

/** The vault's requests and certificates, with open requests polled while the page is open. */
export function useVault(): VaultView & { refresh: () => Promise<void> } {
  const [view, setView] = useState<VaultView>({ status: 'loading' });

  const refresh = useCallback(async () => {
    const store = vaultStore();
    const deps = receiveDeps();
    const open = (await store.listRequests()).filter((request) => request.status === 'PENDING');
    await Promise.all(open.map((request) => syncRequest(deps, request)));
    const [requests, certificates] = await Promise.all([
      store.listRequests(),
      store.listCertificates(),
    ]);
    setView({ status: 'ready', requests, certificates });
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => {
      clearInterval(timer);
    };
  }, [refresh]);

  return { ...view, refresh };
}
