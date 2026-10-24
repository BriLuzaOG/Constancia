'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';

export type LineFieldState =
  | 'rest'
  | 'scanning'
  | 'resolved-ok'
  | 'resolved-fail'
  | 'resolved-unavailable';

const LAYERS = [0, 1, 2, 3];
const CHECKS = 5;
const PARALLAX_STEPS = 4;

/**
 * The signature material: layered vertical line fields (all motion lives in globals.css).
 * rest: pointer parallax when `interactive`. scanning: layers drift; with `progress` (0-5)
 * they instead converge one check at a time. resolved-*: a solid flood wipes edge to edge.
 * Set `--flood-origin` (e.g. `[--flood-origin:30%_50%]`) to start the flood from a point.
 */
export function LineField({
  state = 'rest',
  progress,
  interactive = false,
  className = '',
  children,
}: {
  state?: LineFieldState;
  progress?: number /* 0–5 */;
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // pause the drift when the band is off-screen
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  function setParallax(step: number) {
    ref.current?.style.setProperty('--px', String(step));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const unit = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    // whole steps keep every line on a whole pixel (no shimmer on a projector)
    setParallax(Math.round(unit * PARALLAX_STEPS));
  }

  const parallax = interactive && state === 'rest';
  const lock =
    state === 'scanning' && progress !== undefined
      ? Math.min(Math.max(progress, 0), CHECKS) / CHECKS
      : undefined;

  return (
    <div
      ref={ref}
      className={`line-field ${className}`}
      data-state={state}
      data-progress={progress ?? 'none'}
      data-visible={visible}
      style={lock === undefined ? undefined : ({ '--lf-lock': lock } as CSSProperties)}
      onPointerMove={parallax ? handlePointerMove : undefined}
      onPointerLeave={
        parallax
          ? () => {
              setParallax(0);
            }
          : undefined
      }
    >
      <div aria-hidden="true">
        {LAYERS.map((layer) => (
          <div key={layer} className="lf-layer" />
        ))}
      </div>
      <div aria-hidden="true" className="lf-flood" />
      <div className="lf-content">{children}</div>
    </div>
  );
}
