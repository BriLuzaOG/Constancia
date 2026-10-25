import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { RequestForm } from './request-form';

export const metadata: Metadata = { title: 'Ask for a certificate · Constancia' };

export default function RequestPage() {
  return (
    <>
      <PageHeader
        title="Ask for a certificate"
        lead="Pick your employer and give the employee number they know you by. A new key is made on this device for this request alone."
      />
      <div className="mt-10 max-w-xl">
        <RequestForm />
      </div>
    </>
  );
}
