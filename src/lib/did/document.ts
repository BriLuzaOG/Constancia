import type { SecpJwk } from '@/lib/credential/types';
import type { DidDocument } from './types';

export function buildDidDocument(_did: string, _jwk: SecpJwk): DidDocument {
  throw new Error('not implemented: A5-S1');
}

export function findAssertionKey(_doc: DidDocument, _kid: string): SecpJwk | null {
  throw new Error('not implemented: A5-S1');
}
