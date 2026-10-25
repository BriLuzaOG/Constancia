import { PageHeader } from '@/components/ui/page-header';
import { IssueFlow } from './issue-flow';

export default async function IssuePage({ params }: PageProps<'/employer/issue/[id]'>) {
  const { id } = await params;
  return (
    <>
      <PageHeader
        title="Issue a certificate"
        lead="Check the details, then issue. Each step shows what it did."
      />
      <div className="mt-10">
        <IssueFlow requestId={id} />
      </div>
    </>
  );
}
