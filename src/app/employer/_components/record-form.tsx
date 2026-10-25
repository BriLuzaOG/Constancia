'use client';

import { Field } from '@/components/ui/field';
import type { RecordErrors, RecordFields } from '@/lib/employer/record-fields';

type EndDateMode = 'optional' | 'hidden' | 'required';

const EMPLOYMENT_TYPES: { value: RecordFields['employmentType']; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'CONTRACT', label: 'Contract' },
];

/** The employment fields, shared by the directory and the issue form. */
export function RecordForm({
  fields,
  errors,
  onChange,
  endDate = 'optional',
  disabled,
}: {
  fields: RecordFields;
  errors: RecordErrors;
  onChange: (next: RecordFields) => void;
  endDate?: EndDateMode;
  disabled?: boolean;
}) {
  const text = (name: keyof RecordFields, label: string, extra?: { type?: string; hint?: string; autoComplete?: string }) => (
    <Field label={label} error={errors[name]} hint={extra?.hint}>
      <input
        name={name}
        type={extra?.type ?? 'text'}
        autoComplete={extra?.autoComplete ?? 'off'}
        disabled={disabled}
        value={fields[name]}
        aria-invalid={errors[name] ? true : undefined}
        onChange={(event) => {
          onChange({ ...fields, [name]: event.target.value });
        }}
      />
    </Field>
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {text('givenName', 'Given name')}
      {text('familyName', 'Family name')}
      {text('nationalId', 'National ID')}
      {text('jobTitle', 'Job title')}
      {text('department', 'Department (optional)')}
      <Field label="Employment type" error={errors.employmentType}>
        <select
          name="employmentType"
          disabled={disabled}
          value={fields.employmentType}
          onChange={(event) => {
            onChange({ ...fields, employmentType: event.target.value as RecordFields['employmentType'] });
          }}
        >
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>
      {text('startDate', 'Start date', { type: 'date' })}
      {endDate !== 'hidden' &&
        text('endDate', endDate === 'required' ? 'End date' : 'End date (empty if still employed)', { type: 'date' })}
      {text('workCountry', 'Work country', { hint: 'Two letters, for example VE' })}
      {text('salaryMonthlyUsd', 'Monthly salary in USD (optional)', { type: 'number' })}
    </div>
  );
}
