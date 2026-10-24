// TEMP: mock until A3-S2 lands (fetchNetworkState throws "not implemented"). Delete with load-state's fallback.
import type { NetworkState } from '@/lib/ledger/types';

const addr = (n: number) => `0x${n.toString(16).padStart(40, '0')}` as `0x${string}`;
const hash = (n: number) => `0x${n.toString(16).padStart(64, 'a')}` as `0x${string}`;

const VALIDATORS = [1, 2, 3, 4].map((n) => addr(n));
const NAMES = ['Banco Demo', 'Cámara Demo', 'Universidad Demo', 'Colegio Demo'];

export function fixtureState(): NetworkState {
  const now = Math.floor(Date.now() / 1000);
  const headNumber = 120 + (Math.floor(now / 2) % 1000);
  return {
    chainId: 24024,
    head: { number: headNumber, time: now },
    blockTimeSec: 2,
    quorum: 2,
    members: VALIDATORS.map((account, i) => ({ account, name: NAMES[i] })),
    validators: VALIDATORS.map((address, i) => ({ address, name: NAMES[i] })),
    issuers: [
      {
        account: addr(0xa1),
        name: 'Empresa Demo A',
        status: 'ACTIVE',
        approvals: 2,
        quorum: 2,
        accreditedAt: now - 3600,
      },
      {
        account: addr(0xa2),
        name: 'Empresa Demo B',
        status: 'PENDING',
        approvals: 1,
        quorum: 2,
        accreditedAt: null,
      },
      {
        account: addr(0xa3),
        name: 'Empresa Demo C',
        status: 'SUSPENDED',
        approvals: 2,
        quorum: 2,
        accreditedAt: now - 7200,
      },
    ],
    blocks: Array.from({ length: 16 }, (_, i) => ({
      number: headNumber - 15 + i,
      time: now - (15 - i) * 2,
      proposer: VALIDATORS[(headNumber - 15 + i) % 4],
      txCount: i % 5 === 0 ? 1 : 0,
    })),
    anchors: [0, 1, 2].map((i) => ({
      credentialHash: hash(0x3f9a + i),
      issuer: addr(0xa1),
      blockNumber: headNumber - 10 * i,
      time: now - 90 * i,
    })),
  };
}
