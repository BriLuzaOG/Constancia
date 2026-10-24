# Human guide: where your input is needed

The agents build alone. This page lists what only a person can do, and when.

## 🚦 Quick rules

- Agents stop and ask you only for: a contract change, a security trade-off, a conflict outside
  their own paths, or anything destructive in git. Answer, then tell the session `resume`.
- Never commit `.env*`. Share real values in a private channel; each dev keeps them in `.env.local`.
- One checkout per session (see `PARALLEL.md`), each copy needs its own `.env.local`.

## 🔑 Env values

Template: `.env.example`. Local defaults (memory ledger, demo mode on) run the app with no values.

| Var | Side | Who provides it | When |
| --- | --- | --- | --- |
| `DATABASE_URL` | server | A4's human: free Neon or Render Postgres, **pooled** URL | before A4-S1 migrates |
| `SESSION_SECRET` | server | A4: `openssl rand -base64 32` | before A4 auth works |
| `RELAYER_PRIVATE_KEY` | server | A3: throwaway key with no funds | chain mode only |
| `LEDGER_RPC_URL` | server | A3 after the network is up (HTTPS, proxied to the VPS) | M3 |
| `LEDGER_CONTRACT_ADDRESS`, `LEDGER_DEPLOY_BLOCK` | server | printed by `pnpm chain:deploy` | M3 |
| `NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS` | client | printed by `pnpm chain:deploy` | M3 |
| `NEXT_PUBLIC_APP_URL` | client | the Render URL | after the first deploy |
| `LEDGER_MODE`, `NEXT_PUBLIC_LEDGER_MODE` | both | `memory` locally, `chain` on Render (memory is refused in production) | M3 |
| `NEXT_PUBLIC_DEMO_MODE` | client | `1` shows demo identity pages and `/ledger/operator` | demo |

On Render set every variable in the dashboard. After changing a `NEXT_PUBLIC_*` value, redeploy
(it is inlined at build time).

## 🏗️ Infrastructure tasks (README H0)

| Task | Who | Needed by |
| --- | --- | --- |
| Linux VPS (4 vCPU, 8 GB, Docker, ports 80/443, hostname) or a laptop behind a Cloudflare Tunnel | A3's human | A3 chain lane |
| Docker and Foundry on every machine that touches contracts or the network | A3's human | A3-S1, S3, S4 |
| Postgres `DATABASE_URL` | A4's human | A4-S1 |
| Mirror the repo to a personal GitHub, create the Render Blueprint, set env vars, add the CD secrets | A1's human | before the first deploy |
| Three Chrome profiles: Registrar, Holder, Recruiter (incognito), zoom 125 % | presenter's team | rehearsals |

## ✋ Decisions waiting for you

- **Render URL:** once deployed, put it in `deploy-url` (`platanus-hack-project.jsonc`) and in the
  README "Deploy" line (both still say `<FILL THIS>`), and set `NEXT_PUBLIC_APP_URL`.
- **Contract changes:** an agent asking to change `contracts.md` affects every lane: decide, then
  have it update `contracts.md` and the stub in one commit.
- **Account abstraction go/no-go (about T+4:45):** if A3 reports "AA is on fallback", read the
  contracts §7 trade-off and confirm.
- **Cut list:** if a lane runs behind, cut in the order given in `README.md` ("If we run behind").

## 🧩 After the six lanes report done (about 30 min)

1. `git pull`, then `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
2. Run the product locally on `LEDGER_MODE=memory` through `demo.md`'s flow and list what breaks.
3. Switch to `LEDGER_MODE=chain` against the network once A3's chain lane is up (M3).
4. Hand the break list back to the owning lane:
   `Run docs/plan/SESSION.md as the orchestrator for agent A<N>, resume, fix: <list>`.
5. Run A1's carry-over backlog (bottom of `agent-1-design.md`): the ledger fixture swap, the visual
   pass and design audit, and the final submission fields.

## 🎬 Demo day

- T−15 and T−2: run `pnpm check:demo`.
- Keep the demo-pack files and the backup video at hand; browsers signed in per `demo.md`.
- Fallback order: phone hotspot, the laptop-hosted network, the backup video.
