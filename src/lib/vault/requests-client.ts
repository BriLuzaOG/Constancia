// Browser only: the holder's three calls to the blind mailbox.
import { z } from 'zod';
import type { EcdhJwk, P256Jwk } from '@/lib/credential/types';
import type { RequestKind } from './types';

export interface CreateRequestBody {
  employer: string;
  employeeRef: string;
  kind: RequestKind;
  signJwk: P256Jwk;
  encJwk: EcdhJwk;
}

const created = z.object({ id: z.string().regex(/^[0-9a-f]{32}$/), expiresAt: z.string() });
const polled = z.object({
  status: z.enum(['PENDING', 'ISSUED', 'DECLINED', 'EXPIRED']),
  delivery: z.string().nullable(),
});

export type PolledRequest = z.output<typeof polled>;

export class RequestGoneError extends Error {}

async function call(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, { cache: 'no-store', ...init });
  if (response.status === 404) throw new RequestGoneError();
  if (!response.ok) throw new Error(`The server answered ${response.status}`);
  return response.json();
}

export async function postRequest(body: CreateRequestBody): Promise<string> {
  const json = await call('/api/requests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return created.parse(json).id;
}

export async function getRequest(id: string): Promise<PolledRequest> {
  return polled.parse(await call(`/api/requests/${id}`));
}

export async function ackRequest(id: string): Promise<void> {
  await call(`/api/requests/${id}/ack`, { method: 'POST' });
}
