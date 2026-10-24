import type { ReactNode } from 'react';

export function Panel({
  title,
  children,
  tone = 'default',
}: {
  title?: string;
  children: ReactNode;
  tone?: 'default' | 'quiet';
}) {
  return (
    <section data-tone={tone}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
