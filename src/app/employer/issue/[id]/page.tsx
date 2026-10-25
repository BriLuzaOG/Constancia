import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { IssueFlow } from './issue-flow';

// Route params are runtime data: they are read inside Suspense so the page shell can prerender.
async function IssueForRequest({ params }: { params: PageProps<'/employer/issue/[id]'>['params'] }) {
  const { id } = await params;
  return <IssueFlow requestId={id} />;
}

export default function IssuePage({ params }: PageProps<'/employer/issue/[id]'>) {
  return (
    <>
      <PageHeader
        title="Issue a certificate"
        lead="Check the details, then issue. Each step shows what it did."
      />
      <div className="mt-10">
        <Suspense fallback={<p role="status">Opening the request…</p>}>
          <IssueForRequest params={params} />
        </Suspense>
      </div>
    </>
  );
}
