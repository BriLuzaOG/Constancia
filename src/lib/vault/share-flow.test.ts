import { describe, expect, it } from 'vitest';
import { presentCredential, REVEAL_TEMPLATES } from '@/lib/credential/present';
import { openShare, sealShare } from '@/lib/credential/share-crypto';
import { makeWorld } from '@/lib/credential/test-fixtures';
import { claimViews, templateReveal, TEMPLATE_LABELS, type TemplateName } from './share-builder';
import { createShare, type ShareFlowDeps } from './share-flow';
import type { VaultCertificate } from './types';

async function setup() {
  const world = await makeWorld();
  const sent: { ciphertext: string; ttlSec: number }[] = [];
  const presented: string[][] = [];
  const certificate: VaultCertificate = {
    id: world.credential.credentialHash,
    sdJwt: world.credential.sdJwt,
    credentialHash: world.credential.credentialHash,
    employer: world.account,
    employerName: 'Empresa Demo A',
    kind: 'CURRENT',
    keyName: 'cert:test',
    receivedAt: 1,
  };
  const deps: ShareFlowDeps = {
    loadSigner: async () => world.holderSigner,
    present: (args) => {
      presented.push(args.reveal);
      return presentCredential(args);
    },
    seal: sealShare,
    postShare: async (ciphertext, ttlSec) => {
      sent.push({ ciphertext, ttlSec });
      return { id: 'f'.repeat(32), expiresAt: '2030-01-01T00:00:00Z' };
    },
    appUrl: 'https://constancia.example',
  };
  return { world, deps, certificate, sent, presented };
}

describe('share builder', () => {
  it('every template reveals exactly what the contract lists, limited to held claims', async () => {
    const { world } = await setup();
    for (const template of Object.keys(TEMPLATE_LABELS) as TemplateName[]) {
      const expected = REVEAL_TEMPLATES[template].filter((name) => world.credential.claims[name] !== undefined);
      expect(templateReveal(template, world.credential.claims)).toEqual(expected);
    }
  });

  it('the preview shows values only for revealed claims and bars for the rest', async () => {
    const { world } = await setup();
    const views = claimViews(world.credential.claims, ['jobTitle'], 'preview');
    expect(views.find((view) => view.name === 'jobTitle')).toMatchObject({ state: 'shown', value: 'Logistics Analyst' });
    const hidden = views.filter((view) => view.state === 'hidden');
    expect(hidden.length).toBe(views.length - 1);
    expect(hidden.every((view) => view.value === undefined)).toBe(true);
  });
});

describe('createShare', () => {
  it('hands the presenter the chosen claims and returns a fragment link with the key', async () => {
    const { deps, certificate, presented } = await setup();
    const reveal = templateReveal('employment', (await setup()).world.credential.claims);
    const created = await createShare(deps, { certificate, reveal, aud: 'Banco Demo', ttlSec: 3600 });
    expect(presented[0]).toEqual(reveal);
    expect(created.link).toMatch(/^https:\/\/constancia\.example\/verify#s=[0-9a-f]{32}\.[A-Za-z0-9_-]+$/);
  });

  it('sends the server only the ciphertext and the lifetime, and the key opens it', async () => {
    const { deps, certificate, sent } = await setup();
    const created = await createShare(deps, { certificate, reveal: ['jobTitle'], aud: 'Banco Demo', ttlSec: 86_400 });
    expect(sent).toHaveLength(1);
    expect(Object.keys(sent[0]!).toSorted()).toEqual(['ciphertext', 'ttlSec']);
    const key = created.link.split('.').at(-1)!;
    expect(sent[0]!.ciphertext).not.toContain(key);
    expect(await openShare(sent[0]!.ciphertext, key)).toBe(created.presentation);
  });

  it('refuses an empty selection', async () => {
    const { deps, certificate } = await setup();
    await expect(createShare(deps, { certificate, reveal: [], aud: 'x', ttlSec: 3600 })).rejects.toThrow();
  });
});
