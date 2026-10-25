'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { importStoredSigner } from '@/lib/credential/keystore';
import type { P256PrivateJwk } from '@/lib/credential/types';

interface NamedKey {
  name: string;
  jwk: P256PrivateJwk;
}
interface IdentityPack {
  members: NamedKey[];
  employers: NamedKey[];
}

async function importPack(pack: IdentityPack): Promise<number> {
  const entries = [
    ...pack.members.map(({ name, jwk }) => ({ key: `member:${name}`, jwk })),
    ...pack.employers.map(({ name, jwk }) => ({ key: `employer:${name}`, jwk })),
  ];
  for (const { key, jwk } of entries) await importStoredSigner(key, jwk);
  return entries.length;
}

export function IdentityImport() {
  const [message, setMessage] = useState<string | null>(null);

  async function run(load: () => Promise<IdentityPack>) {
    setMessage(null);
    try {
      setMessage(`Imported ${await importPack(await load())} identities.`);
    } catch {
      setMessage('Could not import. Check the source and try again.');
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Button
        onClick={() => {
          void run(async () => {
            const response = await fetch('/api/dev/ledger/identities');
            if (!response.ok) throw new Error('identities unavailable');
            return (await response.json()) as IdentityPack;
          });
        }}
      >
        Import from this server
      </Button>
      <label className="flex flex-col gap-2 text-body">
        Or upload demo-pack/identities.json
        <input
          type="file"
          accept=".json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void run(async () => JSON.parse(await file.text()) as IdentityPack);
          }}
        />
      </label>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
