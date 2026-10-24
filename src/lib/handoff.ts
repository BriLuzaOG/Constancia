// In-memory on purpose: a File cannot survive a reload, and nothing may be persisted.
let file: File | null = null;

export function setHandoffFile(next: File): void {
  file = next;
}

export function takeHandoffFile(): File | null {
  const current = file;
  file = null;
  return current;
}
