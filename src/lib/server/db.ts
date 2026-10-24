import 'server-only';

// Returns a PrismaClient once A4-S1 generates the client; the generated client is not in the repo yet.
export function getDb(): never {
  throw new Error('not implemented: A4-S1');
}
