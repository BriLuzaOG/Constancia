'use client';

import { Button, LinkButton } from '@/components/ui/button';
import { certificateInfo, downloadText } from '@/lib/vault/certificate-info';
import { statusOf, useCertificateVerdict } from '@/lib/vault/use-certificate-status';
import type { VaultCertificate } from '@/lib/vault/types';

function StatusChip({ sdJwt }: { sdJwt: string }) {
  const verdict = useCertificateVerdict(sdJwt);
  const status = verdict ? statusOf(verdict) : { state: 'checking' as const };
  const text = {
    checking: 'Checking…',
    verified: 'Verified on the ledger',
    revoked: 'Revoked or expired',
    failed: 'Failed a check',
    unavailable: 'Ledger unreachable',
  }[status.state];
  const reason = 'reason' in status ? status.reason : undefined;
  return (
    <p className="text-small font-bold" title={reason}>
      {text}
      {reason ? <span className="block font-normal text-ink-muted">{reason}</span> : null}
    </p>
  );
}

export function CertificateCard({
  certificate,
  onDelete,
}: {
  certificate: VaultCertificate;
  onDelete: () => void;
}) {
  const { issuedOn } = certificateInfo(certificate);
  return (
    <li className="flex flex-col gap-4 border-t-2 border-ink py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <a href={`/vault/c/${certificate.id}`} className="text-title font-bold hover:underline">
          {certificate.employerName}
        </a>
        <p className="text-small text-ink-muted">
          {certificate.kind === 'CURRENT' ? 'CURRENT' : 'PAST'}
          {issuedOn ? ` · issued ${issuedOn}` : ''}
        </p>
      </div>
      <StatusChip sdJwt={certificate.sdJwt} />
      <div className="flex flex-wrap gap-3">
        <LinkButton href={`/vault/c/${certificate.id}/share`}>Share</LinkButton>
        <Button
          variant="secondary"
          onClick={() => {
            downloadText(`${certificate.employerName}.sdjwt`, certificate.sdJwt);
          }}
        >
          Download
        </Button>
        <LinkButton variant="secondary" href={`/cv?add=${certificate.id}`}>
          Add to my CV
        </LinkButton>
        <Button
          variant="quiet"
          onClick={() => {
            if (window.confirm('Delete this certificate from this device?')) onDelete();
          }}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
