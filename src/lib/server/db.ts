import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const shared = globalThis as { __constanciaDb?: PrismaClient };

// Lazy: `next build` and CI run without DATABASE_URL. Read directly instead of serverEnv(), which
// would also demand every ledger variable just to open the database.
export function getDb(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return (shared.__constanciaDb ??= new PrismaClient({ adapter: new PrismaPg({ connectionString }) }));
}
