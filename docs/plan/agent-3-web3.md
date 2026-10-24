# Agent 3 · Web3 abstraction: Privy, raw-hash signing, contract, JIT gas, chain reads

**Mission:** make the blockchain and key management invisible. Registrars log in with email, sign
ES256K credentials with a sharded key they never see, and anchor on Base Sepolia without popups or
crypto. You own every line that touches Privy or the chain.

**You own:** `contracts/`, `scripts/contracts/`, `scripts/check-demo.ts`, `src/lib/chain/`,
`src/lib/privy/`, `src/app/api/gas/sponsor/route.ts`, `src/app/dev/privy/`, `src/app/api/dev/`.

**You are on the critical path.** A4's onboarding needs S1 + S2 by T+3:30. If `secp256k1_sign` does
not work at S2, tell the whole team at once.

Every step: follow the rules in [README.md](README.md).

---

## A3-S1 · Privy provider + server-side admin auth · T+0:45 · ~90 min

```
You are Agent 3 on ScholarKey. Wire Privy so registrars log in with email and the server knows
who they are and which embedded wallet they own.

Read: PRODUCT.md, docs/plan/contracts.md §7, §8. Read the current Privy docs (docs.privy.io):
React SDK setup in Next.js App Router, embedded wallets (Ethereum, createOnLogin), showWalletUIs,
access-token verification on the server, and fetching a user's linked wallets server-side.
Skills: nextjs-16, react-19, typescript, ponytail.
Needs from your human (H1): NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET in .env.local.

First (2 minutes, so the faucet can run in parallel): generate the sponsor key with viem's
generatePrivateKey/privateKeyToAccount in a throwaway node one-liner, give key + address to your
human for the private env channel and faucet funding (H4). Never commit it.

Build:
1. src/lib/privy/provider.tsx ('use client'): IssuerProviders per contracts §7 (email only,
   embedded wallet on login, showWalletUIs false, Base Sepolia default and only chain). Without an
   app id (CI build) render children plus a dev notice, never crash prerender. Appearance: light,
   match the DESIGN tokens/kit, no wallet wording.
2. src/lib/privy/server.ts (server-only): requireAdmin(req) verifies the Bearer access token, loads
   the user, returns { privyUserId, walletAddress } of the Privy embedded Ethereum wallet; HttpError.
3. src/lib/privy/fetch.ts: issuerFetch(path, body) adds the access token (Privy's getAccessToken).
4. Spike: src/app/dev/privy/page.tsx (login, show user + wallet address) and
   src/app/api/dev/whoami/route.ts returning requireAdmin(req). Both 404 in production.

Verify: on localhost, log in with a real email → wallet created without any popup → whoami returns
the address. Gate.
Commit: "feat(privy): issuer providers and server-side admin auth". Post the exports for A4.
```

## A3-S2 · ES256K raw-hash signer + key-ownership proof · T+2:15 · ~75 min · CRITICAL SPIKE

```
You are Agent 3 on ScholarKey. Prove that the Privy embedded wallet can produce a standard ES256K
JWT signature, then expose it as the DigestSigner the credential library expects.

Read: contracts §3, §4.2, §7. Privy docs: "Sign a raw hash" (secp256k1_sign through the wallet's
EIP-1193 provider: wallet.getEthereumProvider() then request({ method: 'secp256k1_sign',
params: [hash] })). It signs the given hash directly, with no prefix.
Skills: react-19, typescript, ponytail.

Build:
1. src/lib/privy/signer.ts usePrivySigner(): find the embedded wallet (useWallets); sign(digest)
   → secp256k1_sign(hex) → normalize to 64-byte low-s r||s (A2's normalizeSignature, or noble if
   A2-S1 isn't merged yet).
2. proveKey(): digest = sha256("ScholarKey key proof|" + address + "|" + isoTime); sign; recover
   the uncompressed public key (viem recoverPublicKey with the 65-byte signature); jwk =
   jwkFromPublicKey; assert addressFromJwk(jwk) === wallet address; return { jwk, proof }.
3. src/lib/privy/proof.ts (isomorphic): verifyKeyProof(proof, expectedAddress) → SecpJwk. A4's
   institution route calls it to re-check the proof server-side against the Privy wallet address.
4. Spike page: "Sign a test JWT" builds a signing input, signs it with the Privy key, and verifies it
   with verifyJwtSignature against the recovered JWK → shows ✓.

FALLBACK if secp256k1_sign is rejected: try eth_sign (legacy raw-hash signing). If both fail,
STOP and alert the team. The next option is Privy server-side wallets with user authorization
(POST /v1/wallets/{id}/rpc secp256k1_sign), which needs a team decision. Never silently switch to
personal_sign: it produces a non-standard ES256K signature.

Gate. Commit: "feat(privy): ES256K raw-hash signer and key-ownership proof". Post "signer ready".
```

## A3-S3 · CredentialAnchor contract: compile, deploy, smoke · T+3:30 · ~75 min

```
You are Agent 3 on ScholarKey. Ship the blind anchor contract on Base Sepolia.

Read: contracts §6 (contract source is final; issuer-keyed mapping prevents front-running).
Skills: typescript, ponytail.

Build:
1. contracts/CredentialAnchor.sol (exactly as in contracts §6, Solidity 0.8.28).
2. scripts/contracts/compile.ts: solc-js 0.8.28 standard JSON, optimizer 200 runs →
   contracts/out/CredentialAnchor.json (abi, bytecode, metadata) and
   src/lib/chain/credential-anchor.ts exporting `credentialAnchorAbi` (as const). Commit both.
3. Confirm the sponsor wallet from S1 is funded (H4, ≥ 0.05 ETH) before deploying.
4. scripts/contracts/deploy.ts: deploys with SPONSOR_PRIVATE_KEY via viem, prints address + block.
5. scripts/contracts/smoke.ts: anchors a random id, reads anchoredAt, and simulates a duplicate
   (expects AlreadyAnchored).
Run scripts with Node 24 type stripping: `node --env-file=.env.local scripts/contracts/deploy.ts`
(relative imports with .ts extensions, no @ aliases). Add package scripts contracts:compile,
contracts:deploy, contracts:smoke (add the lines yourself: tiny commit).

Verify: deploy, smoke passes, contract visible on sepolia.basescan.org.
Post NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS and ANCHOR_DEPLOY_BLOCK to the team env channel + Render.
Commit: "feat(chain): CredentialAnchor contract with compile, deploy and smoke scripts".
```

## A3-S4 · Chain server lib: anchor reads + just-in-time gas sponsor · T+4:45 · ~75 min

```
You are Agent 3 on ScholarKey. Read anchors and fund the registrar's wallet with the exact fee,
just before it writes.

Read: contracts §6, §10. viem docs: OP-stack actions (publicActionsL2 from 'viem/op-stack':
estimateL1Fee / estimateTotalFee), estimateContractGas, estimateFeesPerGas, getContractEvents.
Skills: typescript, ponytail.

Build (server-only):
1. src/lib/chain/clients.ts: publicClient (baseSepolia, BASE_SEPOLIA_RPC_URL) extended with
   publicActionsL2(), and the sponsor walletClient. Lazy, so no env read at import.
2. anchor.ts readAnchor(issuer, id): anchoredAt(issuer, id); if > 0, best-effort tx hash via
   getContractEvents(CredentialAnchored, args { issuer, credentialId }, fromBlock ANCHOR_DEPLOY_BLOCK);
   explorerUrl https://sepolia.basescan.org/tx/<hash>. RPC failure → throw a typed ChainUnavailableError.
3. sponsor.ts sponsorAnchorGas(admin, id): estimate L2 gas for anchor(id) from `admin`, fees, and
   the L1 data fee; computeTopUp(...) = (gas × maxFeePerGas + l1Fee) × 1.2 − balance, floored at 0
   (pure, exported, unit-tested); send the top-up from the sponsor wallet and wait for the receipt;
   return SponsorResult. shortcut: a single sponsor nonce means sequential sponsoring only, fine
   for the demo; use a nonce manager if it ever serves concurrent issuers.
4. scripts/check-sponsor.ts prints sponsor balance and a sample estimate.

Tests: computeTopUp edge cases (enough balance → 0, buffer applied, bigint math).
Gate. Commit: "feat(chain): anchor reads and just-in-time gas sponsoring".
```

## A3-S5 · Sponsor API + sponsored anchoring hook (no popups) · T+6:00 · ~90 min

```
You are Agent 3 on ScholarKey. Close the loop: the registrar's browser anchors a credential while
our sponsor pays exactly what it costs, and nobody sees a wallet.

Read: contracts §7, §8 (POST /api/gas/sponsor), §9 (guards). Privy docs: useSendTransaction with
uiOptions { showWalletUIs: false } (check the signature for your SDK version).
Skills: nextjs-16, react-19, typescript, zod-4, ponytail.

Build:
1. src/app/api/gas/sponsor/route.ts: requireAdmin → zod { credentialId } → A4's
   assertCanIssue + assertPreparedCredential (if A4 hasn't merged them, they are still stubs: code
   against them anyway) → sponsorAnchorGas(walletAddress, credentialId) → SponsorResult. Map errors
   to contract codes. Never log the body.
2. src/lib/privy/use-anchor.ts useAnchorCredential(): issuerFetch sponsor → send
   { to: contract, data: encodeFunctionData(anchor, [id]), gas, maxFeePerGas,
   maxPriorityFeePerGas, chainId: 84532 } through the Privy embedded wallet with
   showWalletUIs:false → wait for the receipt with a client publicClient
   (NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL) → { fundingTxHash, anchorTxHash, blockNumber, topUpWei }.
3. Human-language errors, no Web3 words ("The network is busy, retrying…", "Your session expired,
   sign in again"). Raw details go in an `technical` field for the Technical details disclosure.
4. Dev page: "Anchor a test credential". Dev-only bypass of the A4 guards when NODE_ENV !==
   'production' and body.dev === true, so you can test before A4-S5.

Verify: from the dev page, anchor end-to-end with zero popups; both txs on BaseScan; readAnchor
returns anchored. Gate.
Commit: "feat(chain): sponsored anchoring without wallet prompts". Post the hook for A4.
```

## A3-S6 · Hardening, preflight script, explorer helpers · T+7:30 · ~90 min

```
You are Agent 3 on ScholarKey. Make the Web3 layer demo-proof.

Skills: typescript, ponytail.

Build:
1. scripts/check-demo.ts (`pnpm check:demo`): green/red table for sponsor balance ≥ 0.01 ETH,
   contract code present at the address, RPC latency, the demo university did.json resolving over
   HTTPS, APP_URL/api/verify/lookup reachable, Privy app id set.
2. Retries: replace a stuck sponsor tx with bumped fees; 30 s receipt timeout with a clear error;
   ALREADY_ANCHORED by our own address counts as success.
3. src/lib/chain/format.ts (isomorphic): formatEth(wei), shortHash, explorerTx(hash),
   explorerAddress(addr). A4/A5 use these for measured values and Technical details.
4. Stretch: scripts/contracts/verify.ts publishes the source to Sourcify (Base Sepolia) so BaseScan
   shows a verified contract.
Gate. Commit: "chore(chain): demo preflight, retries and explorer helpers".
```

## A3-S7 · Production wiring + demo wallet ops · T+9:30 · ~90 min

```
You are Agent 3 on ScholarKey. Make Privy and the chain work on the Render deploy.

Do: confirm Render env (all vars in contracts §10); Privy allowed origins include the Render URL;
log in on production with the demo registrar email; anchor from production; pnpm check:demo green
against production; sponsor topped up. Write the exact preflight commands into docs/plan/demo.md
(Pre-flight section). Then help A4/A5 with any Privy/chain integration bugs, and run the
code-review skill on your diff since M0.
Commit: "fix(web3): …".
```
