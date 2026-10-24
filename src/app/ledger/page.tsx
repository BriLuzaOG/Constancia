import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { LedgerView } from './_components/ledger-view';

export const metadata: Metadata = { title: 'Consortium ledger · Constancia' };

export default function LedgerPage() {
  return (
    <main className="mx-auto max-w-6xl px-gutter py-12">
      <PageHeader
        title="Consortium ledger"
        kicker="Consortium ledger"
        lead="The public record of who may issue, and the fingerprints of what they issued."
      />
      <LedgerView />
    </main>
  );
}
