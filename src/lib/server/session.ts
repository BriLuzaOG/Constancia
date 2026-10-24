import 'server-only';
import type { Address, Hex } from '../credential/types';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message = code) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export async function requireEmployer(_req: Request): Promise<{ account: Address; keyId: Hex }> {
  throw new Error('not implemented: A4-S2');
}
