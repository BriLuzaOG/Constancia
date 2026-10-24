import type { Hex, SecpJwk } from './types';

export function verifyJwtSignature(_jwt: string, _jwk: SecpJwk): boolean {
  throw new Error('not implemented: A2-S1');
}

export function jwkFromPublicKey(_uncompressed: Uint8Array | Hex): SecpJwk {
  throw new Error('not implemented: A2-S1');
}

export function addressFromJwk(_jwk: SecpJwk): Hex {
  throw new Error('not implemented: A2-S1');
}
