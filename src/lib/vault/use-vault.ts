'use client';

import { useCallback, useEffect, useState } from 'react';
import { vaultStore } from './browser';
import { getRequest, RequestGoneError } from './requests-client';
import type { VaultCertificate, VaultRequest } from './types';

const POLL_MS = 3000;

export type VaultView =
  | { status: 'loading' }
  | { status: 'ready'; requests: VaultRequest[]; certificates: VaultCertificate[] };

async function pollPending(requests: VaultRequest[]): Promise<void> {
  const store = vaultStore();
  await Promise.all(
    requests
      .filter((request) => request.status === 'PENDING')
      .map(async (request) => {
        try {
          const { status } = await getRequest(request.id);
          if (status === 'DECLINED') await store.putRequest({ ...request, status });
          if (status === 'EXPIRED') await store.deleteRequest(request.id);
        } catch (caught) {
          if (caught instanceof RequestGoneError) await store.deleteRequest(request.id);
          // any other failure: keep waiting, the next poll tries again
        }
      }),
  );
}

/** The vault's requests and certificates, with pending requests polled while the page is open. */
export function useVault(): VaultView {
  const [view, setView] = useState<VaultView>({ status: 'loading' });

  const refresh = useCallback(async () => {
    const store = vaultStore();
    await pollPending(await store.listRequests());
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

  return view;
}
