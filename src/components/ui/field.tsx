import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span>{label}</span>
      {children}
      {hint && <p>{hint}</p>}
      {error && <p role="alert">{error}</p>}
    </label>
  );
}
