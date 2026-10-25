import { describe, expect, it } from 'vitest';
import { generateSigner } from '@/lib/credential/keys';
import { generateEncKey } from '@/lib/credential/share-crypto';
import { startRequest, type RequestFlowDeps } from './request-flow';
import type { CreateRequestBody } from './requests-client';
import { createMemoryStore } from './store';

const EMPLOYER = `0x${'ab'.repeat(20)}`;
const KEY_FIELDS = ['crv', 'kty', 'x', 'y'];

function setup() {
  const posted: CreateRequestBody[] = [];
  const store = createMemoryStore();
  const deps: RequestFlowDeps = {
    store,
    createSigner: async () => (await generateSigner()).signer,
    generateEncKey,
    postRequest: async (body) => {
      posted.push(body);
      return `${'a'.repeat(31)}${posted.length}`;
    },
  };
  return { deps, posted, store };
}

describe('startRequest', () => {
  it('posts the two public keys, the employer, the number and the kind, nothing else', async () => {
    const { deps, posted } = setup();
    await startRequest(deps, { employer: EMPLOYER, employeeRef: ' E-1042 ', kind: 'CURRENT' });
    const [body] = posted;
    expect(Object.keys(body!).toSorted()).toEqual([
      'employeeRef',
      'employer',
      'encJwk',
      'kind',
      'signJwk',
    ]);
    expect(body).toMatchObject({ employer: EMPLOYER, employeeRef: 'E-1042', kind: 'CURRENT' });
    expect(Object.keys(body!.signJwk).toSorted()).toEqual(KEY_FIELDS);
    expect(Object.keys(body!.encJwk).toSorted()).toEqual(KEY_FIELDS);
  });

  it('stores the request with its private ECDH key and makes new keys each time', async () => {
    const { deps, posted, store } = setup();
    const first = await startRequest(deps, { employer: EMPLOYER, employeeRef: 'E-1', kind: 'PAST' });
    const second = await startRequest(deps, { employer: EMPLOYER, employeeRef: 'E-1', kind: 'PAST' });
    expect(first.encPrivateKey).toBeDefined();
    expect(await store.listRequests()).toHaveLength(2);
    expect(first.keyName).not.toBe(second.keyName);
    expect(posted[0]!.signJwk.x).not.toBe(posted[1]!.signJwk.x);
    expect(posted[0]!.encJwk.x).not.toBe(posted[1]!.encJwk.x);
  });

  it('rejects an employee number over 40 characters before making any key', async () => {
    const { deps, posted } = setup();
    await expect(
      startRequest(deps, { employer: EMPLOYER, employeeRef: 'x'.repeat(41), kind: 'CURRENT' }),
    ).rejects.toThrow();
    expect(posted).toHaveLength(0);
  });
});
