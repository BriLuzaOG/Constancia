import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your vault · Constancia' };

// The thin strip is the line-field ink, used as this world's only accent.
const INK_STRIP =
  'h-1.5 bg-[linear-gradient(90deg,var(--color-line-blue)_0_25%,var(--color-line-red)_25%_50%,var(--color-line-yellow)_50%_75%,var(--color-line-green)_75%_100%)]';

export default function VaultLayout({ children }: LayoutProps<'/vault'>) {
  return (
    <>
      <div aria-hidden="true" className={INK_STRIP} />
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-gutter py-4">
        <Link href="/vault" className="font-display text-title font-extrabold font-stretch-expanded">
          Constancia
        </Link>
        <nav aria-label="Holder" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/vault" className="font-bold hover:underline">
            Vault
          </Link>
          <Link href="/vault/request" className="font-bold hover:underline">
            Ask for a certificate
          </Link>
          <Link href="/cv" className="font-bold hover:underline">
            Verified CV
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-gutter pb-16 pt-6">{children}</main>
    </>
  );
}
