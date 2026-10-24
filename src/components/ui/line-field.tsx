import type { ReactNode } from 'react';

export type LineFieldState =
  | 'rest'
  | 'scanning'
  | 'resolved-ok'
  | 'resolved-fail'
  | 'resolved-unavailable';

export function LineField({
  state = 'rest',
  progress = 0,
  className,
  children,
}: {
  state?: LineFieldState;
  progress?: number;
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={className} data-state={state} data-progress={progress}>
      {children}
    </div>
  );
}
