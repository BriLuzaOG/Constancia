import { notFound } from 'next/navigation';
import { IdentityImport } from './identity-import';

export default function DevIdentityPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1') notFound();
  return (
    <main className="mx-auto max-w-3xl px-gutter py-12">
      <h1 className="font-display text-title font-extrabold">Demo identities</h1>
      <p className="mt-2 text-body">
        Dev tool: imports the demo members and employers into this browser as keys that cannot be
        exported again.
      </p>
      <IdentityImport />
    </main>
  );
}
