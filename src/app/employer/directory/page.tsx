import { PageHeader } from '@/components/ui/page-header';
import { DirectoryView } from './directory-view';

export default function DirectoryPage() {
  return (
    <>
      <PageHeader
        title="Employee directory"
        lead="The people you can issue certificates for. This list never leaves this browser."
      />
      <div className="mt-10">
        <DirectoryView />
      </div>
    </>
  );
}
