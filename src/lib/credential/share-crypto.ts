import type { EcdhJwk } from './types';

export async function generateEncKey(): Promise<{ privateKey: CryptoKey; jwk: EcdhJwk }> {
  throw new Error('not implemented: A2-S2');
}

export async function encryptForHolder(_plaintext: string, _jwk: EcdhJwk): Promise<string> {
  throw new Error('not implemented: A2-S2');
}

export async function decryptFromIssuer(_jwe: string, _privateKey: CryptoKey): Promise<string> {
  throw new Error('not implemented: A2-S2');
}

export async function sealShare(_plaintext: string): Promise<{ ciphertext: string; key: string }> {
  throw new Error('not implemented: A2-S2');
}

export async function openShare(_ciphertext: string, _key: string): Promise<string> {
  throw new Error('not implemented: A2-S2');
}
