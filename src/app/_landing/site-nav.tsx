import Link from 'next/link';

const LINKS = [
  { href: '/verify', label: 'Verify' },
  { href: '/employer', label: 'Employers' },
  { href: '/vault', label: 'Vault' },
  { href: '/ledger', label: 'Ledger' },
];

export function SiteNav() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b-2 border-ink px-gutter py-4">
      <Link href="/" className="font-display text-title font-extrabold font-stretch-expanded no-underline">
        Constancia
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="font-bold">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
