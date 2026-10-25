// The same conformance suite as the memory ledger, against Sepolia through the app's bundler.
// Needs a funded sponsor, the deployed contracts and the app running with the chain env, so it is
// opt-in: CHAIN_CONFORMANCE=1 plus LEDGER_RPC_URL. Each op waits for a ~12 s Sepolia block.
import { readFileSync } from 'node:fs';
import { describe, test } from 'vitest';
import { signerFromPrivateJwk } from '../credential/keys';
import type { P256PrivateJwk } from '../credential/types';
import { createChainAccountClient } from './account-client-chain';
import { createChainReader } from './chain';
import { conformanceCases, type ConformanceWorld } from './conformance';
import { chainSettings } from './public-client';

const enabled = process.env.CHAIN_CONFORMANCE === '1' && Boolean(process.env.LEDGER_RPC_URL);
const TEN_MINUTES_MS = 600_000;

async function chainWorld(): Promise<ConformanceWorld> {
  const { client, config } = chainSettings();
  const reader = createChainReader(client, config);
  const pack = JSON.parse(readFileSync('demo-pack/identities.json', 'utf8')) as {
    members: { jwk: P256PrivateJwk }[];
  };
  const clientFor: ConformanceWorld['clientFor'] = (signer, account) =>
    createChainAccountClient({ signer, account });
  const members = await Promise.all(
    pack.members.map(async (member) => clientFor(await signerFromPrivateJwk(member.jwk))),
  );
  return { reader, clientFor, members, quorum: (await reader.state()).quorum };
}

describe.skipIf(!enabled)('chain conformance (set CHAIN_CONFORMANCE=1 and LEDGER_RPC_URL)', () => {
  for (const { name, run } of conformanceCases) {
    test(name, async () => {
      await run(await chainWorld());
    }, TEN_MINUTES_MS);
  }
});
