# Agent 3 · The consortium ledger: network, contracts, account abstraction, bundler, reads, client

**Mission:** make the blockchain real and invisible. A four-validator consortium network with zero
gas; smart accounts that HR and consortium members control with a device key; a contract that records
who is an accredited employer and which certificates exist; and the server and client code every other
agent calls. You own every line that touches the chain.

**You own:** `docker/ledger/`, `contracts/`, `scripts/chain/`, `scripts/check-demo.ts`,
`src/lib/ledger/`, `src/app/api/bundler/`, `src/app/api/ledger/`, `src/app/api/did/`,
`src/app/api/dev/`, `src/app/dev/identity/`, `public/demo/`.

**You are on the critical path.** Everyone else builds against your **memory ledger** (S2) until the
real one is swapped in at M3. If the account abstraction spike (S3) cannot pass by the go/no-go at
T+4:45, tell the whole team at once and take the fallback.

Every step: follow the rules in [README.md](README.md).

---

## A3-S1 · Consortium network [M] · T+0:00 · ~90 min · works only in `docker/ledger/` and `scripts/chain/`

```
You are Agent 3 on Constancia. Stand up the consortium: four validators, zero gas.

Read: PRODUCT.md, docs/plan/contracts.md §6 and §7 (introductions). Hyperledger Besu docs: "Create a
private network using QBFT", "Free gas networks", "Local permissioning" (accounts allowlist). If
ConsenSys's quorum-dev-quickstart is still maintained, it is a fast way to generate a QBFT compose;
otherwise use `besu operator generate-blockchain-config`. Pin the Besu image version you use.
Skills: typescript, ponytail.
The repo foundation lands at T+1:00, so for now touch only docker/ledger/ and scripts/chain/.
Needs H1 (VPS) and H3 (Docker).

Build:
1. docker/ledger/: docker compose with 4 Besu validators on a private network. Genesis: chainId
   24024, QBFT (blockperiodseconds 2, requesttimeoutseconds 4), zeroBaseFee true, a generous gas
   limit, an empty alloc for now. Run every node with --min-gas-price=0, a JVM heap cap around
   512 MB, restart: unless-stopped. Expose JSON-RPC (ETH, NET, WEB3, QBFT, TXPOOL) from one node,
   bound to localhost; the public face comes in step 6.
2. Keys: `pnpm chain:reset` generates keys and genesis into docker/ledger/data/ (gitignored). Commit
   only scripts, the compose file, the PUBLIC genesis and validator addresses of the canonical network
   (docker/ledger/genesis.json) and docker/ledger/members.json mapping each validator address to a
   fictional member: "Chamber of Commerce (demo)", "Banco Demo", "Universidad Demo", "Ministry of
   Labour (demo)". Never commit a private key.
3. Tiny commit with the package scripts chain:up, chain:down, chain:reset.
4. scripts/chain/smoke-gas.ts (Node 24 type stripping, viem): a fresh EOA with zero balance sends a
   transaction with gasPrice 0 and it is mined.
5. docker/ledger/README.md: up, down, reset; how to stop one validator (`docker stop`); the expected
   behaviour (3 of 4 keep producing blocks; with only 2 up the chain halts, which is the BFT bound).
6. With your human (H1): run the same compose on the VPS behind Caddy (HTTPS) or a Cloudflare Tunnel.
   Restrict the public RPC to the Next.js server (a bearer header or an IP allowlist at the proxy).
   Optional hardening: Besu local permissioning with an accounts allowlist that contains only the
   relayer address, once A3-S3 has produced it.

Verify: 4 validators produce a block every ~2 s; qbft_getValidatorsByBlockNumber returns 4; the
zero-balance transaction is mined; stopping one validator keeps blocks flowing, restarting it rejoins.
Commit: "feat(ledger): 4-validator QBFT consortium network with zero gas".
Post the RPC URL for LEDGER_RPC_URL and "network up".
```

## A3-S2 · Memory ledger, gateway routes, DID, dev identities [M] · T+1:30 · ~60 min

```
You are Agent 3 on Constancia. Give every other agent a working ledger today.

Read: contracts §3, §6 (all of it), §7 (AccountClient), §8 (ledger and DID routes).
Skills: nextjs-16, typescript, zod-4, ponytail.

Build:
1. src/lib/ledger/types.ts: the real types of contracts §6, §7.
2. src/lib/ledger/memory.ts: an in-memory consortium with the SAME semantics as Ledger.sol and the
   accounts (members and quorum, applications, one vote per member, suspend, owner keys with
   addedAt/removedAt, anchor requiring an ACTIVE issuer and a live key, revoke by the issuer only,
   head and block counter that ticks every 2 s). A `globalThis` singleton so Next dev reloads keep
   state. It throws if NODE_ENV === 'production'. Boot-seed: the 4 members of docker/ledger/members.json,
   quorum 2, three ACTIVE demo employers ("Orinoco Logistics (demo)", "Tepuy Coffee (demo)", "Lago
   Shipyards (demo)") with fresh keys. Counterfactual account address = a deterministic hash of the key
   and salt (the chain version will use CREATE2).
3. src/lib/ledger/reader.ts getLedgerReader() by LEDGER_MODE (memory now, chain in A3-S5);
   src/lib/ledger/account-client.ts createAccountClient with the memory implementation: it verifies
   the ES256 signature of each op against the account's live keys, so the memory ledger is not a
   free-for-all. src/lib/ledger/gateway-client.ts lookupLedger, fetchNetworkState.
4. Routes: POST /api/ledger/lookup, GET /api/ledger/state, GET /api/ledger/account,
   GET /api/did/resolve, and dev-only POST /api/dev/ledger/op and GET /api/dev/ledger/identities
   (404 in production; the latter returns the boot-seeded private JWKs for local testing). The
   gateway answers a fixed set of read operations only and uses zod on every input.
5. src/app/dev/identity/page.tsx (NEXT_PUBLIC_DEMO_MODE=1): import identities into the local keystore
   from GET /api/dev/ledger/identities or from an uploaded demo-pack/identities.json, as non-extractable
   keys named "member:<n>" and "employer:<name>". Plain markup, it is a dev tool.

Tests: memory-ledger semantics (quorum, double vote, suspended issuer, key windows, anchor and revoke
rules, lookup shape). Write them as a reusable conformance suite
(src/lib/ledger/conformance.ts) that A3-S6 will also run against the chain client.
Gate. Commit: "feat(ledger): memory ledger, gateway routes and DID resolution for local development".
Post "memory ledger is on main: LEDGER_MODE=memory" with the exports.
Then A1 swaps `src/app/ledger/_lib/load-state.ts` to `fetchNetworkState()` and deletes `fixture.ts` (see agent-1 "Carry-over backlog").
```

## A3-S3 · Account abstraction spike [M] · T+2:30 · ~135 min · HARD STEP · GO/NO-GO at T+4:45

```
You are Agent 3 on Constancia. Prove that a browser P-256 device key can control an on-chain
account and send operations at zero fee, with no paymaster. This is the riskiest hour of the project.

Read: contracts §5, §7. ERC-4337 v0.7 (EntryPoint, PackedUserOperation, IAccount), viem's
account-abstraction module (toSmartAccount, getUserOperationHash, entryPoint07Address and Abi,
createBundlerClient), Besu genesis alloc for contract predeploys, the Foundry book (forge test).
Skills: typescript, ponytail.

Build:
1. contracts/vendor/: the MIT P-256 verifier you choose (Daimo P256Verifier, FreshCryptoLib or
   Solady), used as an internal library, not a canonical-address contract.
   contracts/ConsortiumAccount.sol and AccountFactory.sol per contracts §7: owners are (x, y) pairs
   keyed by keyId = keccak256(x, y) with addedAt and removedAt; execute and executeBatch callable only
   by the EntryPoint or the account itself; addOwner and removeOwner self-call only; the last owner
   cannot be removed; validateUserOp checks the 96-byte signature (keyId, r, s) over
   sha256(abi.encodePacked(userOpHash)); pay missingAccountFunds only if non-zero.
2. EntryPoint v0.7 on the ledger at the canonical address, surviving a network restart: either a
   genesis alloc (runtime code copied with eth_getCode from any public chain, plus the SenderCreator
   it embeds) or the deterministic deployer. Record the choice in docker/ledger/README.md.
3. Foundry tests in contracts/test/: create through the factory; a good and a bad signature; owner
   windows; the last owner; callers other than the EntryPoint.
4. The mini bundler: src/lib/ledger/bundler.ts (server-only) and src/app/api/bundler/route.ts with
   the JSON-RPC methods of contracts §7. It submits handleOps from RELAYER_PRIVATE_KEY through a
   serial queue, caps the op size and rate-limits per IP (A4's src/lib/server/rate-limit.ts when it
   exists, a local stub until then). Estimation returns generous constants: nothing is billed.
5. scripts/chain/compile.ts (solc-js 0.8.28, evmVersion paris, optimizer 200) writing
   contracts/out/*.json and src/lib/ledger/abi.ts (as const). Tiny commit for the chain:compile script.
6. scripts/chain/aa-spike.ts: generate a P-256 key with WebCrypto, predict the account address, send
   a UserOp with initCode that deploys the account and calls a trivial target, read the result. Show
   that no balance exists anywhere and the fee is 0.

GO / NO-GO at about T+4:45. GO means step 6 passes on the real network from a P-256 WebCrypto key.
Fallbacks, in this order; the moment you switch, tell the whole team in chat:
  a) the EntryPoint refuses a zero gas price → predeposit funds for the account at genesis and use a
     1-wei gas price (still no paymaster, no faucet);
  b) the P-256 check does not fit the gas limit → raise the block and op limits (nothing is billed);
  c) 4337 still will not work → AA-lite: the same account contract and signature scheme, an
     execute(op, signature) entry point submitted by the relayer, with replay protection by a nonce
     inside the account. Update contracts §7 and the stubs in the same commit.
Gate (lint, typecheck, test, build; forge test). Commit:
"feat(ledger): P-256 smart accounts, factory and bundler on the zero-gas network".
Post "AA is GO" or "AA is on fallback c" with what changes for A4 and A5 (nothing, by design).
```

## A3-S4 · Ledger contract [M] · T+4:45 · ~60 min · HARD STEP

```
You are Agent 3 on Constancia. Ship the contract that is the consortium's memory.

Read: contracts §6 (ILedger and the rules that tests must pin down).
Skills: typescript, ponytail.

Build:
1. contracts/Ledger.sol implementing ILedger exactly. Members and quorum are constructor arguments.
   anchor() must call ownerInfo(keyId) on msg.sender and require a live key; a non-account caller
   therefore reverts. Emit every event of the interface.
2. Foundry tests: quorum and the one-vote rule; a PENDING issuer cannot anchor; anchor with an unknown
   or removed keyId reverts; revoke only by the anchoring issuer and not twice; suspend flips an
   ACTIVE issuer and keeps its records readable; issuerList and members views.
3. scripts/chain/identities.ts: generates the demo identities (4 members, 3 employers, 1 sample holder)
   as P-256 private JWKs into demo-pack/identities.json (gitignored).
4. scripts/chain/deploy.ts: deploys the factory (if absent) and Ledger with the members' counterfactual
   account addresses from identities.json; prints LEDGER_CONTRACT_ADDRESS, NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS
   and LEDGER_DEPLOY_BLOCK. Tiny commit for the package scripts chain:deploy and chain:seed.
5. Run both on the real network. Post the addresses to the team env channel and Render.
Gate. Commit: "feat(ledger): Ledger contract for accreditation, anchoring and revocation".
```

## A3-S5 · Real reader, gateway on the chain, DID [M] · T+5:45 · ~60 min

```
You are Agent 3 on Constancia. Make the gateway read the real ledger behind the same interface.

Read: contracts §6, §8. viem docs: createPublicClient, readContract, getLogs / getContractEvents,
getBlock (the `miner` field is the QBFT proposer), custom RPC requests (qbft_getValidatorsByBlockNumber).
Skills: typescript, zod-4, ponytail.

Build:
1. src/lib/ledger/chain.ts: a LedgerReader over viem. head, issuer, key and keys (ConsortiumAccount
   ownerInfo and ownerIds), record, accountAddress (factory getAddress), isDeployed, and state():
   validators from QBFT, last 16 blocks with their proposer and tx count, last 10 anchors from
   CredentialAnchored logs (hashes only), issuers from issuerList. RPC failures throw
   LedgerUnreachableError (the routes map it to 503).
2. src/lib/ledger/reader.ts: LEDGER_MODE=chain returns it. The routes from A3-S2 keep working unchanged.
3. The DID document resolver uses keys() and returns only live keys in assertionMethod.
4. scripts/chain/smoke.ts: end to end against the network with throwaway keys: apply, approve to quorum,
   anchor, read the record, revoke, read it revoked.

Tests: pure helpers (account-address derivation, DID document building, state mapping) with mocked
clients. The conformance suite runs in A3-S6.
Gate. Commit: "feat(ledger): chain reader and gateway on the consortium ledger".
```

## A3-S6 · Chain account client and conformance [M] · T+6:45 · ~90 min

```
You are Agent 3 on Constancia. Close the loop: a browser device key writes to the ledger and nobody
sees a wallet.

Read: contracts §5, §7. viem account-abstraction docs (toSmartAccount, getUserOperationHash,
toPackedUserOperation, bundler client or raw JSON-RPC).
Skills: typescript, ponytail.

Build src/lib/ledger/account-client.ts (the chain implementation) and src/lib/ledger/userop.ts:
1. createAccountClient follows LEDGER_MODE / NEXT_PUBLIC_LEDGER_MODE. In chain mode it builds a
   v0.7 UserOp (initCode only when the account is not deployed; callData = execute or executeBatch
   of the Ledger call; zero fees; generous constant limits), signs getUserOperationHash with
   signer.sign(message) and packs (keyId, r, s), posts to /api/bundler, and waits for the receipt.
   Methods as in contracts §7; each returns TxResult { txHash, blockNumber, feeWei: '0', elapsedMs }.
2. Errors in human words ("The ledger is busy, retrying…", "Your signing key is not an owner of this
   account") with a `technical` field for Technical details. Retry once on a nonce clash.
3. Run the conformance suite from A3-S2 against the chain client (it needs the network; skip with a
   clear message when LEDGER_RPC_URL is unset so CI stays green).
4. Isomorphic: it must run in the browser and in Node scripts (the seed uses it).

Verify: from a throwaway P-256 key, apply for accreditation, get approved by two member keys, anchor,
read it back through POST /api/ledger/lookup. Both txs in a block, fee 0. Gate.
Commit: "feat(ledger): account client over the bundler, with a shared conformance suite".
Post "M3 swap: set NEXT_PUBLIC_LEDGER_MODE=chain and LEDGER_MODE=chain; nothing else changes for you".
```

## A3-S7 · Seed, preflight, runbook [M] · T+8:15 · ~90 min

```
You are Agent 3 on Constancia. Make the Web3 layer demo-proof.

Read: docs/plan/demo.md. Skills: typescript, ponytail.

Build:
1. scripts/chain/seed.ts (`pnpm chain:seed`). Do this FIRST: A4-S7 needs the accredited employers
   on production at about T+9:00 and A5-S6 needs sample.json. It reads demo-pack/identities.json;
   the three employers apply, the members approve to quorum; then, using A2's libraries in Node,
   issue and anchor:
   - public/demo/sample.json (COMMITTED, synthetic): a certificate from the first employer to the
     sample holder plus the holder's private JWK, published on purpose for the Lab;
   - demo-pack/vault.json (NOT committed): two PAST certificates from the second and third employers
     (ended employments of different years) bound to the demo holder's per-certificate keys, for A5's
     /vault/import and the Verified CV beat.
2. scripts/check-demo.ts (`pnpm check:demo`): a green/red table. Four validators and a block younger
   than 10 s; Ledger and EntryPoint code present; the relayer works; POST /api/ledger/lookup answers
   for the sample; the sample verifies with A2's pipeline; APP_URL reachable; DATABASE_URL reachable;
   LEDGER_MODE is not memory in production.
3. Retries: a stuck handleOps is resubmitted; ALREADY_EXISTS on an anchor by the same account counts as
   success; a 30 s receipt timeout gives a clear error.
4. src/lib/ledger/format.ts (isomorphic): shortHash, formatBlock, formatAge for A1, A4, A5.
5. docs/plan/demo.md Pre-flight: write the exact commands (the network, the seed, check:demo) and how
   to wake and verify the VPS.
Gate. Commit: "chore(ledger): seed, demo preflight and ledger formatting helpers".
```

## A3-S8 · Production wiring and drills [M] · T+9:45 · ~75 min

```
You are Agent 3 on Constancia. Make the ledger work on the Render deploy and survive demo day.

Do: confirm Render env (every var in contracts §10, LEDGER_MODE=chain); the proxy in front of the VPS
RPC answers the Render server and nobody else; run `pnpm chain:seed` against production and verify the
sample on the deployed /verify; `pnpm check:demo` green against production; the VPS survives a
reboot (restart policy) and has disk and log rotation; the kill-one-validator drill (docker stop → blocks
keep coming → /ledger shows the colour vanish → restart). Then help A2, A4 and A5 with ledger
integration bugs and run the code-review skill on your diff since M0.
Commit: "fix(ledger): …".
```

## A3 · Hand-offs from A2 once the ledger is real [M] · after A3-S2 and A3-S6 are on main

Source: `docs/plan/progress/A2.md` (A2-S7 partial). A2 could not do these without your work, so they
land on A3. Nothing here changes a contract.

```
1. public/demo/sample.json (A3-S7): { credential, holderJwk } as in contracts §4.5 (Sample). Check
   that `runAttack` from src/lib/credential/attacks.ts works on it: the four attacks must fail at
   TOKEN, SIGNATURE, ISSUER, HOLDER and the untouched sample must verify AUTHENTIC.
2. Real-ledger run of /verify with LEDGER_MODE=chain (A2-S7 item 1): present the sample and a fresh
   certificate, and fix anything that differs from the memory ledger: timestamps (anchoredAt,
   addedAt, removedAt, revokedAt are epoch seconds), key windows, head.time (the verifier uses it as
   "now"). If the fix is in src/lib/credential/ or src/app/verify/, tell A2 or make it in a tiny
   commit and say so in chat.
3. POST /api/ledger/lookup must answer 503 {error:'LEDGER_UNREACHABLE'} when the node is down:
   /verify turns any non-OK answer into "Cannot verify right now". Test with the node stopped.
4. Once lookup and A4's GET /api/shares/:id are real, remove the TEMP pieces in src/app/verify:
   delete _lib/fixture.ts, the "Try a sample" button and the `?fixture=1` switch in
   _components/verify-view.tsx. _lib/lookup-client.ts already posts to /api/ledger/lookup.
5. Revoke moment: revoke a certificate with the account client, press "Check again" on /verify, and
   confirm the Ledger record row turns red with "The employer revoked this certificate".
6. Known leftover: `pnpm lint` fails on pedantic oxlint warnings in src/lib/credential and
   src/app/verify (no-await-in-loop, toSorted, test style). Fix them only if the team wants lint in
   the gate again.
Commit: "fix(ledger): verify against the real ledger".
```
