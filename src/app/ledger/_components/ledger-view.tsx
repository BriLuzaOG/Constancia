'use client';

import { useEffect, useState } from 'react';
import { Disclosure } from '@/components/ui/disclosure';
import { Mono } from '@/components/ui/mono';
import { Panel } from '@/components/ui/panel';
import type { IssuerInfo, NetworkState } from '@/lib/ledger/types';
import { ageLabel, inkOf, nameOf } from '../_lib/format';
import { useNetworkState } from '../_lib/use-network-state';
import { BlockStrip } from './block-strip';

function useNow(): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return now;
}

function statusLabel(issuer: IssuerInfo): string {
  if (issuer.status === 'PENDING') return `PENDING ${issuer.approvals}/${issuer.quorum}`;
  return issuer.status;
}

function Members({ state }: { state: NetworkState }) {
  return (
    <Panel title="Members">
      <p className="mb-4 text-body">
        {state.quorum} of {state.members.length} must approve an employer.
      </p>
      <ul className="border-b-2 border-ink">
        {state.members.map((member) => {
          const ink = inkOf(state, member.account);
          return (
            <li key={member.account} className="flex items-center gap-4 border-t-2 border-ink py-3">
              <span
                aria-hidden="true"
                className={`flex size-9 items-center justify-center border-2 border-ink font-bold ${ink?.bg ?? 'bg-white'}`}
              >
                {ink?.letter}
              </span>
              <span className="font-bold">{member.name}</span>
              <Mono value={member.account} shorten />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function Employers({ state }: { state: NetworkState }) {
  return (
    <Panel title="Accredited employers">
      {state.issuers.length === 0 ? (
        <p className="text-body text-ink-muted">No employer has applied yet.</p>
      ) : (
        <ul className="border-b-2 border-ink">
          {state.issuers.map((issuer) => (
            <li
              key={issuer.account}
              className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink py-3"
            >
              <span className="font-bold">{issuer.name}</span>
              <Mono value={issuer.account} shorten />
              <span className="text-small font-bold tracking-wide uppercase">
                {statusLabel(issuer)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Anchors({ state, now }: { state: NetworkState; now: number }) {
  return (
    <Panel title="Recent anchors">
      {state.anchors.length === 0 ? (
        <p className="text-body text-ink-muted">Nothing written yet.</p>
      ) : (
        <ul className="border-b-2 border-ink">
          {state.anchors.map((anchor) => (
            <li
              key={anchor.credentialHash}
              className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink py-3"
            >
              <span className="tnum text-small">Block {anchor.blockNumber}</span>
              <span className="text-small text-ink-muted">{ageLabel(anchor.time, now)}</span>
              <span className="text-small font-bold">{nameOf(state, anchor.issuer)}</span>
              <Mono value={anchor.credentialHash} shorten />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-small text-ink-muted">Hashes only. No names, no claims.</p>
    </Panel>
  );
}

export function LedgerView() {
  const view = useNetworkState();
  const now = useNow();

  if (view.status === 'loading') {
    return (
      <p role="status" className="mt-12 text-title">
        Reading the ledger…
      </p>
    );
  }
  if (view.status === 'unreachable') {
    return (
      <div role="alert" className="mt-12 border-4 border-ink bg-line-yellow p-6">
        <p className="text-title font-bold">The ledger isn&apos;t answering right now.</p>
        <p className="mt-2 text-body">
          Your certificates are not affected. This page tries again every few seconds.
        </p>
      </div>
    );
  }

  const { state } = view;
  return (
    <div className="mt-12 flex flex-col gap-12">
      <div>
        <p className="text-title">
          <span className="tnum font-bold">Block {state.head.number}</span>
          <span className="text-ink-muted"> · {ageLabel(state.head.time, now)}</span>
        </p>
        <p className="mt-1 text-body text-ink-muted">
          Public Sepolia · {state.blockTimeSec} s blocks · fees: none
        </p>
      </div>
      <BlockStrip state={state} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Members state={state} />
        <Employers state={state} />
      </div>
      <Anchors state={state} now={now} />
      <section>
        <h2 className="mb-4 font-display text-title font-extrabold font-stretch-expanded">
          How this ledger is run
        </h2>
        <p className="max-w-[65ch] text-body">
          A group of members, not one company, decides which employers are accredited. The record
          lives on the public Sepolia test network, and one consortium wallet pays every fee, so
          nobody who uses Constancia ever sees a wallet or a cost. This page reads from a single
          gateway.
        </p>
      </section>
      <Disclosure summary="Technical details">
        <p className="tnum">Chain ID {state.chainId}</p>
      </Disclosure>
    </div>
  );
}
