import type { ComponentProps } from 'react';
import type { RecordedRequest } from '@/app/verify/_lib/types';
import { Receipt } from '@/components/ui/receipt';
import type { ClaimName, DisclosedClaims } from '@/lib/credential/types';
import { CLAIM_LABELS } from './verdict-panel';

type ReceiptRows = ComponentProps<typeof Receipt>['rows'];

// Receipt keys rows by label, so several lookups get numbered labels.
function sentRows(requests: RecordedRequest[], shareId?: string): ReceiptRows {
  const rows: ReceiptRows = requests.flatMap((request, index) => {
    const suffix = requests.length > 1 ? ` ${index + 1}` : '';
    return [
      {
        label: `Ledger lookup${suffix}`,
        value: `${request.method} ${request.url} · ${request.bytes} bytes`,
      },
      { label: `Sent${suffix}`, value: request.body, mono: true },
    ];
  });
  if (shareId) {
    rows.push({ label: 'Share fetch', value: `GET /api/shares/${shareId} · an ID, no key` });
  }
  return rows;
}

function deviceRows(claims: DisclosedClaims | null, shareId?: string): ReceiptRows {
  const disclosed = (Object.keys(claims ?? {}) as ClaimName[]).map((name) => CLAIM_LABELS[name]);
  const rows: ReceiptRows = [
    { label: 'Disclosed values', value: `${disclosed.join(', ') || 'None'} · read here, never sent` },
  ];
  if (shareId) {
    rows.push({ label: 'Decryption key', value: 'in the link fragment, never sent' });
  }
  rows.push({ label: 'Hidden claims', value: 'unreadable even to us', muted: true });
  return rows;
}

export function ReceiptPanel({
  requests,
  shareId,
  claims,
}: {
  requests: RecordedRequest[];
  shareId?: string;
  claims: DisclosedClaims | null;
}) {
  return (
    <div className="grid gap-12 md:grid-cols-2">
      <Receipt
        title="What left your browser"
        rows={sentRows(requests, shareId)}
        footnote="Only the employer account, the signing key id and the certificate fingerprint are sent. No name, no claim."
      />
      <Receipt title="What stayed on this device" rows={deviceRows(claims, shareId)} />
    </div>
  );
}
