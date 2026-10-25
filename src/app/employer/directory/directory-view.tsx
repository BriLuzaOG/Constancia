'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import {
  employeeRefSchema,
  listDirectory,
  loadDemoDirectory,
  removeEntry,
  saveEntry,
  type DirectoryEntry,
} from '@/lib/employer/directory';
import {
  emptyFields,
  recordFromFields,
  type RecordErrors,
  type RecordFields,
} from '@/lib/employer/record-fields';
import { RecordForm } from '../_components/record-form';

function AddEmployee({ onSaved }: { onSaved: () => void }) {
  const [employeeRef, setEmployeeRef] = useState('');
  const [refError, setRefError] = useState<string | undefined>();
  const [fields, setFields] = useState<RecordFields>(emptyFields);
  const [errors, setErrors] = useState<RecordErrors>({});

  async function save() {
    const ref = employeeRefSchema.safeParse(employeeRef);
    const record = recordFromFields(fields);
    setRefError(ref.success ? undefined : 'Use 1 to 40 characters');
    setErrors(record.ok ? {} : record.errors);
    if (!ref.success || !record.ok) return;
    await saveEntry({ employeeRef: ref.data, record: record.record });
    setEmployeeRef('');
    setFields(emptyFields());
    onSaved();
  }

  return (
    <Panel title="Add an employee">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="max-w-sm">
          <Field label="Employee number" hint="The number the employee types when they ask" error={refError}>
            <input
              name="employeeRef"
              autoComplete="off"
              value={employeeRef}
              onChange={(event) => {
                setEmployeeRef(event.target.value);
              }}
            />
          </Field>
        </div>
        <RecordForm fields={fields} errors={errors} onChange={setFields} />
        <div>
          <Button type="submit">Add to directory</Button>
        </div>
      </form>
    </Panel>
  );
}

export function DirectoryView() {
  const [entries, setEntries] = useState<DirectoryEntry[] | null>(null);

  async function refresh() {
    setEntries(await listDirectory().catch(() => []));
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-[65ch] text-small font-bold">This list never leaves this browser.</p>
      {entries === null ? (
        <p role="status">Opening the directory…</p>
      ) : entries.length === 0 ? (
        <Panel title="No employees yet">
          <p className="mb-6 max-w-[65ch] text-body text-ink-muted">
            Load four fictional employees to try the flow, or add your own below.
          </p>
          <Button
            onClick={() => {
              void loadDemoDirectory().then(refresh);
            }}
          >
            Load demo directory
          </Button>
        </Panel>
      ) : (
        <ul className="border-b-2 border-ink">
          {entries.map(({ employeeRef, record }) => (
            <li
              key={employeeRef}
              className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink py-4"
            >
              <div>
                <p className="text-title font-bold">
                  {record.givenName} {record.familyName}
                </p>
                <p className="text-body text-ink-muted">
                  <code>{employeeRef}</code> · {record.jobTitle} ·{' '}
                  {record.endDate ? `until ${record.endDate}` : 'current'}
                </p>
              </div>
              <Button
                variant="quiet"
                onClick={() => {
                  void removeEntry(employeeRef).then(refresh);
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <AddEmployee onSaved={() => void refresh()} />
    </div>
  );
}
