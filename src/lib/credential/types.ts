import { z } from 'zod';

export type Hex = `0x${string}`;
export type Address = Hex;
export interface P256Jwk {
  kty: 'EC';
  crv: 'P-256';
  x: string;
  y: string;
}
export type EcdhJwk = P256Jwk;
export interface P256PrivateJwk extends P256Jwk {
  d: string;
}

/** Lives only in the employer's browser, then in the holder's vault. Never sent to a server. */
export interface EmploymentRecord {
  givenName: string; // "María Fernanda"
  familyName: string; // "Rojas"
  nationalId: string; // "V-24.567.890"
  jobTitle: string; // "Logistics Analyst"
  department?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  startDate: string; // ISO date, not in the future
  endDate?: string; // ISO date >= startDate. Absent = currently employed
  workCountry: string; // ISO 3166-1 alpha-2, "VE"
  salaryMonthlyUsd?: number; // integer, 0..1_000_000
}

/** The twelve selectively disclosable claims. camelCase because the VC is JSON-LD shaped. */
export type ClaimName =
  | 'givenName'
  | 'familyName'
  | 'nationalId'
  | 'jobTitle'
  | 'department'
  | 'employmentType'
  | 'startDate'
  | 'endDate'
  | 'employedNow'
  | 'workCountry'
  | 'salaryMonthlyUsd'
  | 'salaryBand';
export type DisclosedClaims = Partial<Record<ClaimName, string | number | boolean>>;

// UTC date: can be a day ahead of Venezuela (UTC-4) but never behind, so no false "future" rejections.
const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const employmentRecordSchema = z
  .object({
    givenName: z.string().min(1).max(80),
    familyName: z.string().min(1).max(80),
    nationalId: z.string().min(3).max(32),
    jobTitle: z.string().min(2).max(100),
    department: z.string().max(80).optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']),
    startDate: z.iso.date(),
    endDate: z.iso.date().optional(),
    workCountry: z.string().regex(/^[A-Z]{2}$/),
    salaryMonthlyUsd: z.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((r) => r.startDate <= todayIso(), {
    error: 'startDate is in the future',
    path: ['startDate'],
  })
  .refine((r) => r.endDate === undefined || r.endDate <= todayIso(), {
    error: 'endDate is in the future',
    path: ['endDate'],
  })
  .refine((r) => r.endDate === undefined || r.endDate >= r.startDate, {
    error: 'endDate is before startDate',
    path: ['endDate'],
  });
