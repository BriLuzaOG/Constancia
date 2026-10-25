import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { CvPortal } from './_components/cv-portal';

export default function CvPage() {
  return (
    <>
      <PageHeader
        title="Your Verified CV"
        lead="Attach every certificate you own. Each one is checked against the ledger, then joined into one history. Files are read in your browser and never uploaded."
      />
      <div className="mt-10">
        <Suspense fallback={<p role="status">Opening…</p>}>
          <CvPortal />
        </Suspense>
      </div>
    </>
  );
}
