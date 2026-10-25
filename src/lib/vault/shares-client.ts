// Browser only: stores a ciphertext on the blind server and gets its id back.
import { z } from 'zod';

const created = z.object({ id: z.string().regex(/^[0-9a-f]{32}$/), expiresAt: z.string() });

export async function postShare(ciphertext: string, ttlSec: number): Promise<{ id: string; expiresAt: string }> {
  const response = await fetch('/api/shares', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ciphertext, ttlSec }),
  });
  if (!response.ok) throw new Error(`The server answered ${response.status}`);
  return created.parse(await response.json());
}
