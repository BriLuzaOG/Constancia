import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { LabView } from './lab-view';

export const metadata: Metadata = { title: 'Fake Letter Lab · Constancia' };

export default function LabPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-gutter pb-16 pt-10">
      <PageHeader
        title="Fake Letter Lab"
        lead="Try to forge an employment letter. Each forgery is checked exactly like a real one, and each fails at its own named check."
      />
      <div className="mt-10">
        <LabView />
      </div>
    </main>
  );
}
