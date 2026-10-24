# ScholarKey — 20-hour build plan

Five people, five AI build agents, one product. This folder is the whole plan:

| File | What it is |
| --- | --- |
| [README.md](README.md) | Rules, timeline, ownership, human setup. **Every agent reads this first.** |
| [contracts.md](contracts.md) | Every shared type, route, schema and format. The glue between agents. |
| [agent-1-design.md](agent-1-design.md) | A1 · Design system, landing, demo university site, polish, submission |
| [agent-2-credential.md](agent-2-credential.md) | A2 · VC/JWT/ES256K, PDF + byte seal, verification pipeline, forgery attacks |
| [agent-3-web3.md](agent-3-web3.md) | A3 · Privy (login, raw-hash signing), contract, JIT gas sponsor, chain reads |
| [agent-4-issuer.md](agent-4-issuer.md) | A4 · DB, onboarding + did.json gate, subscription mock, issuance flow |
| [agent-5-verifier.md](agent-5-verifier.md) | A5 · did:web resolver (SSRF-safe), lookup API, verify portal, privacy receipt, Forgery Lab |
| [demo.md](demo.md) | The 3-minute demo script, pre-flight checklist, fallbacks, Q&A |
| [SESSION.md](SESSION.md) | How every build session runs: Sonnet plans, Haiku implements, Opus reviews |

Product truth: [PRODUCT.md](../../PRODUCT.md). Visual truth: `DESIGN.md`. A1 writes a provisional
version from the built kit at the end of A1-S1 (~T+2:30) and the final one at the end of A1-S3
(~T+5:15). Before T+2:30, use the direction contract in the landing surface brief
(`sh .claude/skills/impeccable/scripts/impeccable surface-brief read src/app/page.tsx`).

**How to run a step:** [SESSION.md](SESSION.md). Sonnet orchestrates and plans, Haiku implements,
Opus reviews. New session per step, kickoff line:
`Run docs/plan/SESSION.md as the orchestrator for agent A<N>.`

---

## What we are building (MVP)

ScholarKey lets a university issue a Certificate of Graduation as a normal PDF that carries a signed
W3C Verifiable Credential. Anyone can verify it in seconds in their own browser, and no server ever
stores the graduate's data.

- **Issuer** (`/issuer`): email login (Privy) → register institution + domain → publish the
  generated `did.json` → issuing unlocks → fill the form → the browser builds the PDF, seals it, signs
  ES256K with the Privy key (no popup), anchors a random ID on Base Sepolia with just-in-time gas
  sponsoring → download.
- **Verifier** (`/verify`): drop the PDF → five checks run in order, in the browser (token → issuer
  key from the university's domain → signature → document seal → public anchor) → verdict + data from
  the signed token + a privacy receipt of what left the browser.
- **Forgery Lab** (`/verify/lab`): one click each to edit the visible diploma, edit the hidden token,
  or forge the university's signature. Each fails at a named check.
- **Landing** (`/`): the story, the trust model, a working drop slot that hands the file to `/verify`.

**Out of scope (decided):** status registry (revoke/reactivate/delete), management dashboard, key
rotation, strict PDF/A-3, real Stripe (mock toggle instead), the objective-9 evaluation suite.

---

## Rules for every agent, every step

1. **Skills: only from this repo's `.claude/skills/`.** Allowed: `impeccable`, `nextjs-16`,
   `react-19`, `tailwind-4`, `typescript`, `zod-4`, `ponytail`, `simplify`, `code-review`,
   `github-pr`. Never invoke user-level or plugin skills (superpowers, etc.), even if your harness
   offers them.
2. **Start of step:** `git pull --rebase`. Read `AGENTS.md` (Next 16 is not the Next you know: read
   the relevant guide in `node_modules/next/dist/docs/` before writing Next code), `PRODUCT.md`, this
   file, `contracts.md`, and your agent file. UI steps also read `DESIGN.md` (or the surface brief +
   `/dev/kit` before it exists) and `.claude/skills/impeccable/reference/craft-floor.md`.
3. **Stay in your lane.** Edit only paths you own (table below). If you need something from another
   agent that isn't ready, code against the stub in `contracts.md` and mock it locally in your own
   files. Never edit their module. Need a contract change? Edit `contracts.md` and the stub in one
   commit and post in chat.
4. **`ponytail` mode is on for all code.** Smallest complete change, no speculative abstractions.
   Leave `shortcut: <limit>, <when to upgrade>` comments on known limits.
5. **Security floor, never cut:** validate every request with zod; never log request bodies; never
   send graduate data to the server; never put PII in URLs, the DB or the chain; SSRF guard on DID
   resolution; secrets only in env.
6. **Gate before every push (all must pass):**
   `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
   UI steps also: run `pnpm dev`, look at the page at 1440 px and 390 px, then run
   `sh .claude/skills/impeccable/scripts/impeccable detect --json <changed UI files>` and fix mechanical findings.
7. **Before committing code** (not docs/tests): run the `simplify` skill on what you changed.
8. **Commit and push:** conventional commit, scope = your area (`feat(credential): …`,
   `fix(verify): …`), `git pull --rebase`, `git push`. Main must stay green: CD deploys every push to
   Render. Never force-push. Never commit `.env*`.
9. **End of step:** post in chat `A<n>-S<m> done` plus anything others must know (new exports,
   contract changes, env vars).
10. **New dependency?** Add it in a separate tiny commit (`chore(deps): add x`) and push it
    immediately so lockfile conflicts stay small. Prefer what A1-S0 already installed.

### Steps and sessions

Each step block in the agent files is the **spec** the orchestrator plans from. It names the goal,
files to read, skills, what to build, how to verify, and the commit message. Run every step through
[SESSION.md](SESSION.md), one fresh session per step. Progress lives in `docs/plan/progress/A<N>.md`.
If a step runs long, stop at a green, pushable point, push, and continue in a new session.

---

## Ownership map

| Area | Owner |
| --- | --- |
| `package.json`, lockfile, `next.config.ts`, `tsconfig.json`, CI, `render.yaml`, `src/lib/env.ts`, `src/app/layout.tsx`, `globals.css`, `src/components/ui/`, `/` landing, `/dev/kit`, `university-site/`, submission files | **A1** |
| `src/lib/credential/`, `public/contexts/` | **A2** |
| `contracts/`, `scripts/contracts/`, `scripts/check-demo.ts`, `src/lib/chain/`, `src/lib/privy/`, `/api/gas/sponsor`, `/dev/privy`, `/api/dev/**` | **A3** |
| `prisma/`, `src/lib/db.ts`, `src/lib/issuer/`, `/issuer/**`, `/api/issuer/**`, `/api/issuance/**`, `public/demo/` | **A4** |
| `src/lib/did/`, `/verify/**`, `/api/verify/lookup` | **A5** |

Shared files edited after S0 (`package.json` for a new dep, `env.ts` for a new var): add lines only,
in a tiny commit, push right away.

---

## Timeline (T+ hours from kickoff)

```
T+0:00 ─ H0 human setup (all)      A1-S0 foundation (everyone else: read plan, docs, skills)
T+0:45 ─ M0  foundation on main → fan out
          A1 design kit · A2 VC/JWT · A3 Privy · A4 DB · A5 did:web
T+2:30 ─ provisional DESIGN.md + /dev/kit (A1-S1) → UI work starts from it
T+4:00 ─ M1  Privy login + raw-hash signature works · contract deployed · JWT+seal round-trips
          · resolver passes SSRF tests · design kit live
T+5:15 ─ final DESIGN.md (A1-S3)
T+9:30 ─ M2  first real diploma issued end-to-end locally and verified on /verify
T+12:00 ─ M3  same on the Render deploy, demo university did.json live · run `code-review`
T+15:00 ─ M4  Forgery Lab, privacy receipt, landing complete
T+17:30 ─ M5  polish/audit done → FEATURE FREEZE at T+18:00
T+18:00–19:00  three full demo rehearsals (demo.md), record backup video
T+19:00–20:00  submission (metadata, description, logo, README), final deploy check
```

| Agent | Step start times (T+) |
| --- | --- |
| A1 | S0 0:00 · S1 0:45 · S2 2:30 · S3 3:15 · S4 5:15 · S5 7:15 · S6 10:30 · S7 12:30 · S8 14:30 · S9 15:30 |
| A2 | S1 0:45 · S2 2:00 · S3 3:30 · S4 5:15 · S5 6:45 · S6 8:00 · S7 12:00 |
| A3 | S1 0:45 · S2 2:15 · S3 3:30 · S4 4:45 · S5 6:00 · S6 7:30 · S7 9:30 |
| A4 | S1 0:45 · S2 2:15 · S3 3:45 · S4 5:30 · S5 6:30 · S6 7:45 · S7 9:30 · S8 11:00 |
| A5 | S1 0:45 · S2 2:00 · S3 3:00 · S4 5:00 · S5 6:30 · S6 8:30 · S7 11:00 |

Gaps between a step's end and the next start are buffer: use them to unblock others, then for the
"If you're ahead" list. After your last step, join demo rehearsals and bug-fixing on your area.

Critical path: **A3-S1/S2 (Privy) → A4-S3 (onboarding) → A4-S6 (issuance) → M2.** If Privy raw-hash
signing fails at A3-S2, stop and tell the whole team immediately (fallback in agent-3).

---

## H0 · Human setup (do in parallel with A1-S0, ~45 min)

| # | Task | Who |
| --- | --- | --- |
| H1 | **Privy:** create app → enable Email login only → Embedded wallets: Ethereum, create on login → turn **off** "confirmation modals" → allowed origins: `http://localhost:3000` + Render URL → copy App ID + App Secret | A3's human |
| H2 | **Postgres:** create a free Neon (or Render Postgres) DB → `DATABASE_URL` (pooled) | A4's human |
| H3 | **RPC:** Alchemy app on Base Sepolia → `BASE_SEPOLIA_RPC_URL` (fallback `https://sepolia.base.org`) | A3's human |
| H4 | **Sponsor wallet:** after A3 generates the key (first minutes of A3-S1), fund it with ≥0.05 Base Sepolia ETH from the Coinbase CDP / Alchemy faucets | A3's human |
| H5 | **Render:** mirror the repo to a personal GitHub (see root README) → Blueprint → web service + the `university-site` static site (A1-S2 adds it to `render.yaml`) → set env vars → add GitHub secrets for CD | A1's human |
| H6 | Share all env values in a private channel. Each dev creates `.env.local` from `.env.example` | everyone |

The demo university is fictional: **Universidad Waraira (demo institution)**, served from its own
domain (`waraira-university.onrender.com` or whatever Render assigns). Label it as a demo everywhere.

---

## Judging criteria → what earns it

| Criterion | Weight | Where we earn it |
| --- | --- | --- |
| Technical | 25% | VC 2.0 JWT (ES256K) via Privy raw-hash signing · SSRF-guarded did:web · byte-range PDF seal · issuer-keyed anchor contract · JIT gas with OP-stack L1 fee · fully client-side verification |
| Impact | 20% | Degree recognition for the diaspora, credential fraud, GDPR/FERPA by construction, free verification for anyone |
| Originality | 15% | The visual world (see DESIGN.md) · Forgery Lab · privacy receipt that *proves* the server is blind |
| Ambition | 20% | Full issuer → holder → verifier ecosystem: chain, WaaS, sponsorship, DIDs, in 20 h |
| Execution | 20% | Deployed, polished, live demo with no wallet popups, works on a judge's laptop (sample diploma + lab) |

---

## If you're ahead (stretch, only after M4)

- Contract source verified on BaseScan via Sourcify (A3).
- Visible-text cross-check: extract the PDF text with pdf.js and diff it against the signed claims (A2/A5).
- QR on the PDF opens `/verify` on a phone. Make sure mobile verify works (A5).
- A second demo institution with an impostor domain to show "domain is the root of trust" (A4/A5).
