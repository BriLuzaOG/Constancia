'use client';

import { useEffect, useState } from 'react';
import type { NetworkState } from '@/lib/ledger/types';
import { loadState } from './load-state';

const POLL_MS = 2000;

export type NetworkView =
  | { status: 'loading' }
  | { status: 'unreachable' }
  | { status: 'ready'; state: NetworkState };

export function useNetworkState(): NetworkView {
  const [view, setView] = useState<NetworkView>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const state = await loadState();
        if (active) setView({ status: 'ready', state });
      } catch {
        if (active) setView({ status: 'unreachable' });
      }
    }
    void poll();
    const timer = setInterval(() => {
      void poll();
    }, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return view;
}
