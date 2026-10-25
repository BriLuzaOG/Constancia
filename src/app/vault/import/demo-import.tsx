'use client';

import { useState } from 'react';
import { DropZone } from '@/components/ui/drop-zone';
import { LinkButton } from '@/components/ui/button';
import { importDemoPack } from '@/lib/vault/demo-import';

export function DemoImport() {
  const [message, setMessage] = useState<string | null>(null);

  async function onFile(file: File) {
    try {
      const count = await importDemoPack(await file.text());
      setMessage(`Imported ${count} certificate${count === 1 ? '' : 's'}.`);
    } catch {
      setMessage('That file is not a demo pack.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <DropZone label="Drop vault.json here" accept=".json" onFile={(file) => void onFile(file)} />
      {message && <p role="status" className="font-bold">{message}</p>}
      <div>
        <LinkButton href="/vault">Open the vault</LinkButton>
      </div>
    </div>
  );
}
