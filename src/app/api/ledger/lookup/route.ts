import { z } from 'zod';
import { badRequest, lookup, respondWithLedger } from '@/lib/ledger/gateway';
import { getLedgerReader } from '@/lib/ledger/reader';

const MAX_BODY_BYTES = 1024;
const lowercaseHex = (digits: number) =>
  z
    .string()
    .regex(new RegExp(`^0x[0-9a-fA-F]{${digits}}$`))
    .transform((value) => value.toLowerCase() as `0x${string}`);

const LOOKUP_REQUEST = z.object({
  issuer: lowercaseHex(40),
  keyId: lowercaseHex(64),
  credentialHash: lowercaseHex(64),
});

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return badRequest();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return badRequest();
  }
  const parsed = LOOKUP_REQUEST.safeParse(body);
  if (!parsed.success) return badRequest();
  return respondWithLedger(async () => Response.json(await lookup(getLedgerReader(), parsed.data)));
}
