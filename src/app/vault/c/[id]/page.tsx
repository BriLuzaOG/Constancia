import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { CertificateView } from './certificate-view';

// Route params are runtime data: they are read inside Suspense so the page shell can prerender.
async function CertificateForId({ params }: { params: PageProps<'/vault/c/[id]'>['params'] }) {
  const { id } = await params;
  return <CertificateView id={id} />;
}

export default function CertificatePage({ params }: PageProps<'/vault/c/[id]'>) {
  return (
    <>
      <PageHeader
        title="Your certificate"
        lead="You can see every claim in it. Anyone you share it with sees only what you choose."
      />
      <div className="mt-10">
        <Suspense fallback={<p role="status">Opening the certificate…</p>}>
          <CertificateForId params={params} />
        </Suspense>
      </div>
    </>
  );
}
