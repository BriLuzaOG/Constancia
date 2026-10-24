import type { RowStatus } from '@/components/ui/check-list';
import type { CheckCode } from '@/lib/credential/verify';

export type InputKind = 'presentation' | 'cv';
export type InputOrigin = 'link' | 'file' | 'paste' | 'sample';

export interface LoadedInput {
  text: string;
  kind: InputKind;
  origin: InputOrigin;
  shareId?: string; // set when the text came from a share link: the id is what left the browser, never the key
}

/** The exact request the lookup sent, for the "What left your browser" receipt. */
export interface RecordedRequest {
  url: string;
  method: 'POST';
  body: string;
  bytes: number;
}

export interface RowView {
  code: CheckCode;
  label: string;
  status: RowStatus;
  measured?: string;
  detail?: string;
}

export const CHECK_LABELS: Record<CheckCode, string> = {
  TOKEN: 'Certificate',
  ISSUER: 'Employer accredited',
  SIGNATURE: 'Employer’s signature',
  HOLDER: 'Bound to its holder',
  LEDGER: 'Ledger record',
};

export const MAX_INPUT_BYTES = 256 * 1024;
