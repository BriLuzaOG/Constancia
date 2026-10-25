'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/employer/session-client';
import { useMe } from '@/lib/employer/use-me';

const LINKS = [
  { href: '/employer/requests', label: 'Requests' },
  { href: '/employer/issued', label: 'Issued' },
  { href: '/employer/directory', label: 'Directory' },
];

export function EmployerNav() {
  const view = useMe();
  return (
    <nav aria-label="Employer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {view.status === 'in' &&
        LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="font-bold hover:underline">
            {link.label}
          </Link>
        ))}
      {view.status === 'in' && (
        <>
          <span className="text-small text-ink-muted">{view.me.name || 'Your organization'}</span>
          <Button
            variant="quiet"
            className="min-h-12"
            onClick={() => {
              void signOut();
            }}
          >
            Sign out
          </Button>
        </>
      )}
    </nav>
  );
}
