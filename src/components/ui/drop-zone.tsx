'use client';

import { useEffect } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

const hasFiles = (event: globalThis.DragEvent) => event.dataTransfer?.types.includes('Files');

// Meant to sit inside a LineField: the white gap cut into the band (see /dev/kit).
export function DropZone({
  onFile,
  label,
  hint,
  disabled = false,
}: {
  onFile: (file: File) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  // A file dragged anywhere over the page sets html[data-dragging]; globals.css locks every
  // line field into alignment and inverts the drop slot. Drops outside the slot are swallowed
  // so the browser never navigates away to the PDF.
  useEffect(() => {
    const root = document.documentElement;
    let depth = 0;
    // a disabled zone still swallows drops (a run in progress must not lose its result to a navigation)
    const enter = (event: globalThis.DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      depth += 1;
      root.dataset.dragging = 'true';
    };
    const leave = (event: globalThis.DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) delete root.dataset.dragging;
    };
    const over = (event: globalThis.DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const drop = (event: globalThis.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      delete root.dataset.dragging;
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
      delete root.dataset.dragging;
    };
  }, [disabled]);

  // shortcut: first file only, upgrade if batch verification is ever needed
  function pick(files: FileList | null | undefined) {
    const file = files?.[0];
    if (!disabled && file && isPdf(file)) onFile(file);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    pick(event.currentTarget.files);
    event.currentTarget.value = '';
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    if (disabled) return;
    event.preventDefault();
    pick(event.dataTransfer.files);
  }

  return (
    <label
      onDragOver={(event) => {
        if (!disabled) event.preventDefault();
      }}
      onDrop={handleDrop}
      data-disabled={disabled || undefined}
      className="dropzone flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-3 border-4 border-ink bg-white p-8 text-center transition-colors duration-150 has-focus-visible:outline-3 has-focus-visible:-outline-offset-8 has-focus-visible:outline-focus data-disabled:cursor-not-allowed data-disabled:opacity-40"
    >
      <span className="font-display text-headline font-extrabold font-stretch-expanded text-balance">
        {label}
      </span>
      {hint ? <span className="max-w-[40ch] text-body">{hint}</span> : null}
      <input
        type="file"
        accept="application/pdf,.pdf"
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />
    </label>
  );
}
