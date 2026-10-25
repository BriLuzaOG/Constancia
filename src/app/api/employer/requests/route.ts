import { getDb } from '@/lib/server/db';
import { respond } from '@/lib/server/http';
import { requireEmployer } from '@/lib/server/session';

export function GET(req: Request) {
  return respond(async () => {
    const { account } = await requireEmployer(req);
    const requests = await getDb().certRequest.findMany({
      where: { employer: account, status: 'PENDING', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, employeeRef: true, kind: true, signJwk: true, encJwk: true, createdAt: true },
    });
    return Response.json({ requests });
  });
}
