// Small JOSE helpers shared by issuance, presentation and verification.
import { base64url } from 'jose';
import { sha256 } from '@noble/hashes/sha2.js';
import type { Es256Signer } from './keys';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const toB64u = (data: Uint8Array | string): string =>
  base64url.encode(typeof data === 'string' ? encoder.encode(data) : data);
export const fromB64u = (text: string): Uint8Array => base64url.decode(text);
export const utf8 = (text: string): Uint8Array => encoder.encode(text);

/** base64url(sha256(ASCII text)): disclosure digests and sd_hash. */
export const sha256B64u = (text: string): string => toB64u(sha256(utf8(text)));

export const parseJsonSegment = (segment: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(decoder.decode(fromB64u(segment)));
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('segment is not a JSON object');
  }
  return value as Record<string, unknown>;
};

export async function signJws(
  header: object,
  payload: object,
  signer: Es256Signer,
): Promise<string> {
  const signingInput = `${toB64u(JSON.stringify(header))}.${toB64u(JSON.stringify(payload))}`;
  const signature = await signer.sign(utf8(signingInput));
  return `${signingInput}.${toB64u(signature)}`;
}

/** Returns the three compact JWS parts, or null when the shape is wrong. */
export function splitJws(jws: string): [string, string, string] | null {
  const parts = jws.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0)
    ? (parts as [string, string, string])
    : null;
}
