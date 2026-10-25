// Browser only. Keeps what was shared and until when, never the link or its key.
// shortcut: localStorage, per device and unencrypted; move into the vault store if it needs to sync.
const KEY = 'constancia-share-history';
const MAX_ENTRIES = 50;

export interface ShareRecord {
  label: string;
  expiresAt: string;
  claims: string[];
  certificateId: string;
}

export function readShareHistory(): ShareRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as ShareRecord[]) : [];
  } catch {
    return [];
  }
}

export function recordShare(record: ShareRecord): void {
  localStorage.setItem(KEY, JSON.stringify([record, ...readShareHistory()].slice(0, MAX_ENTRIES)));
}
