// Isomorphic display helpers for ledger data (hashes, blocks, ages).

/** `0x1f9a2b…c3d4e5f6`: the same middle ellipsis as the Mono component. */
export function shortHash(value: string): string {
  return value.length <= 24 ? value : `${value.slice(0, 10)}…${value.slice(-8)}`;
}

/** `Block 7,000,123` with a fixed locale so server and browser render the same text. */
export function formatBlock(blockNumber: number): string {
  return `Block ${blockNumber.toLocaleString('en-US')}`;
}

/** `12 s ago`, `3 min ago`, `5 h ago`, `2 d ago`; a timestamp in the future reads as `0 s ago`. */
export function formatAge(unixSeconds: number, nowMs: number): string {
  const seconds = Math.max(0, Math.round(nowMs / 1000 - unixSeconds));
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}
