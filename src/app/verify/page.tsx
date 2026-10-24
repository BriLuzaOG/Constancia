import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { VerifyView } from './_components/verify-view';

export const metadata: Metadata = { title: 'Verify a certificate · Constancia' };

export default function VerifyPage() {
  return (
    <main className="mx-auto max-w-5xl px-gutter py-12">
      <PageHeader
        title="Verify a certificate"
        lead="Five checks run in your browser. Only the claims the holder chose appear, and you see how many stay hidden."
      />
      <VerifyView />
    </main>
  );
}
