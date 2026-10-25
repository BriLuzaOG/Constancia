import { PageHeader } from '@/components/ui/page-header';
import { VaultHome } from './_components/vault-home';

export default function VaultPage() {
  return (
    <>
      <PageHeader
        title="Your vault"
        lead="Your vault lives in this browser. The keys are made here and never leave."
      />
      <div className="mt-10">
        <VaultHome />
      </div>
    </>
  );
}
