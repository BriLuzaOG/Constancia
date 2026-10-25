import 'server-only';
import type { Address, Hex } from '../credential/types';
import { HttpError } from './http';

export { HttpError };

export async function requireEmployer(_req: Request): Promise<{ account: Address; keyId: Hex }> {
  throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in first');
}
