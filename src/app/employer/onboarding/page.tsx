import { PageHeader } from '@/components/ui/page-header';
import { Onboarding } from './onboarding';

export default function OnboardingPage() {
  return (
    <>
      <PageHeader
        title="Set up your organization"
        lead="Make a signing key on this device, then ask the consortium to accredit you. Issuing unlocks once enough members approve."
      />
      <div className="mt-10">
        <Onboarding />
      </div>
    </>
  );
}
