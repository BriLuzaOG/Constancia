'use client';

import { useEffect, useState } from 'react';
import { fetchMe, SESSION_CHANGED, type EmployerMe } from './session-client';

export type MeView = { status: 'loading' } | { status: 'out' } | { status: 'in'; me: EmployerMe };

/** The signed-in organization, refreshed whenever sign-in or sign-out happens anywhere on the page. */
export function useMe(): MeView {
  const [view, setView] = useState<MeView>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    async function refresh() {
      const me = await fetchMe().catch(() => null);
      if (active) setView(me ? { status: 'in', me } : { status: 'out' });
    }
    void refresh();
    const onChange = () => {
      void refresh();
    };
    window.addEventListener(SESSION_CHANGED, onChange);
    return () => {
      active = false;
      window.removeEventListener(SESSION_CHANGED, onChange);
    };
  }, []);

  return view;
}
