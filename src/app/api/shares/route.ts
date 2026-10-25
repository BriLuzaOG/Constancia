import { getDb } from '@/lib/server/db';
import { readJson, respond } from '@/lib/server/http';
import { MAX_SHARE_BYTES, createShareSchema, newId } from '@/lib/server/mailbox';
import { rateLimit } from '@/lib/server/rate-limit';

const ENVELOPE_BYTES = 256;

export function POST(req: Request) {
  return respond(async () => {
    rateLimit(req, 'shares:create', { limit: 30, windowMs: 60_000 });
    const { ciphertext, ttlSec } = await readJson(req, createShareSchema, MAX_SHARE_BYTES + ENVELOPE_BYTES);
    const id = newId();
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    await getDb().share.create({ data: { id, ciphertext, expiresAt } });
    return Response.json({ id, expiresAt: expiresAt.toISOString() });
  });
}
