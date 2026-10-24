'use client';

import type { DragEvent, ChangeEvent } from 'react';

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

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
  // shortcut: first file only and no whole-page drag awareness, A1-S1 adds both
  function pick(files: FileList | null | undefined) {
    const file = files?.[0];
    if (!disabled && file && isPdf(file)) onFile(file);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    pick(event.currentTarget.files);
    event.currentTarget.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    if (!disabled) event.preventDefault();
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    if (disabled) return;
    event.preventDefault();
    pick(event.dataTransfer.files);
  }

  return (
    <label onDragOver={handleDragOver} onDrop={handleDrop} data-disabled={disabled || undefined}>
      <span>{label}</span>
      {hint ? <span>{hint}</span> : null}
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
