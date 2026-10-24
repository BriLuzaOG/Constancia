# Constancia — build plan

Five people, five AI build agents, one product. **This replaces the earlier ScholarKey plan
entirely.** This folder is the whole plan:

| File | What it is |
| --- | --- |
| [README.md](README.md) | Rules, timeline, ownership, human setup, risks. **Every agent reads this first.** |
| [contracts.md](contracts.md) | Every shared type, route, schema and format. The glue between agents. |
| [agent-1-design.md](agent-1-design.md) | A1 · Pivot foundation, design kit, landing, `/ledger`, polish, submission |
| [agent-2-credential.md](agent-2-credential.md) | A2 · Keys, SD-JWT VC, presentation, verification pipeline, Verified CV, attacks, `/verify` |
| [agent-3-ledger.md](agent-3-ledger.md) | A3 · Consortium network, contracts, account abstraction, bundler, ledger reads and client |
| [agent-4-employer.md](agent-4-employer.md) | A4 · DB, blind mailbox, key sign-in, employer console, requests, issuing, revoking |
| [agent-5-holder.md](agent-5-holder.md) | A5 · Vault, requests, share builder, Verified CV portal, Fake Letter Lab |
| [demo.md](demo.md) | The 3-minute demo script, pre-flight checklist, fallbacks, Q&A |
| [SESSION.md](SESSION.md) | How every build session runs: Sonnet plans, Haiku implements, Opus reviews |
| [PARALLEL.md](PARALLEL.md) | Autopilot: six parallel sessions, minimal product, ready-to-paste prompts |

Product truth: [PRODUCT.md](../../PRODUCT.md). Visual truth: `DESIGN.md` (the Chromatic Interference
world, built and kept; A1-S0 renames it and A1-S1/S2 extend it).

**How to run a step:** [SESSION.md](SESSION.md). New session per step, kickoff line:
`Run docs/plan/SESSION.md as the orchestrator for agent A<N>.`

---

## What we are building

Employment letters ("constancias de trabajo") are faked in minutes. Constancia turns them into
credentials that prove themselves and show only what the holder chooses.

- **Employer** (`/employer`): HR creates an organization account on a device key (no wallet, no gas),
  applies to the consortium, and once a quorum of members approves, issues certificates when an
  employee requests one. Each certificate is anchored on a consortium ledger and can be revoked.
- **Holder** (`/vault`, `/cv`): the employee asks an employer for a certificate, receives it encrypted
  to a key made for that request, and shares **one fact at a time** (employed ✓, income band,
  title…) by link or QR. `/cv` attaches many certificates and joins them into a **Verified CV**, one
  sealed file with the whole history.
- **Verifier** (`/verify`): open the link, five checks run in the browser, and only the claims the
  holder chose appear, with the exact count of what stays hidden. `/verify/lab` lets anyone try four
  forgeries and watch each fail at a named check.
- **Consortium** (`/ledger`): the public page of the network: four validators, blocks rotating
  between proposers, members, accredited employers, anchored hashes. `/ledger/operator` lets demo
  members approve an employer.

**Out of scope (decided):** identity proofing of employees, HRIS/payroll integrations, a native app,
holder multi-device recovery, true zero-knowledge predicates (BBS+/ZK), validator governance UI,
Merkle batching of anchors, paymasters, ERC-1271, federation between consortia, a printable PDF
(stretch X1), challenge mode (stretch X2), pricing or subscriptions.

### What changed from the ScholarKey plan

| Before | Now |
| --- | --- |
| Graduation diploma PDF with a byte-range seal | Employment certificate as an SD-JWT VC. No PDF (printable letter = stretch) |
| JWT ES256K, Privy raw-hash signing | SD-JWT with selective disclosure, ES256 device keys (WebCrypto) |
| `did:web`, trust root is the institution's domain | `did:constancia` resolved from the ledger. Trust root = accreditation by a quorum of consortium members |
| Base Sepolia anchor, just-in-time gas sponsor | Besu QBFT consortium ledger, 4 validators, zero gas, ERC-4337 accounts, no paymaster |
| Email login through Privy | Sign in by signing a challenge with the device key |
| Subscription mock gates issuing | Accreditation gates issuing |
| Issuer builds the PDF and hands it over | Holder requests, employer issues, delivery is end-to-end encrypted |
| Forgery Lab, 3 attacks | Fake Letter Lab, 4 attacks, plus a live revoke for the 5th check |
| Demo university site on its own domain | Gone. Demo employers are accredited on the ledger |
| Design system, line-field world, primitives, `/dev/kit` | **Kept** |

### Decisions made while rewriting (override any of them in chat)

1. **Name: Constancia** (from "constancia de trabajo"). Change it with one search-and-replace.
2. **Request flow is holder-initiated** and the holder creates a **fresh key pair per request**, so
   each certificate is a new credential with its own hash and key.
3. **The join is a "Verified CV"**: a file of normal presentations where every certificate key signs
   the hash of the whole set (contracts §4.4). No portal-held key, no server, nothing to trust.
4. **Consortium = Besu QBFT**, four validators in docker compose on one VPS, zero gas.
5. **Account abstraction = our own small P-256 account contract + factory + a trivial bundler route**
   inside Next, on the canonical EntryPoint v0.7. A time-boxed spike decides, with a named fallback.
6. **W3C VC Data Model 2.0 payload secured with SD-JWT**, ES256, W3C DID document from a custom
   `did:constancia` method.
7. **Selective disclosure, not zero-knowledge.** We say so ourselves (contracts §12).
8. **UI stays English**; the pitch is Spanish.
9. **Time:** assumes about 14 h remain (hackathon start + 20 h ≈ Sunday 07:00 local). T+0 ≈ 16:30.
   If the real deadline differs, move the freeze to `deadline − 3 h` and cut from the list below.

---

## Rules for every agent, every step

1. **Skills: only from this repo's `.claude/skills/`.** Allowed: `impeccable`, `nextjs-16`,
   `react-19`, `tailwind-4`, `typescript`, `zod-4`, `ponytail`, `simplify`, `code-review`,
   `github-pr`. Never invoke user-level or plugin skills (superpowers, etc.), even if your harness
   offers them.
2. **Start of step:** `git pull --rebase`. Read `AGENTS.md` (Next 16 is not the Next you know: read
   the relevant guide in `node_modules/next/dist/docs/` before writing Next code), `PRODUCT.md`, this
   file, `contracts.md`, and your agent file. UI steps also read `DESIGN.md` and
   `.claude/skills/impeccable/reference/craft-floor.md`.
3. **Stay in your lane.** Edit only paths you own (table below). If you need something from another
   agent that isn't ready, code against the stub in `contracts.md` and mock it locally in your own
   files. Never edit their module. Need a contract change? Edit `contracts.md` and the stub in one
   commit and post in chat.
4. **`ponytail` mode is on for all code.** Smallest complete change, no speculative abstractions.
   Leave `shortcut: <limit>, <when to upgrade>` comments on known limits.
5. **Security floor, never cut:**
   - zod at every request boundary; never log a request body;
   - the server only ever sees **ciphertext, public keys, hashes and an opaque employee number**.
     No claim, name, national ID or plaintext certificate in the DB, a URL, a log or the ledger;
   - share and delivery keys live in a URL **fragment** or the holder's vault, never in a query or
     a server;
   - browser keys are **non-extractable** WebCrypto keys; only the seed script and tests ever hold
     an extractable private key;
   - the ledger gateway answers an allowlist of read calls only; the bundler caps op size and rate;
   - the memory ledger refuses `NODE_ENV=production`;
   - secrets only in env.
6. **Gate before every push (all must pass):**
   `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
   UI steps also: run `pnpm dev`, look at the page at 1440 px and 390 px, then run
   `sh .claude/skills/impeccable/scripts/impeccable detect --json <changed UI files>` and fix mechanical findings.
7. **Before committing code** (not docs/tests): run the `simplify` skill on what you changed.
8. **Commit and push:** conventional commit, scope = your area (`feat(credential): …`,
   `fix(verify): …`), `git pull --rebase`, `git push`. Main must stay green: CD deploys every push to
   Render. Never force-push. Never commit `.env*` or `demo-pack/`.
9. **End of step:** post in chat `A<n>-S<m> done` plus anything others must know (new exports,
   contract changes, env vars).
10. **New dependency?** Add it in a separate tiny commit (`chore(deps): add x`) and push it
    immediately so lockfile conflicts stay small.
11. **No Web3 words for humans.** In employer and holder flows never write "wallet", "gas", "seed
    phrase", "transaction" or "UserOp". Say "signing key on this device", "written to the ledger".
    The consortium and the ledger are product concepts and may be named. Technical-details
    disclosures can name anything.
12. **Never mention data-protection laws or regulations** anywhere: UI, docs, README, pitch.

### Steps and sessions

Each step block in the agent files is the **spec** the orchestrator plans from. It names the goal,
files to read, skills, what to build, how to verify, and the commit message. Run every step through
[SESSION.md](SESSION.md), one fresh session per step. Progress lives in `docs/plan/progress/A<N>.md`.
If a step runs long, stop at a green, pushable point, push, and continue in a new session.
Steps are tagged **[M]** must, **[S]** should, **[X]** stretch.

---

## Ownership map

| Area | Owner |
| --- | --- |
| `package.json`, lockfile, `next.config.ts`, `tsconfig.json`, CI, `render.yaml`, `src/lib/env.ts`, `src/lib/handoff.ts`, `src/app/layout.tsx`, `globals.css`, `src/components/ui/`, `/` landing, `/dev/kit`, `/ledger/**`, submission files | **A1** |
| `src/lib/credential/`, `public/contexts/`, `/verify` (page, `_components`, `_lib`) | **A2** |
| `docker/ledger/`, `contracts/`, `scripts/chain/`, `scripts/check-demo.ts`, `src/lib/ledger/`, `/api/bundler`, `/api/ledger/**`, `/api/did/**`, `/api/dev/**`, `/dev/identity`, `public/demo/` | **A3** |
| `prisma/`, `src/lib/server/`, `src/lib/employer/`, `/employer/**`, `/api/auth/**`, `/api/requests/**`, `/api/employer/**`, `/api/shares/**` | **A4** |
| `src/lib/vault/`, `/vault/**`, `/cv/**`, `/verify/lab/**` | **A5** |

Shared files edited after S0 (`package.json` for a new dep, `env.ts` for a new var): add lines only,
in a tiny commit, push right away.

---

## Timeline (T+ hours from kickoff, T+0 ≈ 16:30)

```
T+0:00 ─ H0 human setup (all)   A1-S0 pivot foundation   A3-S1 starts (docker/ only, no repo deps)
T+1:00 ─ M0  pivot on main → fan out
T+3:00 ─ M1  SD-JWT issue + present round-trips · memory ledger + gateway routes · DB + mailbox routes
          · vault keys + request flow · consortium network up locally and on the VPS
T+4:45 ─ A3 GO / NO-GO: a P-256 device key's UserOp lands on the network at zero fee
          (else the AA-lite fallback, announced to the whole team)
T+7:15 ─ M2  the whole product runs on the memory ledger: request → issue → deliver → share →
          verify (five checks) → verified CV model. Local only
T+8:30 ─ M3  real ledger swapped in (LEDGER_MODE=chain): same flow on the Render deploy
T+10:00 ─ M4  Verified CV · Fake Letter Lab · revoke · /ledger and /ledger/operator complete
T+11:30 ─ M5  polish and audit done → FEATURE FREEZE
T+11:30–13:30  three full demo rehearsals (demo.md), record the backup video
T+13:30–14:30  submission (metadata, description, logo, README), final deploy check
```

| Agent | Step start times (T+) |
| --- | --- |
| A1 | S0 0:00 · S1 1:00 · S2 2:00 · S3 4:00 · S4 6:00 · S5 7:15 · S6 7:45 · S7 9:15 · S8 10:45 · S9 11:30 |
| A2 | S1 1:00 · S2 2:15 · S3 3:30 · S4 4:45 · S5 6:30 · S6 7:45 · S7 8:30 · S8 10:00 |
| A3 | S1 0:00 · S2 1:30 · S3 2:30 · S4 4:45 · S5 5:45 · S6 6:45 · S7 8:15 · S8 9:45 |
| A4 | S1 1:00 · S2 2:15 · S3 3:15 · S4 4:30 · S5 5:30 · S6 7:15 · S7 8:30 · S8 9:30 |
| A5 | S1 1:00 · S2 2:45 · S3 4:30 · S4 6:30 · S5 8:00 · S6 9:00 · S7 10:15 |

Gaps between a step's end and the next start are buffer: use them to unblock others. After your last
step, join rehearsals and bug-fixing on your area.

**Critical path:** A3-S3 (account abstraction spike) → A3-S4/S5/S6 (ledger and client) → M3. Until M3
everyone builds and tests against the **memory ledger** (A3-S2), which has the same interface and
semantics, so nobody waits on the chain. If the spike fails at the go/no-go, tell the whole team at
once and switch to the AA-lite fallback (contracts §7).

### If we run behind, cut in this order

1. X2 challenge mode, X1 printable letter, the validator-kill demo beat.
2. Team keys UI (`/employer/team`) and the issued-list polish.
3. `/ledger/operator` UI (approve with `scripts/chain/seed.ts` instead).
4. Landing below the fold (keep the first viewport).
5. Lab attacks 3 and 4.

Never cut: request → issue → deliver, share with hidden claims, the five checks, revoke, the real
ledger (M3), the `/ledger` page.

---

## H0 · Human setup (do in parallel with A1-S0, ~60 min)

| # | Task | Who |
| --- | --- | --- |
| H1 | **Consortium host:** a Linux VPS, ≥ 4 vCPU and 8 GB RAM, Docker and Docker Compose, ports 80/443 open, a hostname (or a Cloudflare Tunnel). Give A3 SSH access. **Fallback:** run the same compose on one team laptop behind a Cloudflare Tunnel | A3's human |
| H2 | **Postgres:** a free Neon (or Render Postgres) database → `DATABASE_URL` (pooled) | A4's human |
| H3 | **Foundry** (`curl -L https://foundry.paradigm.xyz \| bash`, then `foundryup`) and Docker on every machine that touches contracts or the network | A3's human |
| H4 | **Render:** mirror the repo to a personal GitHub (see root README) → Blueprint → the web service → set env vars → GitHub secrets for CD. The static `waraira-university` service is gone: remove it from the blueprint | A1's human |
| H5 | **Secrets:** A3 generates `RELAYER_PRIVATE_KEY` (a throwaway key with no funds), A4 generates `SESSION_SECRET`. Share everything in a private channel; each dev creates `.env.local` from `.env.example` | everyone |
| H6 | **Demo browsers:** three Chrome profiles named Registrar, Holder and Recruiter (the recruiter one in incognito), zoom 125 % | the presenter's team |

The demo employers, members and employees are fictional ("Empresa Demo A", "Banco Demo", …). Label
them as demos everywhere and never use a real company's name.

---

## Risks and fallbacks

| Risk | We know by | Fallback |
| --- | --- | --- |
| The 4-node network will not stabilise, or the VPS is too small | A3-S1, T+1:30 | tune `-Xmx`, move to an 8 GB host, else run it on a laptop behind a tunnel |
| Account abstraction rejects zero gas, or P-256 verify blows the gas limit | A3-S3, T+4:45 | give the EntryPoint a funded deposit and a 1-wei price; else AA-lite (relayer submits `execute(op, signature)`); announce it |
| The SD-JWT library does not fit our nested `credentialSubject` or the CV seal | A2-S1, T+1:20 | hand-roll the ~200 lines (contracts §4.2 lists the exact mechanics) |
| Non-extractable device keys are lost with browser data | demo prep | `demo-pack` re-import through `/dev/identity` and `/vault/import`; keep copies in the team drive |
| Render ↔ VPS latency or an outage on demo day | pre-flight | phone hotspot, the laptop-hosted network, then the backup video |
| Everything behind the schedule | M2 at T+7:15 | use the cut list above, in order |

---

## Judging criteria → what earns it

| Criterion | Weight | Where we earn it |
| --- | --- | --- |
| Technical | 25% | SD-JWT VC with selective disclosure and key binding · a Verified CV sealed by every certificate key · QBFT consortium ledger with zero gas · ERC-4337 accounts on P-256 device keys with no paymaster · fully client-side verification |
| Impact | 20% | Employment letters are forged constantly and trusted anyway; the diaspora, banks, landlords and consulates all depend on them; the holder reveals less, not more |
| Originality | 15% | The Verified CV join · "prove one fact, reveal nothing else" · five forgeries, five named checks · a consortium of employers and institutions instead of one company or a public chain |
| Ambition | 20% | Employer → holder → verifier ecosystem with its own consortium network, account abstraction, accreditation governance, revocation and CV joining, in 14 h |
| Execution | 20% | Deployed, polished, a live 3-minute demo with no wallet popups, a lab any judge can run on their own laptop |

---

## If you're ahead (stretch, only after M4)

- **X1** Printable letter: PDF with the chosen claims and a QR to the share link (A2, re-add `pdf-lib`).
- **X2** Challenge mode: the verifier shows a nonce QR, the holder answers, no replay (A2/A5).
- Kill one validator on stage and show the chain keep producing blocks (A3, A1 on `/ledger`).
- Read from several member nodes and require agreement (A3).
- Multi-owner recovery for holders (A3/A5).
