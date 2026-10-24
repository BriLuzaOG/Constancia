'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from './button';

export function QrBlock({
  value,
  label,
  copy = false,
}: {
  value: string;
  label: string;
  copy?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function render() {
      try {
        const url = await QRCode.toDataURL(value, { margin: 1 });
        if (active) setSrc(url);
      } catch {
        if (active) setSrc(null);
      }
    }
    void render();
    return () => {
      active = false;
    };
  }, [value]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => {
      setCopied(false);
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [copied]);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false); // clipboard blocked: the button keeps its label
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="border-4 border-ink bg-white p-2">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL from a local QR render
          <img src={src} alt={label} className="size-48" />
        ) : (
          <div className="size-48" aria-hidden="true" />
        )}
      </div>
      <p className="text-small">{label}</p>
      {copy ? (
        <Button
          variant="secondary"
          onClick={() => {
            void copyValue();
          }}
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      ) : null}
    </div>
  );
}
