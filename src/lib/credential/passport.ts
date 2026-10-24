import type { Es256Signer } from './keys';
import type { CheckEvent, CheckCode, Verdict, VerifyContext } from './verify';
import type { ClaimName } from './types';

export async function buildVerifiedCv(_args: {
  items: { credential: string; holder: Es256Signer; reveal: ClaimName[] }[];
  aud: string;
  ttlSec: number;
  now?: Date;
}): Promise<string> {
  // the JSON in contracts §4.4
  throw new Error('not implemented: A2-S5');
}

export type CvEvent = CheckEvent & { entry: number }; // 0-based entry
export type CvVerdict =
  | {
      kind: 'AUTHENTIC';
      entries: Extract<Verdict, { kind: 'AUTHENTIC' }>[];
      timeline: CareerTimeline;
    }
  | { kind: 'NOT_AUTHENTIC'; failedEntry: number | null; failedAt: CheckCode; reason: string }
  | { kind: 'UNAVAILABLE'; reason: string };

export function verifyVerifiedCv(
  _input: string,
  _ctx: VerifyContext,
): AsyncGenerator<CvEvent, CvVerdict> {
  throw new Error('not implemented: A2-S5');
}

export interface TimelineInput {
  id: string;
  employer: string;
  jobTitle?: string;
  startDate?: string;
  endDate?: string;
  employedNow?: boolean;
}
export interface CareerTimeline {
  // data; the UI component is `Timeline` in components/ui
  items: (TimelineInput & { datesHidden: boolean })[]; // sorted by startDate, dates-hidden entries last
  gaps: { from: string; to: string; months: number }[]; // > 1 month
  overlaps: { a: string; b: string }[]; // ids
}

export function buildTimeline(_entries: TimelineInput[]): CareerTimeline {
  throw new Error('not implemented: A2-S5');
}
