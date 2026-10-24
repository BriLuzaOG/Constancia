import { describe, expect, it } from 'vitest';
import type { RecordInfo } from '../ledger/types';
import { sha256B64u } from './jws';
import { generateSigner, type Es256Signer } from './keys';
import { issueCredential, type IssuedCredential } from './sdjwt';
import {
  buildTimeline,
  buildVerifiedCv,
  verifyVerifiedCv,
  type CvEvent,
  type CvVerdict,
  type TimelineInput,
} from './passport';
import { decodePresentation, presentCredential, REVEAL_TEMPLATES } from './present';
import { APP_URL } from './test-fixtures';
import type { Address, ClaimName } from './types';
import { verifyPresentation, type LookupFn, type CheckCode, type CheckEvent, type Verdict } from './verify';

const AUD = 'Banco Demo';
const TTL_SEC = 3600;
const CHAIN_DID = (account: Address) => `did:constancia:24024:${account}`;
const CODES: CheckCode[] = ['TOKEN', 'ISSUER', 'SIGNATURE', 'HOLDER', 'LEDGER'];
const ISSUER_DIRECTORY: { account: Address; name: string }[] = [
  { account: '0x1f9a000000000000000000000000000000000001', name: 'Empresa Demo A' },
  { account: '0x1f9a000000000000000000000000000000000002', name: 'Banco Demo' },
];

interface CvItem {
  credential: string;
  holder: Es256Signer;
  reveal: ClaimName[];
}

interface CvWorld {
  items: CvItem[];
  lookup: LookupFn;
  setRecord(index: number, patch: Partial<RecordInfo>): void;
}

interface CvFile {
  type: string;
  v: number;
  presentations: string[];
}

const nowSec = (): number => Math.floor(Date.now() / 1000);

const employmentOf = (i: number) => ({
  givenName: 'María Fernanda',
  familyName: 'Rojas',
  nationalId: 'V-24.567.890',
  jobTitle: `Role ${i}`,
  employmentType: 'FULL_TIME' as const,
  startDate: `${2000 + 2 * i}-01-01`,
  endDate: `${2000 + 2 * i}-12-31`,
  workCountry: 'VE',
});

/** n certificates, each with its own holder key, issued alternately by the two issuer accounts. */
async function makeCvWorld(n: number): Promise<CvWorld> {
  const issuers = await Promise.all(
    ISSUER_DIRECTORY.map(async (entry) => ({ ...entry, signer: (await generateSigner()).signer })),
  );
  const created = nowSec();
  const certs = await Promise.all(
    Array.from({ length: n }, async (_, i) => {
      const issuer = issuers[i % issuers.length];
      const holder = (await generateSigner()).signer;
      const credential: IssuedCredential = await issueCredential({
        record: employmentOf(i),
        issuer: { did: CHAIN_DID(issuer.account), keyId: issuer.signer.keyId },
        signer: issuer.signer,
        holderJwk: holder.jwk,
        appUrl: APP_URL,
      });
      const record: RecordInfo = {
        credentialHash: credential.credentialHash,
        issuer: issuer.account,
        keyId: issuer.signer.keyId,
        anchoredAt: created - 60,
        revokedAt: null,
        blockNumber: 1000 + i,
      };
      return { credential, holder, issuer, record };
    }),
  );

  const lookup: LookupFn = async (req) => {
    const cert = certs.find((c) => c.record.credentialHash === req.credentialHash);
    const issuer = issuers.find((i) => i.account === req.issuer)!;
    return {
      head: { number: 1300, time: nowSec() + 5 },
      issuer: {
        account: issuer.account,
        name: issuer.name,
        status: 'ACTIVE',
        approvals: 3,
        quorum: 3,
        accreditedAt: created - 120,
      },
      key: { keyId: issuer.signer.keyId, jwk: issuer.signer.jwk, addedAt: created - 120, removedAt: null },
      record: cert?.record ?? null,
    };
  };

  return {
    items: certs.map((c) => ({
      credential: c.credential.sdJwt,
      holder: c.holder,
      reveal: REVEAL_TEMPLATES.employment,
    })),
    lookup,
    setRecord(index, patch) {
      certs[index].record = { ...certs[index].record, ...patch };
    },
  };
}

const buildCv = (items: CvItem[]): Promise<string> => buildVerifiedCv({ items, aud: AUD, ttlSec: TTL_SEC });

const presentationsOf = (json: string): string[] => (JSON.parse(json) as CvFile).presentations;

const cvJson = (presentations: string[]): string =>
  JSON.stringify({ type: 'constancia-cv', v: 1, presentations });

async function drain<E, V>(generator: AsyncGenerator<E, V>): Promise<{ events: E[]; verdict: V }> {
  const events: E[] = [];
  let step = await generator.next();
  while (!step.done) {
    events.push(step.value);
    step = await generator.next();
  }
  return { events, verdict: step.value };
}

const verifyCv = (input: string, lookup: LookupFn) =>
  drain(verifyVerifiedCv(input, { lookup }));

describe('buildVerifiedCv and verifyVerifiedCv', () => {
  it('verifies three certificates with five checks each, in order', async () => {
    const world = await makeCvWorld(3);
    const { events, verdict } = await verifyCv(await buildCv(world.items), world.lookup);

    expect(verdict).toMatchObject({ kind: 'AUTHENTIC', entries: expect.any(Array) });
    expect(verdict.kind === 'AUTHENTIC' && verdict.entries).toHaveLength(3);
    expect(events.map((e) => e.entry)).toEqual([...Array(10).fill(0), ...Array(10).fill(1), ...Array(10).fill(2)]);
    for (const entry of [0, 1, 2]) {
      const rows = events
        .filter((e) => e.entry === entry)
        .map(({ code, status }): [CheckCode, string] => [code, status]);
      expect(rows).toEqual(CODES.flatMap((code) => [[code, 'CHECKING'], [code, 'VERIFIED']]));
    }
  });

  it('seals every presentation with the same aud, nonce and cv_set', async () => {
    const world = await makeCvWorld(3);
    const json = await buildCv(world.items);
    const cv = JSON.parse(json) as CvFile;
    const presentations = cv.presentations;

    expect(cv).toMatchObject({ type: 'constancia-cv', v: 1 });
    expect(presentations).toHaveLength(3);

    const sdHashes = presentations.map((p) => sha256B64u(p.slice(0, p.lastIndexOf('~') + 1)));
    const expectedCvSet = sha256B64u([...sdHashes].sort().join('~'));
    const payloads = presentations.map((p) => decodePresentation(p).keyBinding!.payload);

    expect(new Set(payloads.map((p) => p.aud))).toEqual(new Set([AUD]));
    expect(new Set(payloads.map((p) => p.nonce)).size).toBe(1);
    expect(payloads.map((p) => p.sd_hash)).toEqual(sdHashes);
    for (const payload of payloads) expect(payload.cv_set).toBe(expectedCvSet);
  });

  it('rejects a CV from which a presentation was removed after sealing', async () => {
    const world = await makeCvWorld(3);
    const [, ...rest] = presentationsOf(await buildCv(world.items));

    const { verdict } = await verifyCv(cvJson(rest), world.lookup);

    expect(verdict).toMatchObject({ kind: 'NOT_AUTHENTIC', failedEntry: 0, failedAt: 'HOLDER' });
  });

  it('rejects a CV to which a certificate of another person was added', async () => {
    const world = await makeCvWorld(3);
    const stranger = await makeCvWorld(1);
    const [strangerPresentation] = presentationsOf(await buildCv(stranger.items));
    const presentations = [...presentationsOf(await buildCv(world.items)), strangerPresentation];

    const { verdict } = await verifyCv(cvJson(presentations), world.lookup);

    expect(verdict).toMatchObject({ kind: 'NOT_AUTHENTIC', failedEntry: 0, failedAt: 'HOLDER' });
  });

  it('still verifies when the presentations are reordered', async () => {
    const world = await makeCvWorld(3);
    const reversed = [...presentationsOf(await buildCv(world.items))].reverse();

    const { verdict } = await verifyCv(cvJson(reversed), world.lookup);

    expect(verdict).toMatchObject({ kind: 'AUTHENTIC' });
    expect(verdict.kind === 'AUTHENTIC' && verdict.entries).toHaveLength(3);
  });

  it('fails at LEDGER on the entry whose certificate was revoked', async () => {
    const world = await makeCvWorld(3);
    world.setRecord(1, { revokedAt: nowSec() });

    const { verdict } = await verifyCv(await buildCv(world.items), world.lookup);

    expect(verdict).toMatchObject({ kind: 'NOT_AUTHENTIC', failedEntry: 1, failedAt: 'LEDGER' });
  });

  it('verifies a single presentation without cv_set through verifyPresentation', async () => {
    const world = await makeCvWorld(1);
    const [item] = world.items;
    const presentation = await presentCredential({
      credential: item.credential,
      holder: item.holder,
      reveal: item.reveal,
      aud: AUD,
      ttlSec: TTL_SEC,
    });

    const { verdict } = await drain<CheckEvent, Verdict>(
      verifyPresentation(presentation, { lookup: world.lookup }),
    );

    expect(verdict).toMatchObject({ kind: 'AUTHENTIC' });
    expect(decodePresentation(presentation).keyBinding!.payload).not.toHaveProperty('cv_set');
  });

  it('rejects text that is not JSON at TOKEN', async () => {
    const world = await makeCvWorld(1);

    const { verdict } = await verifyCv('hello', world.lookup);

    expect(verdict).toMatchObject({ kind: 'NOT_AUTHENTIC', failedEntry: null, failedAt: 'TOKEN' });
  });

  it('rejects JSON of the wrong type at TOKEN', async () => {
    const world = await makeCvWorld(1);

    const { verdict } = await verifyCv(JSON.stringify({ type: 'other', v: 1, presentations: [] }), world.lookup);

    expect(verdict).toMatchObject({ kind: 'NOT_AUTHENTIC', failedEntry: null, failedAt: 'TOKEN' });
  });

  it('rejects an empty CV at TOKEN', async () => {
    const world = await makeCvWorld(1);

    const { verdict } = await verifyCv(cvJson([]), world.lookup);

    expect(verdict).toMatchObject({ kind: 'NOT_AUTHENTIC', failedEntry: null, failedAt: 'TOKEN' });
  });

  it('rejects a CV with 13 presentations at TOKEN', async () => {
    const world = await makeCvWorld(1);
    const [presentation] = presentationsOf(await buildCv(world.items));

    const { verdict } = await verifyCv(cvJson(Array(13).fill(presentation)), world.lookup);

    expect(verdict).toMatchObject({ kind: 'NOT_AUTHENTIC', failedEntry: null, failedAt: 'TOKEN' });
  });

  it('is UNAVAILABLE when the ledger lookup throws', async () => {
    const world = await makeCvWorld(2);
    const failingLookup: LookupFn = async () => {
      throw new Error('ledger offline');
    };

    const { verdict } = await verifyCv(await buildCv(world.items), failingLookup);

    expect(verdict).toMatchObject({ kind: 'UNAVAILABLE' });
  });
});

describe('buildTimeline', () => {
  const entry = (overrides: Partial<TimelineInput> & Pick<TimelineInput, 'id'>): TimelineInput => ({
    employer: 'Empresa Demo A',
    ...overrides,
  });

  it('sorts entries by startDate', () => {
    const timeline = buildTimeline([
      entry({ id: 'b', startDate: '2021-01-01', endDate: '2021-06-30' }),
      entry({ id: 'a', startDate: '2019-01-01', endDate: '2020-06-30' }),
    ]);

    expect(timeline.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(timeline.items.every((i) => !i.datesHidden)).toBe(true);
  });

  it('puts an entry without startDate last with datesHidden', () => {
    const timeline = buildTimeline([
      entry({ id: 'x' }),
      entry({ id: 'b', startDate: '2021-01-01', endDate: '2021-06-30' }),
      entry({ id: 'a', startDate: '2019-01-01', endDate: '2020-06-30' }),
    ]);

    expect(timeline.items.map((i) => [i.id, i.datesHidden])).toEqual([
      ['a', false],
      ['b', false],
      ['x', true],
    ]);
  });

  it('reports no gap after an employedNow entry', () => {
    const timeline = buildTimeline([
      entry({ id: 'old', startDate: '2010-01-01', endDate: '2015-01-01' }),
      entry({ id: 'now', startDate: '2015-01-10', employedNow: true }),
    ]);

    expect(timeline.gaps).toEqual([]);
    expect(timeline.overlaps).toEqual([]);
  });

  it('reports a three month gap between two entries', () => {
    const timeline = buildTimeline([
      entry({ id: 'a', startDate: '2019-01-01', endDate: '2020-01-31' }),
      entry({ id: 'b', startDate: '2020-05-01', endDate: '2020-12-31' }),
    ]);

    expect(timeline.gaps).toEqual([{ from: '2020-01-31', to: '2020-05-01', months: 3 }]);
  });

  it('does not report a gap under one month', () => {
    const timeline = buildTimeline([
      entry({ id: 'a', startDate: '2019-01-01', endDate: '2020-01-10' }),
      entry({ id: 'b', startDate: '2020-02-05', endDate: '2020-12-31' }),
    ]);

    expect(timeline.gaps).toEqual([]);
  });

  it('returns the ids of two overlapping entries', () => {
    const timeline = buildTimeline([
      entry({ id: 'a', startDate: '2020-01-01', endDate: '2020-06-30' }),
      entry({ id: 'b', startDate: '2020-06-01', endDate: '2020-12-31' }),
    ]);

    expect(timeline.overlaps).toEqual([{ a: 'a', b: 'b' }]);
  });

  it('does not report back-to-back entries as overlapping', () => {
    const timeline = buildTimeline([
      entry({ id: 'a', startDate: '2020-01-01', endDate: '2020-06-30' }),
      entry({ id: 'b', startDate: '2020-07-01', endDate: '2020-12-31' }),
    ]);

    expect(timeline.overlaps).toEqual([]);
  });

  it('measures gaps from the latest end, so an overlapped entry creates no fake gap', () => {
    const timeline = buildTimeline([
      entry({ id: 'a', startDate: '2020-01-01', endDate: '2021-12-31' }),
      entry({ id: 'b', startDate: '2020-03-01', endDate: '2020-04-30' }),
      entry({ id: 'c', startDate: '2022-03-01', endDate: '2022-06-30' }),
    ]);

    expect(timeline.gaps).toEqual([{ from: '2021-12-31', to: '2022-03-01', months: 2 }]);
    expect(timeline.overlaps).toEqual([{ a: 'a', b: 'b' }]);
  });
});
