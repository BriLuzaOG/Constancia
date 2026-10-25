import { devRoutesEnabled, notFound } from '@/lib/ledger/dev-gate';
import { badRequest } from '@/lib/ledger/gateway';
import { getMemoryWorld } from '@/lib/ledger/memory';
import { LedgerOpError, signedOpSchema } from '@/lib/ledger/memory-ops';

const MAX_BODY_BYTES = 4096;

export async function POST(request: Request) {
  if (!devRoutesEnabled()) return notFound();
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return badRequest();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return badRequest();
  }
  const op = signedOpSchema.safeParse(body);
  if (!op.success) return badRequest();
  const { ledger } = await getMemoryWorld();
  try {
    return Response.json(await ledger.execute(op.data));
  } catch (error) {
    if (!(error instanceof LedgerOpError)) throw error;
    return Response.json({ error: error.code, message: error.code }, { status: 409 });
  }
}
