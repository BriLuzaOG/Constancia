import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ShareBuilder } from './share-builder-view';

// Route params are runtime data: they are read inside Suspense so the page shell can prerender.
async function ShareForId({ params }: { params: PageProps<'/vault/c/[id]/share'>['params'] }) {
  const { id } = await params;
  return <ShareBuilder id={id} />;
}

export default function SharePage({ params }: PageProps<'/vault/c/[id]/share'>) {
  return (
    <>
      <PageHeader
        title="Share one fact at a time"
        lead="Choose what a reader may see. What you leave out cannot be read or guessed."
      />
      <div className="mt-10">
        <Suspense fallback={<p role="status">Opening the certificate…</p>}>
          <ShareForId params={params} />
        </Suspense>
      </div>
    </>
  );
}
