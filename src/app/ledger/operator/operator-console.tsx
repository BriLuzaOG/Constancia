'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckList, CheckRow } from '@/components/ui/check-list';
import { Field } from '@/components/ui/field';
import { listSignerNames, loadSigner } from '@/lib/credential/keystore';
import type { Address } from '@/lib/credential/types';
import { createAccountClient, LedgerWriteError } from '@/lib/ledger/account-client';
import type { TxResult } from '@/lib/ledger/account-client';
import { useNetworkState } from '../_lib/use-network-state';

const MEMBER_PREFIX = 'member:';

type Action = 'approve' | 'suspend';

export function OperatorConsole() {
  const view = useNetworkState();
  const [names, setNames] = useState<string[]>([]);
  const [member, setMember] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        const all = await listSignerNames();
        const members = all.filter((name) => name.startsWith(MEMBER_PREFIX));
        setNames(members);
        setMember((current) => current || members[0] || '');
      } catch {
        setError('Could not read the signing keys on this device.');
      }
    }
    void loadMembers();
  }, []);

  async function run(action: Action, issuer: Address) {
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const signer = await loadSigner(member);
      if (!signer) throw new Error('missing signer');
      const client = await createAccountClient({ signer });
      setResult(await client[action](issuer));
    } catch (caught) {
      setError(
        caught instanceof LedgerWriteError
          ? caught.message
          : 'The ledger did not accept that. Check the member and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  const issuers = view.status === 'ready' ? view.state.issuers : [];
  const pending = issuers.filter((issuer) => issuer.status === 'PENDING');
  const active = issuers.filter((issuer) => issuer.status === 'ACTIVE');

  return (
    <div className="mt-12 flex flex-col gap-12">
      {names.length === 0 ? (
        <p className="text-body">
          No member keys on this device. Import them from <code>/dev/identity</code>.
        </p>
      ) : (
        <Field label="Member">
          <select
            name="member"
            value={member}
            onChange={(event) => {
              setMember(event.target.value);
            }}
          >
            {names.map((name) => (
              <option key={name} value={name}>
                {name.slice(MEMBER_PREFIX.length)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <section>
        <h2 className="mb-4 font-display text-title font-extrabold font-stretch-expanded">
          Waiting for approval
        </h2>
        {pending.length === 0 ? (
          <p className="text-body text-ink-muted">No employer is waiting.</p>
        ) : (
          <ul className="border-b-2 border-ink">
            {pending.map((issuer) => (
              <li
                key={issuer.account}
                className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink py-3"
              >
                <span className="font-bold">{issuer.name}</span>
                <span className="tnum text-small">
                  {issuer.approvals}/{issuer.quorum} approvals
                </span>
                <Button
                  disabled={busy || !member}
                  onClick={() => {
                    void run('approve', issuer.account);
                  }}
                >
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-title font-extrabold font-stretch-expanded">
          Accredited employers
        </h2>
        {active.length === 0 ? (
          <p className="text-body text-ink-muted">No active employer.</p>
        ) : (
          <ul className="border-b-2 border-ink">
            {active.map((issuer) => (
              <li
                key={issuer.account}
                className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink py-3"
              >
                <span className="font-bold">{issuer.name}</span>
                <Button
                  variant="secondary"
                  disabled={busy || !member}
                  onClick={() => {
                    void run('suspend', issuer.account);
                  }}
                >
                  Suspend
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {busy ? (
        <p role="status" className="text-body">
          Writing to the ledger. A block takes about 12 seconds…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="border-2 border-red-text p-4 font-bold text-red-text">
          {error}
        </p>
      ) : null}

      {result ? (
        <CheckList title="Result">
          <CheckRow index={1} label="Signed" status="DONE" />
          <CheckRow
            index={2}
            label="Written to the ledger"
            status="DONE"
            measured={`block ${result.blockNumber}`}
          />
          <CheckRow index={3} label="Fee" status="DONE" measured="0" />
        </CheckList>
      ) : null}
    </div>
  );
}
