'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClaimList } from '@/components/ui/claim-list';
import { Disclosure } from '@/components/ui/disclosure';
import { Timeline } from '@/components/ui/timeline';
import { loadSigner } from '@/lib/credential/keystore';
import { buildVerifiedCv } from '@/lib/credential/passport';
import { sealShare } from '@/lib/credential/share-crypto';
import type { ClaimName } from '@/lib/credential/types';
import {
  claimsOf,
  createCv,
  defaultReveal,
  previewTimeline,
  revealsName,
  type CvSelection,
} from '@/lib/vault/cv-builder';
import { timelineItems, type CvEntry } from '@/lib/vault/cv-entries';
import {
  appUrl,
  claimViews,
  EXPIRIES,
  TEMPLATE_LABELS,
  templateReveal,
  toggleClaim,
  type TemplateName,
} from '@/lib/vault/share-builder';
import { NoKeyError, type CreatedShare } from '@/lib/vault/share-flow';
import { postShare } from '@/lib/vault/shares-client';
import { AudienceAndExpiry, ShareResult } from '../../vault/_components/share-fields';

function EntryReveal({
  entry,
  reveal,
  onChange,
}: {
  entry: CvEntry;
  reveal: ClaimName[];
  onChange: (next: ClaimName[]) => void;
}) {
  const claims = claimsOf(entry);
  return (
    <Disclosure summary={`${entry.employer}${entry.jobTitle ? ` · ${entry.jobTitle}` : ''}`}>
      <div className="mb-4 flex flex-wrap gap-3">
        {(Object.keys(TEMPLATE_LABELS) as TemplateName[]).map((template) => (
          <Button
            key={template}
            variant="secondary"
            onClick={() => {
              onChange(templateReveal(template, claims));
            }}
          >
            {TEMPLATE_LABELS[template]}
          </Button>
        ))}
      </div>
      <ClaimList
        claims={claimViews(claims, reveal, 'toggle')}
        onToggle={(name, next) => {
          onChange(toggleClaim(reveal, name as ClaimName, next));
        }}
      />
    </Disclosure>
  );
}

export function CvBuilder({ included }: { included: CvEntry[] }) {
  const [reveals, setReveals] = useState<Record<string, ClaimName[]>>({});
  const [aud, setAud] = useState('');
  const [ttlSec, setTtlSec] = useState<number>(EXPIRIES[1].ttlSec);
  const [created, setCreated] = useState<CreatedShare | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selections: CvSelection[] = included.map((entry) => ({
    entry,
    reveal: reveals[entry.id] ?? defaultReveal(entry),
  }));
  const preview = previewTimeline(selections);
  const canCreate = selections.length > 0 && aud.trim() !== '' && !busy;

  async function create() {
    setBusy(true);
    setFailure(null);
    try {
      setCreated(
        await createCv(
          { loadSigner, buildCv: buildVerifiedCv, seal: sealShare, postShare, appUrl: appUrl() },
          { selections, aud: aud.trim(), ttlSec },
        ),
      );
    } catch (caught) {
      setFailure(
        caught instanceof NoKeyError
          ? 'A key for one of these certificates is not on this device, so the CV cannot be sealed here.'
          : 'Could not create the CV link. Check your connection and try again.',
      );
    }
    setBusy(false);
  }

  return (
    <section aria-labelledby="builder-title" className="grid gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-8">
        <h2 id="builder-title" className="font-display text-title font-extrabold font-stretch-expanded">
          Create your Verified CV
        </h2>
        <div>
          <p className="mb-3 text-small text-ink-muted">
            Each entry starts with employment and role. Open one to change what it reveals.
          </p>
          {selections.map(({ entry, reveal }) => (
            <EntryReveal
              key={entry.id}
              entry={entry}
              reveal={reveal}
              onChange={(next) => {
                setReveals((current) => ({ ...current, [entry.id]: next }));
              }}
            />
          ))}
        </div>
        {!revealsName(selections) && (
          <p role="status" className="border-2 border-ink bg-white p-4 font-bold">
            Reveal your name in at least one entry, or the reader will not know whose CV this is.
          </p>
        )}
        <AudienceAndExpiry aud={aud} onAud={setAud} ttlSec={ttlSec} onTtl={setTtlSec} />
      </div>

      <div className="flex flex-col gap-8">
        <section aria-labelledby="cv-preview-title" className="border-4 border-ink bg-white p-6">
          <h2
            id="cv-preview-title"
            className="mb-4 font-display text-headline font-extrabold font-stretch-expanded"
          >
            What the reader sees
          </h2>
          <Timeline items={timelineItems(preview)} gaps={preview.gaps} overlaps={preview.overlaps} />
        </section>
        <div className="flex flex-col gap-3">
          <div>
            <Button disabled={!canCreate} onClick={() => void create()}>
              {busy ? 'Creating…' : 'Create Verified CV'}
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
            title="Your Verified CV is ready"
            link={created.link}
            file={{ name: 'history.cv.json', text: created.presentation }}
          />
        )}
      </div>
    </section>
  );
}
