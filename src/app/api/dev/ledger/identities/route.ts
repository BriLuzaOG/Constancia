import { connection } from 'next/server';
import { devRoutesEnabled, notFound } from '@/lib/ledger/dev-gate';
import { getMemoryWorld } from '@/lib/ledger/memory';

// Local testing only: hands out the boot-seeded private keys of the demo members and employers.
export async function GET() {
  await connection();
  if (!devRoutesEnabled()) return notFound();
  return Response.json((await getMemoryWorld()).identities);
}
