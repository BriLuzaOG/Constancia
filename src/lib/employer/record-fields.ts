import { employmentRecordSchema } from '../credential/types';
import type { EmploymentRecord } from '../credential/types';

/** The employment form as plain strings, the way inputs hold them. */
export interface RecordFields {
  givenName: string;
  familyName: string;
  nationalId: string;
  jobTitle: string;
  department: string;
  employmentType: EmploymentRecord['employmentType'];
  startDate: string;
  endDate: string;
  workCountry: string;
  salaryMonthlyUsd: string;
}

export type RecordErrors = Partial<Record<keyof RecordFields, string>>;

export const emptyFields = (): RecordFields => ({
  givenName: '',
  familyName: '',
  nationalId: '',
  jobTitle: '',
  department: '',
  employmentType: 'FULL_TIME',
  startDate: '',
  endDate: '',
  workCountry: 'VE',
  salaryMonthlyUsd: '',
});

export const fieldsFromRecord = (record: EmploymentRecord): RecordFields => ({
  ...record,
  department: record.department ?? '',
  endDate: record.endDate ?? '',
  salaryMonthlyUsd: record.salaryMonthlyUsd?.toString() ?? '',
});

const blankToUndefined = (value: string) => (value.trim() === '' ? undefined : value.trim());

export type ParsedRecord = { ok: true; record: EmploymentRecord } | { ok: false; errors: RecordErrors };

export function recordFromFields(fields: RecordFields): ParsedRecord {
  const salary = blankToUndefined(fields.salaryMonthlyUsd);
  const parsed = employmentRecordSchema.safeParse({
    ...fields,
    givenName: fields.givenName.trim(),
    familyName: fields.familyName.trim(),
    nationalId: fields.nationalId.trim(),
    jobTitle: fields.jobTitle.trim(),
    department: blankToUndefined(fields.department),
    endDate: blankToUndefined(fields.endDate),
    workCountry: fields.workCountry.trim().toUpperCase(),
    salaryMonthlyUsd: salary === undefined ? undefined : Number(salary),
  });
  if (parsed.success) return { ok: true, record: parsed.data };
  const errors: RecordErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof RecordFields;
    errors[key] ??= 'Check this value';
    if (key === 'startDate' || key === 'endDate') errors[key] = issue.message;
  }
  return { ok: false, errors };
}
