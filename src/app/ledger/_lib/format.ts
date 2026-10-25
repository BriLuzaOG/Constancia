import type { NetworkState } from '@/lib/ledger/types';

// the four members are the four line inks; the letter keeps it from being colour alone
const INKS = [
  { bg: 'bg-line-red', letter: 'R' },
  { bg: 'bg-line-blue', letter: 'B' },
  { bg: 'bg-line-green', letter: 'G' },
  { bg: 'bg-line-yellow', letter: 'Y' },
] as const;

export function inkOf(state: NetworkState, account: string) {
  const index = state.members.findIndex(
    (member) => member.account.toLowerCase() === account.toLowerCase(),
  );
  return index === -1 ? null : INKS[index % INKS.length];
}

// decorative: blocks have no proposer on Sepolia, so the ink rotates with the block number
export function blockInk(blockNumber: number) {
  return INKS[blockNumber % INKS.length]!;
}

export function nameOf(state: NetworkState, account: string): string {
  return (
    state.members.find((member) => member.account.toLowerCase() === account.toLowerCase())?.name ??
    'Unknown'
  );
}

export { formatAge as ageLabel } from '@/lib/ledger/format';
