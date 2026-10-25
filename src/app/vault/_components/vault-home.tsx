'use client';

import { LinkButton } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { employerName, useEmployers } from '@/lib/vault/use-employers';
import { useVault } from '@/lib/vault/use-vault';
import type { VaultRequest } from '@/lib/vault/types';

function PendingRequest({ request, employer }: { request: VaultRequest; employer: string }) {
  const declined = request.status === 'DECLINED';
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink py-4">
      <p className="text-body font-bold">
        {declined ? `${employer} declined this request` : `Waiting for ${employer}…`}
      </p>
      <p className="text-small text-ink-muted">
        <code>{request.employeeRef}</code> · {request.kind === 'CURRENT' ? 'Works here now' : 'Used to work here'}
      </p>
    </li>
  );
}

export function VaultHome() {
  const vault = useVault();
  const employers = useEmployers();

  if (vault.status === 'loading') return <p role="status">Opening your vault…</p>;

  return (
    <div className="flex flex-col gap-10">
      {vault.requests.length > 0 && (
        <ul className="border-b-2 border-ink" aria-live="polite">
          {vault.requests.map((request) => (
            <PendingRequest
              key={request.id}
              request={request}
              employer={employerName(employers, request.employer)}
            />
          ))}
        </ul>
      )}
      {vault.requests.length === 0 && (
        <Panel title="Nothing here yet" tone="quiet">
          <p className="max-w-[65ch] text-body text-ink-muted">
            There is no account, no email and nothing to sign up for. Ask an employer for a
            certificate and it appears here. Lose this device and you ask for your certificates again.
          </p>
        </Panel>
      )}
      <div>
        <LinkButton href="/vault/request">Ask for a certificate</LinkButton>
      </div>
    </div>
  );
}
