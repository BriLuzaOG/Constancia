import type { AttackId, Sample } from '@/lib/credential/attacks';
import { presentCredential, REVEAL_TEMPLATES } from '@/lib/credential/present';
import { signerFromPrivateJwk } from '@/lib/credential/keys';
import type { CheckCode } from '@/lib/credential/verify';

export interface AttackCard {
  id: AttackId;
  title: string;
  stopsAt: CheckCode;
}

/** In the order the lab shows them: each stops at a different check. */
export const ATTACK_CARDS: AttackCard[] = [
  { id: 'edit-claim', title: 'Edit a claim', stopsAt: 'TOKEN' },
  { id: 'forge-signature', title: 'Forge the employer’s signature', stopsAt: 'SIGNATURE' },
  { id: 'fake-employer', title: 'Pretend to be an employer', stopsAt: 'ISSUER' },
  { id: 'stolen-certificate', title: 'Use someone else’s certificate', stopsAt: 'HOLDER' },
];

/** The untouched sample, presented fresh with its published holder key. */
export async function presentOriginal(sample: Sample): Promise<string> {
  return presentCredential({
    credential: sample.credential,
    holder: await signerFromPrivateJwk(sample.holderJwk),
    reveal: REVEAL_TEMPLATES.employment,
    aud: 'Fake Letter Lab',
    ttlSec: 3600,
  });
}
