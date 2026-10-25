'use client';

import { useEffect, useState } from 'react';
import { Button, LinkButton } from '@/components/ui/button';
import { ClaimList } from '@/components/ui/claim-list';
import { Panel } from '@/components/ui/panel';
import { loadSigner } from '@/lib/credential/keystore';
import { presentCredential } from '@/lib/credential/present';
import { sealShare } from '@/lib/credential/share-crypto';
import type { ClaimName } from '@/lib/credential/types';
import { vaultStore } from '@/lib/vault/browser';
import { certificateInfo } from '@/lib/vault/certificate-info';
import {
  appUrl,
  claimViews,
  EXPIRIES,
  revealsIdentity,
  TEMPLATE_LABELS,
  templateReveal,
  toggleClaim,
  type TemplateName,
} from '@/lib/vault/share-builder';
import { createShare, NoKeyError, type CreatedShare } from '@/lib/vault/share-flow';
import { recordShare } from '@/lib/vault/share-history';
import { postShare } from '@/lib/vault/shares-client';
import type { VaultCertificate } from '@/lib/vault/types';
import { AudienceAndExpiry, ShareResult } from '../../../_components/share-fields';

function Builder({ certificate }: { certificate: VaultCertificate }) {
  const claims = certificateInfo(certificate).decoded.claims;
  const [reveal, setReveal] = useState<ClaimName[]>(() => templateReveal('employment', claims));
  const [aud, setAud] = useState('');
  const [ttlSec, setTtlSec] = useState<number>(EXPIRIES[1].ttlSec);
  const [created, setCreated] = useState<CreatedShare | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canCreate = reveal.length > 0 && aud.trim() !== '' && !busy;

  async function create() {
    setBusy(true);
    setFailure(null);
    try {
      const share = await createShare(
        { loadSigner, present: presentCredential, seal: sealShare, postShare, appUrl: appUrl() },
        { certificate, reveal, aud: aud.trim(), ttlSec },
      );
      recordShare({
        label: aud.trim(),
        expiresAt: share.expiresAt,
        claims: reveal,
        certificateId: certificate.id,
      });
      setCreated(share);
    } catch (caught) {
      setFailure(
        caught instanceof NoKeyError
          ? 'The key for this certificate is not on this device, so it cannot be shared from here.'
          : 'Could not create the link. Check your connection and try again.',
      );
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-8">
        <fieldset>
          <legend className="mb-3 font-bold text-small">Start from</legend>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(TEMPLATE_LABELS) as TemplateName[]).map((template) => (
              <Button
                key={template}
                variant="secondary"
                onClick={() => {
                  setReveal(templateReveal(template, claims));
                }}
              >
                {TEMPLATE_LABELS[template]}
              </Button>
            ))}
          </div>
        </fieldset>
        <ClaimList
          caption="Switch each claim on or off."
          claims={claimViews(claims, reveal, 'toggle')}
          onToggle={(name, next) => {
            setReveal((current) => toggleClaim(current, name as ClaimName, next));
          }}
        />
        {revealsIdentity(reveal) && (
          <p role="status" className="border-2 border-ink bg-white p-4 font-bold">
            This reveals your name and national ID.
          </p>
        )}
        <AudienceAndExpiry aud={aud} onAud={setAud} ttlSec={ttlSec} onTtl={setTtlSec} />
      </div>

      <div className="flex flex-col gap-8">
        <section aria-labelledby="preview-title" className="border-4 border-ink bg-white p-6">
          <h2
            id="preview-title"
            className="mb-4 font-display text-headline font-extrabold font-stretch-expanded"
          >
            What the reader sees
          </h2>
          {reveal.length === 0 ? (
            <p className="mb-4 font-bold">Choose at least one claim to show.</p>
          ) : null}
          <ClaimList claims={claimViews(claims, reveal, 'preview')} />
          <p className="mt-4 text-small text-ink-muted">
            Hidden claims cannot be read or guessed, even by us.
          </p>
        </section>

        <div className="flex flex-col gap-3">
          <div>
            <Button disabled={!canCreate} onClick={() => void create()}>
              {busy ? 'Creating…' : 'Create share link'}
            </Button>
          </div>
          {failure && (
            <p role="alert" className="font-bold text-red-text">
              {failure}
            </p>
          )}
        </div>

        {created && (
          <ShareResult
            title="Your link is ready"
            link={created.link}
            file={{ name: 'share.sdjwt', text: created.presentation }}
          />
        )}
      </div>
    </div>
  );
}

export function ShareBuilder({ id }: { id: string }) {
  const [certificate, setCertificate] = useState<VaultCertificate | null | undefined>(undefined);

  useEffect(() => {
    void vaultStore().getCertificate(id).then(setCertificate);
  }, [id]);

  if (certificate === undefined) return <p role="status">Opening the certificate…</p>;
  if (certificate === null) {
    return (
      <Panel title="Not in this vault">
        <p className="mb-4 text-body">This certificate is not on this device.</p>
        <LinkButton href="/vault">Back to your vault</LinkButton>
      </Panel>
    );
  }
  return <Builder certificate={certificate} />;
}
