import { respond } from '@/lib/server/http';
import { requireEmployer } from '@/lib/server/session';

// Stub until A4-S2 (sign-in) and A4-S4 (the real handler).
export function POST(req: Request) {
  return respond(async () => {
    await requireEmployer(req);
    return Response.json({});
  });
}
