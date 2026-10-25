import { PageHeader } from '@/components/ui/page-header';
import { EmployerHome } from './_components/employer-home';

export default function EmployerPage() {
  return (
    <>
      <PageHeader
        title="Employer"
        lead="Issue employment certificates that prove themselves. Your signing key stays on this device."
      />
      <div className="mt-10">
        <EmployerHome />
      </div>
    </>
  );
}
