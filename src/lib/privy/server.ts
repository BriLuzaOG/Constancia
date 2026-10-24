import 'server-only';
import type { Hex } from '@/lib/credential/types';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'HttpError';
  }
}

export async function requireAdmin(
  req: Request,
): Promise<{ privyUserId: string; walletAddress: Hex }> {
  void req;
  throw new Error('not implemented: A3-S1');
}
