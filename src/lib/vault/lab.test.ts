import { describe, expect, it } from 'vitest';
import { runAttack, type Sample } from '@/lib/credential/attacks';
import { generateSigner } from '@/lib/credential/keys';
import { issueCredential } from '@/lib/credential/sdjwt';
import { ACCOUNT, APP_URL, BLOCK_NUMBER, DID, ISSUER_NAME } from '@/lib/credential/test-fixtures';
import type { EmploymentRecord, P256PrivateJwk } from '@/lib/credential/types';
import { verifyPresentation, type LookupFn } from '@/lib/credential/verify';
import type { IssuerInfo } from '@/lib/ledger/types';
import { ATTACK_CARDS, presentOriginal } from './lab';
import { drainVerdict } from './drain-verdict';

const RECORD: EmploymentRecord = {
  givenName: 'María Fernanda',
  familyName: 'Rojas',
  nationalId: 'V-24.567.890',
  jobTitle: 'Logistics Analyst',
  employmentType: 'FULL_TIME',
  startDate: '2024-02-01',
  workCountry: 'VE',
};

async function labWorld() {
  const issuer = (await generateSigner()).signer;
  const holder = await generateSigner({ extractable: true });
  const issued = await issueCredential({
    record: RECORD,
    issuer: { did: DID, keyId: issuer.keyId },
    signer: issuer,
    holderJwk: holder.signer.jwk,
    appUrl: APP_URL,
  });
  const sample: Sample = {
    credential: issued.sdJwt,
    holderJwk: (await crypto.subtle.exportKey('jwk', holder.privateKey)) as P256PrivateJwk,
  };
  const now = Math.floor(Date.now() / 1000);
  const head = { number: 1300, time: now + 5 };
  const accredited: IssuerInfo = { account: ACCOUNT, name: ISSUER_NAME, status: 'ACTIVE', approvals: 3, quorum: 3, accreditedAt: now - 120 };
  const lookup: LookupFn = async (req) =>
    req.issuer === ACCOUNT
      ? {
          head,
          issuer: accredited,
          key: { keyId: issuer.keyId, jwk: issuer.jwk, addedAt: now - 120, removedAt: null },
          record:
            req.credentialHash === issued.credentialHash
              ? { credentialHash: issued.credentialHash, issuer: ACCOUNT, keyId: issuer.keyId, anchoredAt: now - 60, revokedAt: null, blockNumber: BLOCK_NUMBER }
              : null,
        }
      : { head, issuer: { ...accredited, account: req.issuer, name: 'Unknown', status: 'NONE', accreditedAt: null }, key: null, record: null };
  return { sample, lookup };
}

describe('Fake Letter Lab', () => {
  it('the original passes the same checks', async () => {
    const { sample, lookup } = await labWorld();
    const verdict = await drainVerdict(verifyPresentation(await presentOriginal(sample), { lookup }));
    expect(verdict.kind).toBe('AUTHENTIC');
  });

  it.each(ATTACK_CARDS)('$title stops at $stopsAt', async ({ id, stopsAt }) => {
    const { sample, lookup } = await labWorld();
    const { presentation, attack } = await runAttack(id, sample);
    const verdict = await drainVerdict(verifyPresentation(presentation, { lookup }));
    expect(attack.expectedFailure).toBe(stopsAt);
    expect(verdict).toMatchObject({ kind: 'NOT_AUTHENTIC', failedAt: stopsAt });
  });
});
