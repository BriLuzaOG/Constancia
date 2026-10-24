import { describe, expect, it } from 'vitest';
import { toB64u } from './jws';
import {
  decryptFromIssuer,
  encryptForHolder,
  generateEncKey,
  openShare,
  sealShare,
} from './share-crypto';

describe('holder delivery (ECDH-ES + A256GCM)', () => {
  it('round-trips through the holder key', async () => {
    const { privateKey, jwk } = await generateEncKey();
    const jwe = await encryptForHolder('constancia payload', jwk);
    expect(await decryptFromIssuer(jwe, privateKey)).toBe('constancia payload');
  });

  it('rejects a different holder key', async () => {
    const { jwk } = await generateEncKey();
    const other = await generateEncKey();
    const jwe = await encryptForHolder('constancia payload', jwk);
    await expect(decryptFromIssuer(jwe, other.privateKey)).rejects.toThrow();
  });
});

describe('share link seal (dir + A256GCM)', () => {
  it('round-trips with its key', async () => {
    const { ciphertext, key } = await sealShare('presentation payload');
    expect(await openShare(ciphertext, key)).toBe('presentation payload');
  });

  it('rejects a random 32-byte key', async () => {
    const { ciphertext } = await sealShare('presentation payload');
    const wrongKey = toB64u(crypto.getRandomValues(new Uint8Array(32)));
    await expect(openShare(ciphertext, wrongKey)).rejects.toThrow();
  });

  it('keeps the plaintext out of the ciphertext', async () => {
    const plaintext = 'Rojas employed since 2024-03-01';
    const { ciphertext } = await sealShare(plaintext);
    expect(ciphertext).not.toContain(plaintext);
    expect(ciphertext).not.toContain(toB64u(plaintext));
  });

  it('gives every share its own key', async () => {
    const first = await sealShare('payload');
    const second = await sealShare('payload');
    expect(first.key).not.toBe(second.key);
  });
});
