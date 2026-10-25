import { z } from 'zod';
import { finishChallenge } from '@/lib/server/auth';
import { readJson, respond } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { sessionCookie } from '@/lib/server/session';

const BODY = z.object({ challenge: z.string().min(1).max(2048), signature: z.string().min(1).max(256) });

export function POST(req: Request) {
  return respond(async () => {
    rateLimit(req, 'auth:session', { limit: 20, windowMs: 60_000 });
    const { challenge, signature } = await readJson(req, BODY, 4096);
    const { account, token } = await finishChallenge(challenge, signature);
    return Response.json({ account }, { headers: { 'set-cookie': sessionCookie(token) } });
  });
}
