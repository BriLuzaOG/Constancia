import { CompactEncrypt, compactDecrypt, importJWK } from 'jose';
import { fromB64u, toB64u, utf8 } from './jws';
import type { EcdhJwk } from './types';

const ECDH = { name: 'ECDH', namedCurve: 'P-256' } as const;
const decoder = new TextDecoder();

/** Non-extractable ECDH P-256 key: the holder's delivery key for one request. */
export async function generateEncKey(): Promise<{ privateKey: CryptoKey; jwk: EcdhJwk }> {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(ECDH, false, [
    'deriveBits',
    'deriveKey',
  ]);
  const { x, y } = (await crypto.subtle.exportKey('jwk', publicKey)) as EcdhJwk;
  return { privateKey, jwk: { kty: 'EC', crv: 'P-256', x, y } };
}

/** JWE ECDH-ES + A256GCM. */
export async function encryptForHolder(plaintext: string, jwk: EcdhJwk): Promise<string> {
  const publicKey = await importJWK(jwk, 'ECDH-ES');
  return new CompactEncrypt(utf8(plaintext))
    .setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' })
    .encrypt(publicKey);
}

export async function decryptFromIssuer(jwe: string, privateKey: CryptoKey): Promise<string> {
  const { plaintext } = await compactDecrypt(jwe, privateKey, {
    keyManagementAlgorithms: ['ECDH-ES'],
    contentEncryptionAlgorithms: ['A256GCM'],
  });
  return decoder.decode(plaintext);
}

/** JWE dir + A256GCM with a random 256-bit key. The key goes in the link fragment, never to a server. */
export async function sealShare(plaintext: string): Promise<{ ciphertext: string; key: string }> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const ciphertext = await new CompactEncrypt(utf8(plaintext))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(key);
  return { ciphertext, key: toB64u(key) };
}

export async function openShare(ciphertext: string, key: string): Promise<string> {
  const { plaintext } = await compactDecrypt(ciphertext, fromB64u(key), {
    keyManagementAlgorithms: ['dir'],
    contentEncryptionAlgorithms: ['A256GCM'],
  });
  return decoder.decode(plaintext);
}
