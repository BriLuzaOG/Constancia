// A full issuance on the memory ledger with the real signer, ledger client and encryption.
// The holder then decrypts the delivery and the verifier passes it; only the mailbox is faked.
import { describe, expect, it } from 'vitest';
import { generateSigner, signerFromPrivateJwk } from '../credential/keys';
import { issueCredential } from '../credential/sdjwt';
import { decryptFromIssuer, encryptForHolder, generateEncKey } from '../credential/share-crypto';
import { verifyCertificate, type Verdict } from '../credential/verify';
import { createMemoryAccountClient } from '../ledger/account-client-memory';
import { lookup } from '../ledger/gateway';
import { MemoryLedger } from '../ledger/memory';
import { DEMO_DIRECTORY } from './directory';
import { runIssue, type IssueDeps, type IssueProgress } from './issue';

async function drain(events: ReturnType<typeof verifyCertificate>): Promise<Verdict> {
  for (;;) {
    const step = await events.next();
    if (step.done) return step.value;
  }
}

describe('issuing end to end on the memory ledger', () => {
  it('anchors, delivers ciphertext the holder can open, and the certificate verifies', async () => {
    const ledger = new MemoryLedger();
    const { members } = await ledger.seed();
    const transport = (op: Parameters<MemoryLedger['execute']>[0]) => ledger.execute(op);

    const { signer } = await generateSigner();
    const employer = createMemoryAccountClient({ signer }, transport);
    await employer.applyForAccreditation('Orinoco Logistics (demo)');
    for (const member of members.slice(0, ledger.quorum)) {
      await createMemoryAccountClient({ signer: await signerFromPrivateJwk(member.jwk) }, transport).approve(employer.address);
    }

    const holderSign = (await generateSigner()).signer;
    const holderEnc = await generateEncKey();
    const request = { id: 'b'.repeat(32), employeeRef: 'E-1042', kind: 'CURRENT' as const, signJwk: holderSign.jwk, encJwk: holderEnc.jwk };

    let mailbox: string | null = null;
    let discarded = false;
    const deps: IssueDeps = {
      sign: (record, holderJwk) =>
        issueCredential({
          record,
          issuer: { did: `did:constancia:11155111:${employer.address}`, keyId: signer.keyId },
          signer,
          holderJwk,
          appUrl: 'http://localhost:3000',
        }),
      anchor: (hash) => employer.anchor(hash),
      encrypt: encryptForHolder,
      deliver: async (_id, jwe) => {
        // Never deliver before the hash is on the ledger.
        const { record } = await ledger.reader().record(employer.address, progress.credential!.credentialHash).then((r) => ({ record: r }));
        expect(record).not.toBeNull();
        mailbox = jwe;
      },
      record: async () => undefined,
      discard: () => {
        discarded = true;
      },
    };
    const progress: IssueProgress = {};
    await runIssue({ request, record: DEMO_DIRECTORY[0]!.record }, deps, progress, () => undefined);

    expect(discarded).toBe(true);
    expect(mailbox).not.toContain('Rojas'); // ciphertext only
    const opened = await decryptFromIssuer(mailbox!, holderEnc.privateKey);
    expect(opened).toBe(progress.credential!.sdJwt);

    const reader = ledger.reader();
    const verdict = await drain(verifyCertificate(opened, { lookup: (req) => lookup(reader, req) }));
    expect(verdict.kind).toBe('AUTHENTIC');
  });
});
