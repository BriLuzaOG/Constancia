import { base64url } from 'jose';
import { concatBytes } from '@noble/hashes/utils.js';
import { keccak256, toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { generateSigner, keyIdOf, signerFromPrivateJwk, verifyEs256 } from './keys';
import type { P256Jwk, P256PrivateJwk } from './types';

const message = new TextEncoder().encode('employment credential payload');

// The P-256 generator point, a fixed public key for the keyId vector.
const FIXED_JWK: P256Jwk = {
  kty: 'EC',
  crv: 'P-256',
  x: 'axfR8uEsQkf4vOblY6RA8ncDfYEt6zOg9KE5RdiYwpY',
  y: 'T-NC4v4af5uO5-tKfA-eFivOM1drMV7Oy7ZAaDe_UfU',
};
const FIXED_KEY_ID = '0xa000ddb94882f9f9cd0a859ed3a9f047ad43d7e2e4e7e491f1fe2e657a2651b6';

const flipFirstByte = (bytes: Uint8Array): Uint8Array => {
  const copy = new Uint8Array(bytes);
  copy[0] ^= 0x01;
  return copy;
};

describe('ES256 sign and verify', () => {
  it('verifies a signature made by the same key', async () => {
    const { signer } = await generateSigner();
    const signature = await signer.sign(message);
    expect(await verifyEs256(signer.jwk, message, signature)).toBe(true);
  });

  it('returns a 64-byte r||s signature', async () => {
    const { signer } = await generateSigner();
    expect((await signer.sign(message)).length).toBe(64);
  });

  it('fails when one byte of the message changes', async () => {
    const { signer } = await generateSigner();
    const signature = await signer.sign(message);
    expect(await verifyEs256(signer.jwk, flipFirstByte(message), signature)).toBe(false);
  });

  it('fails when one byte of the signature changes', async () => {
    const { signer } = await generateSigner();
    const signature = await signer.sign(message);
    expect(await verifyEs256(signer.jwk, message, flipFirstByte(signature))).toBe(false);
  });

  it('fails with a different key', async () => {
    const { signer } = await generateSigner();
    const other = await generateSigner();
    const signature = await signer.sign(message);
    expect(await verifyEs256(other.signer.jwk, message, signature)).toBe(false);
  });
});

describe('keyIdOf', () => {
  it('equals keccak256 of the concatenated 32-byte x and y', () => {
    const x = base64url.decode(FIXED_JWK.x);
    const y = base64url.decode(FIXED_JWK.y);
    expect(x.length).toBe(32);
    expect(y.length).toBe(32);
    expect(keyIdOf(FIXED_JWK)).toBe(keccak256(toHex(concatBytes(x, y))));
  });

  it('matches the hard-coded vector', () => {
    expect(keyIdOf(FIXED_JWK)).toBe(FIXED_KEY_ID);
  });
});

describe('signerFromPrivateJwk', () => {
  it('re-imports an extractable key with the same keyId and a verifiable signature', async () => {
    const { signer, privateKey } = await generateSigner({ extractable: true });
    const privateJwk = (await crypto.subtle.exportKey('jwk', privateKey)) as P256PrivateJwk;
    const reimported = await signerFromPrivateJwk(privateJwk);

    expect(reimported.keyId).toBe(signer.keyId);
    expect(reimported.jwk).toEqual(signer.jwk);
    const signature = await reimported.sign(message);
    expect(await verifyEs256(signer.jwk, message, signature)).toBe(true);
  });
});
