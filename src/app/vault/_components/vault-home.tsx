'use client';

import { LinkButton } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { vaultStore } from '@/lib/vault/browser';
import { employerName, useEmployers } from '@/lib/vault/use-employers';
import { useVault } from '@/lib/vault/use-vault';
import type { VaultRequest } from '@/lib/vault/types';
import { CertificateCard } from './certificate-card';

function PendingRequest({
  request,
  employer,
  onDismiss,
}: {
  request: VaultRequest;
  employer: string;
  onDismiss: () => void;
}) {
  const closed = request.status === 'DECLINED' || request.status === 'REJECTED';
  const headline =
    request.status === 'DECLINED'
      ? `${employer} declined this request`
      : request.status === 'REJECTED'
        ? `${employer} sent a certificate that could not be used`
        : `Waiting for ${employer}…`;
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink py-4">
      <div>
        <p className="text-body font-bold">{headline}</p>
        {request.error && <p className="text-small text-ink-muted">{request.error}</p>}
      </div>
      <div className="flex items-center gap-4">
        <p className="text-small text-ink-muted">
          <code>{request.employeeRef}</code> ·{' '}
          {request.kind === 'CURRENT' ? 'Works here now' : 'Used to work here'}
        </p>
        {closed && (
          <button type="button" className="min-h-12 font-bold hover:underline" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </li>
  );
}

export function VaultHome() {
  const vault = useVault();
  const employers = useEmployers();

  if (vault.status === 'loading') return <p role="status">Opening your vault…</p>;
  const { requests, certificates, refresh } = vault;

  return (
    <div className="flex flex-col gap-10">
      {requests.length > 0 && (
        <ul className="border-b-2 border-ink" aria-live="polite">
          {requests.map((request) => (
            <PendingRequest
              key={request.id}
              request={request}
              employer={employerName(employers, request.employer)}
              onDismiss={() => {
                void vaultStore().deleteRequest(request.id).then(refresh);
              }}
            />
          ))}
        </ul>
      )}
      {certificates.length > 0 && (
        <ul className="border-b-2 border-ink">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onDelete={() => {
                void vaultStore().deleteCertificate(certificate.id).then(refresh);
              }}
            />
          ))}
        </ul>
      )}
      {requests.length === 0 && certificates.length === 0 && (
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
