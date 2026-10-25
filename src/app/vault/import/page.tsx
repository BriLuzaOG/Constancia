import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { DemoImport } from './demo-import';

export default function ImportPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1') notFound();
  return (
    <>
      <PageHeader
        title="Import demo certificates"
        lead="Demo mode only. Choose demo-pack/vault.json from the seed script."
      />
      <div className="mt-10 max-w-xl">
        <DemoImport />
      </div>
    </>
  );
}
