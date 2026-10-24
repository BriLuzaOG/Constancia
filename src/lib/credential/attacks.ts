import type { CheckCode } from './verify';
import type { P256PrivateJwk } from './types';

// The Fake Letter Lab
export type AttackId = 'edit-claim' | 'forge-signature' | 'fake-employer' | 'stolen-certificate';
export interface Attack {
  id: AttackId;
  title: string;
  changed: string;
  expectedFailure: CheckCode;
}
export interface Sample {
  credential: string;
  holderJwk: P256PrivateJwk;
} // public/demo/sample.json

export async function runAttack(
  _id: AttackId,
  _sample: Sample,
): Promise<{ presentation: string; attack: Attack }> {
  throw new Error('not implemented: A2-S6');
}
