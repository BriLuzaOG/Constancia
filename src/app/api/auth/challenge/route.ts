import { z } from 'zod';
import { startChallenge } from '@/lib/server/auth';
import { readJson, respond } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

const lowercaseHex = (digits: number) =>
  z
    .string()
    .regex(new RegExp(`^0x[0-9a-fA-F]{${digits}}$`))
    .transform((value) => value.toLowerCase() as `0x${string}`);

const BODY = z.object({ account: lowercaseHex(40), keyId: lowercaseHex(64) });

export function POST(req: Request) {
  return respond(async () => {
    rateLimit(req, 'auth:challenge', { limit: 20, windowMs: 60_000 });
    const { account, keyId } = await readJson(req, BODY, 512);
    return Response.json({ challenge: await startChallenge(account, keyId) });
  });
}
