import { respond } from '@/lib/server/http';
import { sessionCookie } from '@/lib/server/session';

export function POST() {
  return respond(async () => Response.json({}, { headers: { 'set-cookie': sessionCookie('', 0) } }));
}
