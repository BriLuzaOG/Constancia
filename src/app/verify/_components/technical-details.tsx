import { Disclosure } from '@/components/ui/disclosure';
import { Receipt } from '@/components/ui/receipt';
import type { DecodedPresentation } from '@/lib/credential/present';
import type { Verdict } from '@/lib/credential/verify';

type AuthenticVerdict = Extract<Verdict, { kind: 'AUTHENTIC' }>;

function digestsOf(payload: DecodedPresentation['payload']): string[] {
  const digests = (payload.credentialSubject as { _sd?: unknown } | undefined)?._sd;
  return Array.isArray(digests) ? digests.map(String) : [];
}

export function TechnicalDetails({
  verdict,
  decoded,
}: {
  verdict: AuthenticVerdict;
  decoded: DecodedPresentation;
}) {
  const { record, issuer } = verdict;
  const anchoredAt = new Date(record.anchoredAt * 1000).toISOString();
  return (
    <Disclosure summary="Technical details">
      <Receipt
        title="Credential and anchor"
        rows={[
          { label: 'Header', value: JSON.stringify(decoded.header), mono: true },
          { label: 'Issuer', value: issuer.did, mono: true },
          { label: 'Signing key (kid)', value: String(decoded.header.kid), mono: true },
          { label: 'Credential hash', value: record.credentialHash, mono: true },
          {
            label: 'Anchored',
            value: `block ${record.blockNumber} · ${anchoredAt}`,
            mono: true,
          },
          { label: 'Claim digests', value: digestsOf(decoded.payload).join(' '), mono: true },
          {
            label: 'Standards',
            value: 'W3C Verifiable Credentials 2.0 · SD-JWT · ES256 · did:constancia',
            mono: true,
          },
        ]}
      />
      <p className="mt-4 max-w-[65ch] text-small text-ink-muted">
        Selective disclosure, not zero-knowledge: hidden claims are salted hashes. The ledger
        proves who issued it and when, not that it is true.
      </p>
    </Disclosure>
  );
}
