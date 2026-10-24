'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DropZone } from '@/components/ui/drop-zone';
import { LinkButton } from '@/components/ui/button';
import { LineField } from '@/components/ui/line-field';
import { setHandoffFile } from '@/lib/handoff';

// el tiempo que la banda necesita para alinearse antes de navegar (coincide con la transición de 600ms)
const LOCK_MS = 700;

export function CheckBand() {
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  function handleFile(file: File) {
    setHandoffFile(file);
    setLocked(true);
    timer.current = setTimeout(() => {
      router.push('/verify');
    }, LOCK_MS);
  }

  return (
    <LineField
      interactive
      state={locked ? 'scanning' : 'rest'}
      progress={locked ? 5 : undefined}
      className="mt-12 flex-1 border-y-4 border-ink"
    >
      <div className="grid min-h-96 items-end gap-8 px-gutter py-12 md:grid-cols-2 md:items-center">
        <div className="flex flex-col items-start gap-4 bg-paper p-6 md:self-end">
          <div className="flex flex-wrap gap-4">
            <LinkButton href="/verify">Check a certificate</LinkButton>
            <LinkButton href="/vault" variant="secondary">
              Open your vault
            </LinkButton>
          </div>
          <Link href="/employer" className="text-small font-bold">
            I&apos;m an employer
          </Link>
        </div>
        <DropZone
          onFile={handleFile}
          label="Drop a certificate to check it"
          hint="The file stays in your browser."
          disabled={locked}
        />
      </div>
    </LineField>
  );
}
