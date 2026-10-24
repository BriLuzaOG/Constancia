import type { Hex, P256Jwk, P256PrivateJwk } from './types';

export interface Es256Signer {
  keyId: Hex;
  jwk: P256Jwk;
  sign(message: Uint8Array): Promise<Uint8Array>; // 64-byte r||s, hashes with SHA-256
}

export async function generateSigner(_opts?: {
  extractable?: boolean;
}): Promise<{ signer: Es256Signer; privateKey: CryptoKey }> {
  throw new Error('not implemented: A2-S1');
}

export async function signerFromPrivateJwk(
  _jwk: P256PrivateJwk,
  _opts?: { extractable?: boolean },
): Promise<Es256Signer> {
  throw new Error('not implemented: A2-S1');
}

export function keyIdOf(_jwk: P256Jwk): Hex {
  throw new Error('not implemented: A2-S1');
}

export async function verifyEs256(
  _jwk: P256Jwk,
  _message: Uint8Array,
  _signature: Uint8Array,
): Promise<boolean> {
  throw new Error('not implemented: A2-S1');
}
