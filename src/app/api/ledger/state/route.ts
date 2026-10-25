import { connection } from 'next/server';
import { respondWithLedger } from '@/lib/ledger/gateway';
import { getLedgerReader } from '@/lib/ledger/reader';

export async function GET() {
  await connection();
  return respondWithLedger(async () => Response.json(await getLedgerReader().state()));
}
