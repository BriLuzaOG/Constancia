import { PageHeader } from '@/components/ui/page-header';
import { RequestInbox } from './request-inbox';

export default function RequestsPage() {
  return (
    <>
      <PageHeader
        title="Requests"
        lead="Employees asking for a certificate. Review each one against your directory before issuing."
      />
      <div className="mt-10">
        <RequestInbox />
      </div>
    </>
  );
}
