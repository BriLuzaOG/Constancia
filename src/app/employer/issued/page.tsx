import { PageHeader } from '@/components/ui/page-header';
import { IssuedList } from './issued-list';

export default function IssuedPage() {
  return (
    <>
      <PageHeader
        title="Issued"
        lead="Certificates issued from this device. Revoking one makes it fail the ledger check for everyone holding it."
      />
      <div className="mt-10">
        <IssuedList />
      </div>
    </>
  );
}
