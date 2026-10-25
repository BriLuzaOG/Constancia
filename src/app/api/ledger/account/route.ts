import { z } from 'zod';
import { badRequest, respondWithLedger } from '@/lib/ledger/gateway';
import { ledgerAddress } from '@/lib/ledger/public-client';
import { getLedgerReader } from '@/lib/ledger/reader';

const COORDINATE = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const QUERY = z.object({
  x: COORDINATE,
  y: COORDINATE,
  salt: z
    .string()
    .regex(/^\d{1,20}$/)
    .default('0'),
});

export async function GET(request: Request) {
  const parsed = QUERY.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return badRequest();
  const { x, y, salt } = parsed.data;
  return respondWithLedger(async () => {
    const reader = getLedgerReader();
    const address = await reader.accountAddress({ kty: 'EC', crv: 'P-256', x, y }, BigInt(salt));
    const deployed = await reader.isDeployed(address);
    return Response.json({ address, deployed, ...(ledgerAddress() && { ledger: ledgerAddress() }) });
  });
}
