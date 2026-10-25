import Link from 'next/link';
import type { ReactNode } from 'react';

// The thin strip is the line-field ink, used as this world's only accent.
const INK_STRIP =
  'h-1.5 bg-[linear-gradient(90deg,var(--color-line-blue)_0_25%,var(--color-line-red)_25%_50%,var(--color-line-yellow)_50%_75%,var(--color-line-green)_75%_100%)]';

const LINKS = [
  { href: '/vault', label: 'Vault' },
  { href: '/vault/request', label: 'Ask for a certificate' },
  { href: '/cv', label: 'Verified CV' },
] as const;

/** Shared frame of the holder's pages: /vault/** and /cv. */
export function HolderShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className={INK_STRIP} />
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-gutter py-4">
        <Link href="/vault" className="font-display text-title font-extrabold font-stretch-expanded">
          Constancia
        </Link>
        <nav aria-label="Holder" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="font-bold hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-gutter pb-16 pt-6">{children}</main>
    </>
  );
}
