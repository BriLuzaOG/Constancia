# Parallel autopilot: minimal product, six sessions

Goal: a working Constancia (request → issue → deliver → share → verify, Verified CV, Fake Letter Lab,
revoke, `/ledger`) with the least ceremony. Implementation first, no test or review overhead.
M0 is done (A1-S0 on main), so all six sessions start now.

## For the human

1. **One checkout per session.** Sessions sharing one folder would see each other's uncommitted
   files (SESSION.md stops on a dirty tree) and overwrite each other. From the folder that holds the
   repo:
   ```
   for n in a1 a2 a3-chain a3-ts a4 a5; do
     git clone "$(git -C platanus-hack-26-ve-team-24 remote get-url origin)" ../lane-$n && (cd ../lane-$n && pnpm install)
   done
   ```
   Copy your `.env.local` into each. Each session pushes to `main` from its own clone.
2. Open **six terminals**, one per `lane-*` clone, each `claude --model sonnet` (or `/model sonnet`),
   and paste that lane's prompt below. Order doesn't matter.
3. Each session works through its list alone, pushing to `main` after every step, and stops when the
   list is done or a stop-and-ask case hits. Watch for those, answer, and tell the session `resume`.
4. Needs from you in parallel (README H0): a Postgres `DATABASE_URL` (A4), Docker + Foundry on the
   machine that runs the chain lane (A3), a VPS or laptop for the network, Render env vars (A1).
   Everything else works locally on the memory ledger.

## Autopilot rules (every prompt below applies them; they override SESSION.md where they differ)

- Follow `docs/plan/SESSION.md` §1 Orient, §2 Plan and §3 Implement for **every step in the lane
  list**, one after another, without waiting for a human. Keep dispatching to the `implementer`
  subagent (no model override). Hard steps: you write the core yourself, as SESSION.md says.
- **Skip:** the reviewer, the simplify pass, UI screenshots and the impeccable detector, writing
  tests beyond what a step needs to prove a pure function (keep security-floor tests only).
- **Gate before each push:** `pnpm typecheck && pnpm build`. Add `pnpm lint` if it is cheap.
- **Commit and push after each step** with the step's commit message. Append the step to
  `docs/plan/progress/A<N>.md` in the same commit. Pull with `--rebase` first; on a conflict inside
  your own paths resolve it, anywhere else stop and ask.
- **Dependencies:** never wait idle. Check for `not implemented: A<n>-S<m>`; if another lane isn't
  there yet, code against the stub and a local mock in your own files (README rule 3). If your next
  step can't produce anything without it, do the next step in your list that can, then come back. If
  nothing is left, `git pull --rebase`, `sleep`-poll in the background with Monitor every few
  minutes, and continue when it lands.
- **Rules that never relax:** README rules 1 (only repo skills), 3 (own paths only), 4 (ponytail), 5
  (security floor), 11 (no Web3 words for humans), 12 (no data-protection laws). Never force-push,
  never commit `.env*`.
- **UI quality** still follows `DESIGN.md` direction and the primitives in `src/components/ui`, but
  with no screenshots: build it faithfully from the kit.
- **Contract changes:** stop and ask the human (it affects other lanes).
- At the end, post the done line from SESSION.md §9 for the last step and a list of anything
  deferred.

## Lane lists (minimal product = [M] steps that the demo needs)

| Lane | Steps in order | Skipped (stretch, polish) |
| --- | --- | --- |
| A1 | S1, S2, S3, S9 | S4, S5, S6, S7, S8 |
| A2 | S1, S2, S3, S4, S5, S6, S7 | S8 |
| A3 chain | S1, S3, S4, then S7 chain parts (deploy, seed), S8 | |
| A3 ts | S2, S5, S6, S7 TS parts | |
| A4 | S1, S2, S3, S4, S5, S6 (revoke only), S7 | S8, team keys |
| A5 | S1, S2, S3, S4, S5, S6 | S7 |

A1-S2 has no screenshot review in this mode, but must still produce the final `DESIGN.md` through the
documenter (SESSION.md "DESIGN.md steps"), because it is regenerated from the built code.

---

## Prompt · A1 (design, landing, `/ledger`, submission)

```
Run docs/plan/SESSION.md as the orchestrator for agent A1 in AUTOPILOT mode: follow
docs/plan/PARALLEL.md "Autopilot rules". A1-S0 is already done. Do these steps in order, each
committed and pushed before the next: A1-S1, A1-S2, A1-S3, then A1-S9. Skip A1-S4 to S8. For
A1-S3 plan against the memory ledger (fetchNetworkState stub: mock it locally until A3-S2 lands,
then switch to the real client). When A1-S9 is pushed, stop and report what shipped and what is
deferred.
```

## Prompt · A2 (credential library and `/verify`)

```
Run docs/plan/SESSION.md as the orchestrator for agent A2 in AUTOPILOT mode: follow
docs/plan/PARALLEL.md "Autopilot rules". Do these steps in order, each committed and pushed before
the next: A2-S1, A2-S2, A2-S3, A2-S4, A2-S5, A2-S6, A2-S7. Skip A2-S8. Hard steps (S1, S5): write the
core yourself, implementer does the mechanical parts. The ledger lookup comes from A3: until A3-S2
is on main, inject a local fake LookupFn in your own files. A2-S7 swaps in the real ledger: if A3
chain mode isn't ready, finish what works on the memory ledger and note it. Stop when A2-S7 is
pushed and report.
```

## Prompt · A3 chain lane (network, contracts, account abstraction)

```
Run docs/plan/SESSION.md as the orchestrator for agent A3, lane "chain", in AUTOPILOT mode: follow
docs/plan/PARALLEL.md "Autopilot rules". Another session runs A3's TypeScript lane in parallel
(src/lib/ledger/**, src/app/api/**): do NOT touch those paths. You own docker/ledger/, contracts/,
scripts/chain/ and scripts/check-demo.ts. Do in order, each committed and pushed: A3-S1, A3-S3,
A3-S4, then the chain parts of A3-S7 (deploy and seed scripts) and A3-S8. A3-S3 is a hard step with
a go/no-go: if P-256 account abstraction cannot pass, take the AA-lite fallback in contracts §7 and
tell the human before continuing. Docker and Foundry must exist on this machine: if they don't,
stop and ask the human to install them. Record progress in docs/plan/progress/A3.md (the lane
sessions share it: add rows only, pull --rebase before each edit).
```

## Prompt · A3 TypeScript lane (memory ledger, gateway, clients)

```
Run docs/plan/SESSION.md as the orchestrator for agent A3, lane "ts", in AUTOPILOT mode: follow
docs/plan/PARALLEL.md "Autopilot rules". Another session runs A3's chain lane (docker/ledger,
contracts, scripts/chain): do NOT touch those paths. You own src/lib/ledger/**, src/app/api/ledger,
api/did, api/bundler, api/dev, src/app/dev/identity and public/demo. Do in order, each committed and
pushed: A3-S2 first and fast (every other lane is building against your memory ledger and gateway),
then A3-S5, A3-S6 and the TypeScript parts of A3-S7. S5 and S6 need the deployed contract and ABI
from the chain lane: until they land on main (check contracts/ and scripts/chain/), write against
the ILedger interface in contracts.md §6 and the account interface in §7, and wire the real
addresses when they appear. Record progress in docs/plan/progress/A3.md (add rows only, pull
--rebase before each edit).
```

## Prompt · A4 (database, mailbox, employer console)

```
Run docs/plan/SESSION.md as the orchestrator for agent A4 in AUTOPILOT mode: follow
docs/plan/PARALLEL.md "Autopilot rules". Do these steps in order, each committed and pushed before
the next: A4-S1, A4-S2, A4-S3, A4-S4, A4-S5, A4-S6 (revoke only, skip team keys), A4-S7. Skip A4-S8.
A4-S5 is a hard step: write the core yourself. DATABASE_URL: if .env.local has none, run Postgres
locally if Docker is available, else stop and ask the human for a Neon URL. Until A2 (issue, keys)
and A3 (ledger, account client) are on main, code against their stubs and local mocks in your own
files. Stop when A4-S7 is pushed and report.
```

## Prompt · A5 (holder vault, CV, Lab)

```
Run docs/plan/SESSION.md as the orchestrator for agent A5 in AUTOPILOT mode: follow
docs/plan/PARALLEL.md "Autopilot rules". Do these steps in order, each committed and pushed before
the next: A5-S1, A5-S2, A5-S3, A5-S4, A5-S5, A5-S6. Skip A5-S7. You depend on A2 (keys, share
crypto, present, verify, passport, attacks), A4 (/api/requests, /api/shares) and A3 (ledger lookup):
until each is on main, code against its stub and a local mock in your own files and swap to the
real one as soon as `rg "not implemented: A<n>" src` stops matching. Stop when A5-S6 is pushed and
report.
```

---

## When all six report done (human, ~30 min)

1. `git pull`, then `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
2. Run the product locally on `LEDGER_MODE=memory` through demo.md's flow; list what breaks.
3. Switch to `LEDGER_MODE=chain` against the network once A3's chain lane is up (M3).
4. Hand the break list back to the owning lane as a fresh step: `Run docs/plan/SESSION.md as the
   orchestrator for agent A<N>, resume, fix: <list>`.
