import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Button, LinkButton } from '@/components/ui/button';
import { Disclosure } from '@/components/ui/disclosure';
import { Field } from '@/components/ui/field';
import { Mono } from '@/components/ui/mono';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { Receipt } from '@/components/ui/receipt';
import { CheckListDemo, DropZoneDemo, LineFieldDemo, VerdictDemo } from './kit-demo';

export const metadata: Metadata = { title: 'UI kit · ScholarKey' };

// synthetic values only: the kit never shows a real credential
const CREDENTIAL_ID = '0x3f9a1c7e0b2d4a685c1e8b7a9d3f0e26a4b9c2d1e7f086351d6e3b9a0c7f2e54';

const TOKENS = [
  { name: 'paper', className: 'bg-paper' },
  { name: 'white', className: 'bg-white' },
  { name: 'ink', className: 'bg-ink' },
  { name: 'ink-muted', className: 'bg-ink-muted' },
  { name: 'rule', className: 'bg-rule' },
  { name: 'line-red', className: 'bg-line-red' },
  { name: 'line-blue', className: 'bg-line-blue' },
  { name: 'line-green', className: 'bg-line-green' },
  { name: 'line-yellow', className: 'bg-line-yellow' },
  { name: 'red-text', className: 'bg-red-text' },
  { name: 'green-text', className: 'bg-green-text' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-24">
      <h2 className="font-display text-headline font-extrabold font-stretch-expanded mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function KitPage() {
  return (
    <main className="mx-auto max-w-6xl px-gutter py-12">
      <PageHeader
        title="Design kit"
        lead="Every ScholarKey primitive in every state. Chromatic Interference: truth resolves when you look closely."
      />

      <Section title="Colour">
        <div className="flex flex-wrap gap-6">
          {TOKENS.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div className={`size-24 border-2 border-ink ${token.className}`} />
              <span className="text-small">{token.name}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[65ch] text-body text-ink-muted">
          Line inks are for fields and flooded bands only. Yellow is never text.
        </p>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-10">
          <div>
            <p className="text-small text-ink-muted">text-display</p>
            <p className="font-display font-stretch-expanded text-display">Look closer.</p>
          </div>
          <div>
            <p className="text-small text-ink-muted">text-headline</p>
            <p className="font-display font-stretch-expanded text-headline">Verify in seconds.</p>
          </div>
          <div>
            <p className="text-small text-ink-muted">text-title</p>
            <p className="font-display font-stretch-expanded text-title font-extrabold">
              Five checks, in order.
            </p>
          </div>
          <div>
            <p className="text-small text-ink-muted">text-body</p>
            <p className="max-w-[65ch] text-body">
              ScholarKey reads the signed token in your browser and checks each link against the
              university&apos;s own domain. Nothing you drop here is uploaded anywhere.
            </p>
          </div>
          <div>
            <p className="text-small text-ink-muted">text-small</p>
            <p className="text-small">Captions, receipts and footnotes.</p>
          </div>
          <div>
            <p className="text-small text-ink-muted">code</p>
            <p>
              <code>sha256:3f9a1c7e0b2d4a68</code>
            </p>
          </div>
        </div>
      </Section>

      <Section title="LineField">
        <LineFieldDemo />
      </Section>

      <Section title="CheckList">
        <CheckListDemo />
      </Section>

      <Section title="Verdict">
        <VerdictDemo />
      </Section>

      <Section title="DropZone">
        <DropZoneDemo />
      </Section>

      <Section title="Receipt">
        <div className="flex flex-col gap-12">
          <Receipt
            title="What left your browser"
            rows={[
              { label: 'DID', value: 'did:web:waraira-university.onrender.com', mono: true },
              { label: 'Key id', value: '…#key-1', mono: true },
              { label: 'Credential ID', value: CREDENTIAL_ID, mono: true },
              { label: 'Document', value: 'Never sent', muted: true },
            ]}
            footnote="Only public identifiers left your browser: the DID, its key and the credential ID printed in the token."
          />
          <Receipt
            title="What we stored"
            rows={[
              { label: 'Credential ID', value: CREDENTIAL_ID, mono: true },
              { label: 'Institution', value: 'Universidad Waraira (demo institution)' },
              { label: 'Transaction hash', value: '0x9c41…7e2a (sample)', mono: true },
              { label: 'Time', value: '2026-10-24 14:32 UTC' },
            ]}
            footnote="No name, no grades, no document."
          />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="quiet">Quiet</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button disabled>Primary</Button>
            <Button variant="secondary" disabled>
              Secondary
            </Button>
            <Button variant="quiet" disabled>
              Quiet
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <LinkButton href="#buttons">Primary link</LinkButton>
            <LinkButton href="#buttons" variant="secondary">
              Secondary link
            </LinkButton>
          </div>
        </div>
      </Section>

      <Section title="Field">
        <div className="grid gap-8 md:grid-cols-2">
          <Field label="Graduate name">
            <input type="text" name="graduate" placeholder="María Fernanda Rojas (synthetic)" />
          </Field>
          <Field label="Graduate name, with hint" hint="As printed on the diploma.">
            <input
              type="text"
              name="graduate-hint"
              placeholder="María Fernanda Rojas (synthetic)"
            />
          </Field>
          <Field label="Student ID" error="No credential matches this ID.">
            <input type="text" name="student-id" defaultValue="V-00000000" />
          </Field>
          <Field label="Degree">
            <select name="degree" defaultValue="bsc">
              <option value="bsc">Bachelor of Science</option>
              <option value="ma">Master of Arts</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Panel, Disclosure and Mono">
        <div className="flex flex-col gap-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Default panel">
              <p className="text-body">A bordered white panel for a single block of content.</p>
            </Panel>
            <Panel title="Quiet panel" tone="quiet">
              <p className="text-body">The same block with no fill, for secondary content.</p>
            </Panel>
          </div>
          <Disclosure summary="Technical details">
            <p className="max-w-[65ch]">
              The verifier hashes the file in memory, reads the signed token and resolves the
              issuer&apos;s did:web document over HTTPS. Nothing is written to disk.
            </p>
          </Disclosure>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-small text-ink-muted">plain</span>
              <Mono value={CREDENTIAL_ID} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-small text-ink-muted">shorten</span>
              <Mono value={CREDENTIAL_ID} shorten />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-small text-ink-muted">shorten + copy</span>
              <Mono value={CREDENTIAL_ID} shorten copy />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
