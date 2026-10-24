import { describe, expect, it } from 'vitest';
import { employmentRecordSchema } from './types';

const valid = {
  givenName: 'María Fernanda',
  familyName: 'Rojas',
  nationalId: 'V-24.567.890',
  jobTitle: 'Logistics Analyst',
  employmentType: 'FULL_TIME',
  startDate: '2020-03-01',
  workCountry: 'VE',
};

describe('employmentRecordSchema', () => {
  it('accepts a valid record', () => {
    expect(employmentRecordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a future startDate', () => {
    expect(employmentRecordSchema.safeParse({ ...valid, startDate: '2999-01-01' }).success).toBe(
      false,
    );
  });

  it('rejects an endDate before startDate', () => {
    expect(employmentRecordSchema.safeParse({ ...valid, endDate: '2019-01-01' }).success).toBe(
      false,
    );
  });

  it('rejects a givenName longer than 80 characters', () => {
    expect(employmentRecordSchema.safeParse({ ...valid, givenName: 'a'.repeat(81) }).success).toBe(
      false,
    );
  });
});
