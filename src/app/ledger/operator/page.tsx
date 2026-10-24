import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { OperatorConsole } from './operator-console';

export const metadata: Metadata = { title: 'Act as a member · Constancia' };

export default function OperatorPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1') notFound();
  return (
    <main className="mx-auto max-w-4xl px-gutter py-12">
      <PageHeader
        title="Act as a member"
        lead="Demo only: in production each member signs on its own device."
      />
      <OperatorConsole />
    </main>
  );
}
