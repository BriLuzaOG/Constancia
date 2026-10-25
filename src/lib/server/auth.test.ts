import { beforeAll, describe, expect, it } from 'vitest';
import { toB64u, utf8 } from '../credential/jws';
import { generateSigner, type Es256Signer } from '../credential/keys';
import { createMemoryAccountClient } from '../ledger/account-client-memory';
import { getMemoryWorld } from '../ledger/memory';
import { finishChallenge, startChallenge } from './auth';
import { createChallenge, readChallenge, requireEmployer, sessionCookie } from './session';

let signer: Es256Signer;
let account: `0x${string}`;
let removable: { signer: Es256Signer; account: `0x${string}` };

const signChallenge = async (who: Es256Signer, challenge: string) =>
  toB64u(await who.sign(utf8(challenge)));

beforeAll(async () => {
  process.env.SESSION_SECRET = 'x'.repeat(48);
  const { ledger } = await getMemoryWorld();
  const transport = (op: Parameters<typeof ledger.execute>[0]) => ledger.execute(op);
  signer = (await generateSigner()).signer;
  const client = createMemoryAccountClient({ signer }, transport);
  await client.applyForAccreditation('Auth Test Org'); // creates the account and registers the key
  account = client.address;

  const first = (await generateSigner()).signer;
  const second = (await generateSigner()).signer;
  const owner = createMemoryAccountClient({ signer: first }, transport);
  await owner.applyForAccreditation('Removal Org');
  await owner.addKey(second.jwk);
  await owner.removeKey(first.keyId);
  removable = { signer: first, account: owner.address };
});

describe('device-key sign-in', () => {
  it('round-trips: challenge, signature, session cookie, requireEmployer', async () => {
    const challenge = await startChallenge(account, signer.keyId);
    const { token } = await finishChallenge(challenge, await signChallenge(signer, challenge));
    const cookie = sessionCookie(token);
    expect(cookie).toMatch(/HttpOnly; SameSite=Strict/);
    const req = new Request('http://x', { headers: { cookie: `constancia_session=${token}` } });
    expect(await requireEmployer(req)).toEqual({ account, keyId: signer.keyId });
  });

  it('refuses a signature from another key', async () => {
    const challenge = await startChallenge(account, signer.keyId);
    const other = (await generateSigner()).signer;
    await expect(finishChallenge(challenge, await signChallenge(other, challenge))).rejects.toMatchObject({
      status: 401,
      code: 'BAD_SIGNATURE',
    });
  });

  it('refuses an expired challenge', async () => {
    const challenge = await createChallenge({ account, keyId: signer.keyId });
    expect(await readChallenge(challenge)).not.toBeNull();
    const { SignJWT } = await import('jose');
    const expired = await new SignJWT({ account, keyId: signer.keyId, use: 'challenge' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(new TextEncoder().encode('x'.repeat(48)));
    await expect(finishChallenge(expired, await signChallenge(signer, expired))).rejects.toMatchObject({
      status: 401,
    });
  });

  it('does not accept a challenge token as a session', async () => {
    const challenge = await createChallenge({ account, keyId: signer.keyId });
    const req = new Request('http://x', { headers: { cookie: `constancia_session=${challenge}` } });
    await expect(requireEmployer(req)).rejects.toMatchObject({ status: 401 });
  });

  it('refuses an unknown key and a removed key', async () => {
    const stranger = (await generateSigner()).signer;
    await expect(startChallenge(account, stranger.keyId)).rejects.toMatchObject({ code: 'KEY_UNKNOWN' });
    await expect(startChallenge(removable.account, removable.signer.keyId)).rejects.toMatchObject({
      code: 'KEY_UNKNOWN',
    });
  });

  it('answers 401 without a cookie', async () => {
    await expect(requireEmployer(new Request('http://x'))).rejects.toMatchObject({ status: 401 });
  });
});
