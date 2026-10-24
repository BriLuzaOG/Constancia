# Agent 3 · The consortium ledger: Sepolia, contracts, account abstraction, paymaster, bundler, reads, client

**Mission:** make the blockchain real and invisible. A consortium ledger on **public Sepolia**:
members and quorum live in `Ledger.sol`; HR and consortium members control smart accounts with a
device key; **one sponsor wallet pays every fee through our verifying paymaster**, so nobody ever
sees a wallet or a gas cost. You own every line that touches the chain.

**You own:** `contracts/`, `scripts/chain/`, `scripts/check-demo.ts`, `src/lib/ledger/`,
`src/app/api/bundler/`, `src/app/api/ledger/`, `src/app/api/did/`, `src/app/api/dev/`,
`src/app/dev/identity/`, `public/demo/`.

**Context:** A1 and A2 are done and left their ledger debt with you (bottom of this file): the
`/ledger` fixture swap, the `/verify` fixture drop and the real-ledger run. Everyone else built
against fixtures; your **memory ledger** (S2) is still the interface everything swaps onto until the
real one lands at M3. If the account abstraction spike (S3) cannot pass by the go/no-go at T+4:45,
tell the whole team at once and take the fallback.

**Sepolia realities that shape every step:** blocks are ~12 s (not 2); gas is real but invisible —
the sponsor wallet funds our paymaster's deposit on the canonical EntryPoint v0.7, which is **already
deployed on Sepolia** at `0x0000000071727De22E5E9d8BAf0edAc6f37da032` (viem's `entryPoint07Address`;
verified on chain — never deploy it). The sponsor is "infinite" because we top it up: `chain:status`
checks the floor, demo.md has the faucet runbook. **Fund the sponsor wallet at T+0: faucets are the
slow part.** No VPS, no Docker, no validators. `viem` is already a dependency and `solc` 0.8.28 a
devDependency; Foundry (H0) is still needed for `forge test`.

Every step: follow the rules in [README.md](README.md).

---

## A3-S1 · Sepolia connection and the sponsor wallet [M] · T+0:00 · ~90 min · works only in `scripts/chain/` (pre-M0)

```
You are Agent 3 on Constancia. Stand up the "network": Sepolia plus one sponsor wallet that pays
every fee. No VPS, no Docker, no validators to host.

Read: PRODUCT.md, docs/plan/contracts.md §6 and §7 (introductions). The canonical EntryPoint v0.7
(0x0000000071727De22E5E9d8BAf0edAc6f37da032, viem's entryPoint07Address) is ALREADY deployed on
Sepolia — verify its code with eth_getCode, never deploy it. viem docs: createPublicClient, http
transport, the sepolia chain. Skills: typescript, ponytail.
The repo foundation lands at T+1:00, so touch only scripts/chain/ (self-contained scripts, no
src/ imports yet).
Needs your human (H1): an Alchemy account (a Sepolia API key for LEDGER_RPC_URL) and faucet access.

Build:
1. Sponsor wallet: ONE new throwaway EOA. It is the "infinite gas" wallet: it owns the paymaster,
   signs every sponsorship and relays every handleOps. Create it now and fund it NOW — faucets are
   the slow part (Alchemy, Infura, Google and the PoW faucet as needed; target ≥ 0.5 ETH total).
   The private key lives only in env and later in Render secrets. Never commit it.
2. scripts/chain/status.ts (`pnpm chain:status`): self-contained viem over LEDGER_RPC_URL —
   chainId and block age, sponsor balance, non-empty code at the EntryPoint address, and (when
   they exist) our deployed contracts and the paymaster's deposit on the EntryPoint. This replaces
   the old network README as the network's face.
3. Tiny commit with the chain:status package script (self-contained; no src/ imports yet).
Verify: `pnpm chain:status` answers chainId 11155111, a block younger than ~30 s, sponsor balance
> 0, non-empty code at the EntryPoint address. (If that code were ever missing, deploy the
EntryPoint once from the deterministic deployer and record the address — it then becomes OUR
address in env.)
Commit: "feat(ledger): Sepolia connection, sponsor wallet and chain status".
Post LEDGER_RPC_URL, the sponsor address and "network is Sepolia; no VPS needed".
```

## A3-S2 · Memory ledger, gateway routes, DID, dev identities, the /ledger swap [M] · T+1:30 · ~75 min

```
You are Agent 3 on Constancia. Give every other agent a working ledger today, and pay down A1's
fixture debt in the same commit.

Read: contracts §3, §6 (all of it), §7 (AccountClient), §8 (ledger and DID routes).
Skills: nextjs-16, typescript, zod-4, ponytail.

Build:
1. src/lib/ledger/members.json: the four fictional consortium members ("Chamber of Commerce
   (demo)", "Banco Demo", "Universidad Demo", "Ministry of Labour (demo)") — constructor data for
   Ledger.sol and the boot-seed. No validator addresses anywhere.
2. src/lib/ledger/public-client.ts: the viem public client (chain sepolia, http transport over
   LEDGER_RPC_URL); RPC failures throw LedgerUnreachableError.
3. src/lib/ledger/memory.ts: an in-memory consortium with the SAME semantics as Ledger.sol and the
   accounts (members and quorum, applications, one vote per member, suspend, owner keys with
   addedAt/removedAt, anchor requiring an ACTIVE issuer and a live key, revoke by the issuer only,
   head and block counter that ticks every 12 s — Sepolia's cadence). A `globalThis` singleton so
   Next dev reloads keep state. It throws if NODE_ENV === 'production'. Boot-seed: the 4 members of
   members.json, quorum 2, three ACTIVE demo employers ("Orinoco Logistics (demo)", "Tepuy Coffee
   (demo)", "Lago Shipyards (demo)") with fresh keys. Counterfactual account address = a
   deterministic hash of the key and salt (the chain version will use CREATE2).
4. src/lib/ledger/reader.ts getLedgerReader() by LEDGER_MODE (memory now, chain in A3-S5);
   account-client.ts createAccountClient with the memory implementation: it verifies the ES256
   signature of each op against the account's live keys, so the memory ledger is not a
   free-for-all. gateway-client.ts lookupLedger, fetchNetworkState.
5. Routes: POST /api/ledger/lookup, GET /api/ledger/state, GET /api/ledger/account,
   GET /api/did/resolve, and dev-only POST /api/dev/ledger/op and GET /api/dev/ledger/identities
   (404 in production; the latter returns the boot-seeded private JWKs for local testing). The
   gateway answers a fixed set of read operations only and uses zod on every input.
6. src/app/dev/identity/page.tsx (NEXT_PUBLIC_DEMO_MODE=1): import identities into the local
   keystore from GET /api/dev/ledger/identities or from an uploaded demo-pack/identities.json, as
   non-extractable keys named "member:<n>" and "employer:<name>". Plain markup, it is a dev tool.
7. A1's debt, absorbed (the human handed it over; /ledger is A1's lane — announce it in chat):
   src/lib/ledger/types.ts moves to the §6 shape (no validators, no proposer, blockTimeSec 12);
   src/app/ledger/_lib/load-state.ts returns fetchNetworkState() and fixture.ts is deleted; the
   minimal /ledger component edits — drop the validators panel, keep the 16-block strip with its
   ink rotation keyed by blockNumber (decorative), and "How this ledger is run" now says public
   Sepolia with one consortium wallet paying every fee.

Tests: memory-ledger semantics (quorum, double vote, suspended issuer, key windows, anchor and
revoke rules, lookup shape) as a reusable conformance suite (src/lib/ledger/conformance.ts) that
A3-S6 also runs against the chain client.
Gate. Commit: "feat(ledger): memory ledger, gateway routes, DID and the real /ledger state".
Post "memory ledger is on main: LEDGER_MODE=memory" with the exports.
```

## A3-S3 · Account abstraction spike [M] · T+2:30 · ~135 min · HARD STEP · GO/NO-GO at T+4:45

```
You are Agent 3 on Constancia. Prove that a browser P-256 device key can control an on-chain
account on Sepolia and send operations whose fee the user never sees or pays. Gas is real; our
paymaster absorbs all of it. This is still the riskiest hour of the project.

Read: contracts §5, §7. ERC-4337 v0.7 (EntryPoint — already on Sepolia, PackedUserOperation,
IAccount, IPaymaster), viem's account-abstraction module (toSmartAccount, getUserOperationHash,
entryPoint07Address and Abi), the Foundry book (forge test). Skills: typescript, ponytail.

Build:
1. contracts/vendor/: the MIT P-256 verifier you choose (Daimo P256Verifier, FreshCryptoLib or
   Solady), compiled in as an internal library — Sepolia does not guarantee the RIP-7212
   precompile. contracts/ConsortiumAccount.sol and AccountFactory.sol per contracts §7: owners are
   (x, y) pairs keyed by keyId = keccak256(x, y) with addedAt and removedAt; execute and
   executeBatch callable only by the EntryPoint or the account itself; addOwner and removeOwner
   self-call only; the last owner cannot be removed; validateUserOp checks the 96-byte signature
   (keyId, r, s) over sha256(abi.encodePacked(userOpHash)); missingAccountFunds is always 0 — the
   paymaster covers everything and the account never holds ETH.
2. contracts/VerifyingPaymaster.sol (v0.7): the sponsor owns it; paymasterAndData = the sponsor's
   signature over the userOpHash plus a validity window; validatePaymasterUserOp checks it. Only
   the sponsor can make it accept an op; only our bundler asks the sponsor to sign.
3. Foundry tests in contracts/test/: create through the factory; a good and a bad signature; owner
   windows; the last owner; callers other than the EntryPoint; the paymaster rejecting ops without
   a valid sponsor signature.
4. The mini bundler: src/lib/ledger/bundler.ts (server-only) and src/app/api/bundler/route.ts with
   the JSON-RPC methods of contracts §7 plus eth_sponsorUserOperation, which returns the
   sponsor-signed paymasterAndData and the real gas fields for a userOpHash. It submits handleOps
   from RELAYER_PRIVATE_KEY (the sponsor EOA) through a serial queue, caps the op size and
   rate-limits per IP (src/lib/server/rate-limit.ts exists — use it). Who pays: the relayer fronts
   the gas of each handleOps and the EntryPoint refunds it in the same transaction from the
   paymaster's deposit — the deposit is the single pool that absorbs every fee; keep a small float
   on the relayer for in-flight gas. Gas patience: the queue refuses to submit above a high gas
   cap (e.g. 100 gwei) and retries — no demo write is worth overpaying.
5. scripts/chain/compile.ts (solc-js 0.8.28, evmVersion paris, optimizer 200) writing
   contracts/out/*.json and src/lib/ledger/abi.ts (as const). Tiny commit for the chain:compile
   script.
6. scripts/chain/aa-spike.ts: generate a P-256 key with WebCrypto, predict the account address,
   get paymasterAndData from the local bundler, send a UserOp with initCode that deploys the
   account and calls a trivial target, read the result. Show: the account balance is 0 before and
   after, and the sponsor (relayer float + paymaster deposit) went down by exactly the fee.

GO / NO-GO at about T+4:45. GO means step 6 passes on Sepolia from a P-256 WebCrypto key with a
zero-balance account.
Fallbacks, in this order; the moment you switch, tell the whole team in chat:
  a) the Alchemy RPC rate-limits or lags → batch requests, exponential backoff, and a second
     provider key as LEDGER_RPC_URL_BACKUP (check-demo verifies both);
  b) faucets or gas spikes drain the sponsor → raise the deposit buffer early, rotate faucets and
     lean on the gas patience; fees stay invisible to users, only the runbook changes;
  c) 4337 still will not work → AA-lite: the same account contract and signature scheme, an
     execute(op, signature) entry point submitted by the sponsor-relayer, with replay protection by
     a nonce inside the account. Update contracts §7 and the stubs in the same commit.
Gate (lint, typecheck, test, build; forge test). Commit:
"feat(ledger): P-256 smart accounts, factory, paymaster and bundler on Sepolia".
Post "AA is GO" or "AA is on fallback c" with what changes for A4 and A5 (nothing, by design).
```

## A3-S4 · Ledger contract and the Sepolia deploy [M] · T+4:45 · ~60 min · HARD STEP

```
You are Agent 3 on Constancia. Ship the contract that is the consortium's memory, on Sepolia.

Read: contracts §6 (ILedger and the rules that tests must pin down). Skills: typescript, ponytail.

Build:
1. contracts/Ledger.sol implementing ILedger exactly. Members and quorum are constructor arguments
   — the four fictional members of src/lib/ledger/members.json are the consortium; there are no
   validators. anchor() must call ownerInfo(keyId) on msg.sender and require a live key; a
   non-account caller therefore reverts. Emit every event of the interface.
2. Foundry tests: quorum and the one-vote rule; a PENDING issuer cannot anchor; anchor with an
   unknown or removed keyId reverts; revoke only by the anchoring issuer and not twice; suspend
   flips an ACTIVE issuer and keeps its records readable; issuerList and members views.
3. scripts/chain/identities.ts: generates the demo identities (4 members, 3 employers, 1 sample
   holder) as P-256 private JWKs into demo-pack/identities.json (gitignored).
4. scripts/chain/deploy.ts: deploys to Sepolia the P-256 verifier (if not compiled in), the factory
   (if absent), VerifyingPaymaster, and Ledger with the members' counterfactual account addresses
   from identities.json; then moves sponsor ETH into the paymaster's deposit on the EntryPoint
   (`pnpm chain:deposit`). Prints LEDGER_CONTRACT_ADDRESS, NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS,
   PAYMASTER_ADDRESS and LEDGER_DEPLOY_BLOCK. Sepolia persists: record the block, never redeploy.
   Add PAYMASTER_ADDRESS to env.ts and .env.example. Tiny commit for the scripts chain:deploy,
   chain:deposit and chain:seed.
5. Run it on Sepolia. Post the addresses to the team env channel and Render.
Gate. Commit: "feat(ledger): Ledger contract for accreditation, anchoring and revocation on Sepolia".
```

## A3-S5 · Real reader, gateway on the chain, DID [M] · T+5:45 · ~60 min

```
You are Agent 3 on Constancia. Make the gateway read the real ledger behind the same interface.

Read: contracts §6, §8. viem docs: createPublicClient, readContract, getLogs / getContractEvents,
getBlock. No QBFT on Sepolia: no validator calls exist. Skills: typescript, zod-4, ponytail.

Build:
1. src/lib/ledger/chain.ts: a LedgerReader over viem. head (the Sepolia block; its timestamp is
   head.time), issuer, key and keys (ConsortiumAccount ownerInfo and ownerIds), record,
   accountAddress (factory getAddress), isDeployed, and state(): the consortium MEMBERS from the
   Ledger (the §6 shape: no validators, no proposer), last 16 blocks with their tx count, last 10
   anchors from CredentialAnchored logs (hashes only), issuers from issuerList. RPC failures throw
   LedgerUnreachableError (the routes map it to 503).
2. src/lib/ledger/reader.ts: LEDGER_MODE=chain returns it. The routes from A3-S2 keep working
   unchanged.
3. The DID document resolver uses keys() and returns only live keys in assertionMethod.
4. scripts/chain/smoke.ts: end to end against Sepolia with throwaway keys: apply, approve to
   quorum, anchor, read the record, revoke, read it revoked. Budget ~3 min: 12 s blocks, one op
   per bundle.

Tests: pure helpers (account-address derivation, DID document building, state mapping) with mocked
clients. The conformance suite runs in A3-S6.
Gate. Commit: "feat(ledger): chain reader and gateway on the Sepolia ledger".
```

## A3-S6 · Chain account client and conformance [M] · T+6:45 · ~90 min

```
You are Agent 3 on Constancia. Close the loop: a browser device key writes to the ledger and nobody
sees a wallet or a fee.

Read: contracts §5, §7. viem account-abstraction docs (toSmartAccount, getUserOperationHash,
toPackedUserOperation, bundler client or raw JSON-RPC). Skills: typescript, ponytail.

Build src/lib/ledger/account-client.ts (the chain implementation) and src/lib/ledger/userop.ts:
1. createAccountClient follows LEDGER_MODE / NEXT_PUBLIC_LEDGER_MODE. In chain mode the flow is:
   ask /api/bundler for sponsorship (eth_sponsorUserOperation: paymasterAndData + the real gas
   fields + the account nonce), build the v0.7 UserOp (initCode only when the account is not
   deployed; callData = execute or executeBatch of the Ledger call), sign getUserOperationHash
   with signer.sign(message), pack (keyId, r, s), post to /api/bundler, and wait for the receipt.
   The user pays 0; the paymaster pays the real fee. Methods as in contracts §7; each returns
   TxResult { txHash, blockNumber, feeWei: '0', sponsorFeeWei, elapsedMs }.
2. Errors in human words ("The ledger is busy, retrying…", "Your signing key is not an owner of
   this account") with a `technical` field for Technical details. Retry once on a nonce clash.
3. Run the conformance suite from A3-S2 against the chain client (it needs Sepolia; skip with a
   clear message when LEDGER_RPC_URL is unset so CI stays green). Generous timeouts: each op is one
   Sepolia block.
4. Isomorphic: it must run in the browser and in Node scripts (the seed uses it).
5. A1's debt: run /ledger/operator against this client (a member key approves an employer; the
   console was built on fixtures).

Verify: from a throwaway P-256 key, apply for accreditation, get approved by two member keys,
anchor, read it back through POST /api/ledger/lookup. Both ops mined, the user paid 0. Gate.
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
   - demo-pack/vault.json (NOT committed): two PAST certificates from the second and third
     employers (ended employments of different years) bound to the demo holder's per-certificate
     keys, for A5's /vault/import and the Verified CV beat.
2. scripts/check-demo.ts (`pnpm check:demo`): a green/red table. Sepolia reachable and a block
   younger than ~60 s (on LEDGER_RPC_URL and the backup); Ledger and EntryPoint code present; the
   sponsor balance and the paymaster deposit above a floor (e.g. 0.05 ETH each), with the top-up
   command printed when low; the relayer works; POST /api/ledger/lookup answers for the sample; the
   sample verifies with A2's pipeline; APP_URL reachable; DATABASE_URL reachable; LEDGER_MODE is
   not memory in production.
3. Retries: a stuck handleOps is resubmitted; ALREADY_EXISTS on an anchor by the same account
   counts as success; a 60 s receipt timeout gives a clear error (Sepolia's 12 s blocks, not 30 s).
4. src/lib/ledger/format.ts (isomorphic): shortHash, formatBlock, formatAge for A1, A4, A5.
5. docs/plan/demo.md Pre-flight: the exact commands (chain:status, chain:deposit if low,
   chain:seed, check:demo), the faucet top-up runbook, and the RPC failover drill. No VPS to wake.
Gate. Commit: "chore(ledger): seed, demo preflight and ledger formatting helpers".
```

## A3-S8 · Production wiring and drills [M] · T+9:45 · ~75 min

```
You are Agent 3 on Constancia. Make the ledger work on the Render deploy and survive demo day.

Do: confirm Render env (every var in contracts §10; LEDGER_MODE=chain; LEDGER_RPC_URL = the
Alchemy Sepolia URL; RELAYER_PRIVATE_KEY, the sponsor key, in Render secrets); run `pnpm
chain:seed` against Sepolia (once — Sepolia persists) and verify the sample on the deployed
/verify; `pnpm check:demo` green against production. Drills (they replace the kill-one-validator
drill):
  a) RPC failover: flip LEDGER_RPC_URL to the backup provider, confirm /verify says "Cannot
     verify right now" only when BOTH providers fail, and that ops resume on the backup;
  b) paymaster burn-down: run the seed again, watch the deposit fall in chain:status, run
     `pnpm chain:deposit`, confirm ops resume — this is the engine room of the "infinite gas"
     fiction;
  c) sponsor balance low: the faucet runbook from demo.md.
Then help A2, A4 and A5 with ledger integration bugs and run the code-review skill on your diff
since M0.
Commit: "fix(ledger): …".
```

## A3 · Debt absorbed from A1 and A2 [M] · after A3-S2, A3-S6 and A3-S7 are on main

The human handed A1's and A2's ledger debt to you (progress/A1.md "Deferred", progress/A2.md
"Deferred"). The `/ledger` swap and the operator run are inside A3-S2 and A3-S6. What is left:

```
1. public/demo/sample.json (A3-S7): { credential, holderJwk } as in contracts §4.5 (Sample). Check
   that `runAttack` from src/lib/credential/attacks.ts works on it: the four attacks must fail at
   TOKEN, SIGNATURE, ISSUER, HOLDER and the untouched sample must verify AUTHENTIC.
2. Real-ledger run of /verify with LEDGER_MODE=chain (A2-S7 item 1): present the sample and a fresh
   certificate, and fix anything that differs from the memory ledger: timestamps (anchoredAt,
   addedAt, removedAt, revokedAt are epoch seconds), key windows, head.time (the verifier uses it
   as "now"; on Sepolia it is the latest block timestamp, at most ~13 s stale). If the fix is in
   src/lib/credential/ or src/app/verify/, tell A2's lane owner or make it in a tiny commit and say
   so in chat.
3. POST /api/ledger/lookup must answer 503 {error:'LEDGER_UNREACHABLE'} when the RPC is dead:
   /verify turns any non-OK answer into "Cannot verify right now". Test with both RPC URLs
   pointing at a dead host.
4. Once lookup is real, remove the TEMP pieces in src/app/verify: delete _lib/fixture.ts and the
   `?fixture=1` switch in _components/verify-view.tsx, and repoint the "Try a sample" button to
   public/demo/sample.json. The share-link path (#s=) needs A4's GET /api/shares/:id — if that is
   not real yet, leave that path alone; it is A4's debt, not yours. _lib/lookup-client.ts already
   posts to /api/ledger/lookup.
5. Revoke moment: revoke a certificate with the account client, press "Check again" on /verify, and
   confirm the Ledger record row turns red with "The employer revoked this certificate".
6. Known leftover: `pnpm lint` fails on pedantic oxlint warnings in src/lib/credential and
   src/app/verify (no-await-in-loop, toSorted, test style). That is A2's lane; fix it only if the
   team wants lint in the gate again.
Commit: "fix(ledger): verify against the real Sepolia ledger".
```
