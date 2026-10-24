import { MAX_INPUT_BYTES, type InputKind, type InputOrigin, type LoadedInput } from './types';

export class InputError extends Error {}

const TOO_LARGE = 'This file is too large to be a certificate (limit 256 KB)';
const EMPTY = 'Nothing to check: the text is empty';
const NOT_FOUND = 'This share link does not exist or was removed';
const EXPIRED = 'This share has expired. Ask the holder for a new link';
const UNREACHABLE = 'Could not reach the server. Try again';
const DAMAGED = 'This link is incomplete or damaged';

const SHARE_FRAGMENT = /^s=([0-9a-f]{32})\.([A-Za-z0-9_-]{43})$/;
const CV_TYPE = 'constancia-cv';

export function parseShareFragment(hash: string): { id: string; key: string } | null {
  const match = SHARE_FRAGMENT.exec(hash.replace(/^#/, ''));
  return match ? { id: match[1], key: match[2] } : null;
}

async function fetchCiphertext(id: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`/api/shares/${id}`);
  } catch {
    throw new InputError(UNREACHABLE);
  }
  if (res.status === 404) throw new InputError(NOT_FOUND);
  if (res.status === 410) throw new InputError(EXPIRED);
  if (!res.ok) throw new InputError(UNREACHABLE);

  const body = (await res.json().catch(() => null)) as { ciphertext?: unknown } | null;
  if (typeof body?.ciphertext !== 'string') throw new InputError(DAMAGED);
  return body.ciphertext;
}

export async function fetchShareText(id: string, key: string): Promise<string> {
  const ciphertext = await fetchCiphertext(id);
  const { openShare } = await import('@/lib/credential/share-crypto');
  try {
    return await openShare(ciphertext, key);
  } catch {
    throw new InputError(DAMAGED);
  }
}

export async function readInputFile(file: File): Promise<string> {
  if (file.size > MAX_INPUT_BYTES) throw new InputError(TOO_LARGE);
  return file.text();
}

function isCvObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === CV_TYPE;
}

function kindOf(text: string): InputKind {
  if (!text.startsWith('{')) return 'presentation';
  try {
    return isCvObject(JSON.parse(text)) ? 'cv' : 'presentation';
  } catch {
    return 'presentation';
  }
}

export function inputFromText(text: string, origin: InputOrigin, shareId?: string): LoadedInput {
  const trimmed = text.trim();
  if (trimmed.length === 0) throw new InputError(EMPTY);
  if (new TextEncoder().encode(trimmed).length > MAX_INPUT_BYTES) throw new InputError(TOO_LARGE);
  return {
    text: trimmed,
    kind: kindOf(trimmed),
    origin,
    ...(shareId !== undefined && { shareId }),
  };
}
