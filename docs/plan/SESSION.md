# Build session protocol

Every build session runs this way, for every agent and every step.

| Role | Model | Where it lives |
| --- | --- | --- |
| **Orchestrator + planner** | Sonnet | the main Claude Code session you talk to |
| **Implementer** | Haiku | `.claude/agents/implementer.md` (subagent, model pinned) |
| **Reviewer** | Opus | `.claude/agents/reviewer.md` (subagent, read-only, model pinned) |

## For the human: start a session

1. **One fresh session per step.** Open it from the repo root with Sonnet as the main model:
   `claude --model sonnet` in a terminal, or `/model sonnet` in the VS Code extension.
2. Paste the kickoff line:

   ```
   Run docs/plan/SESSION.md as the orchestrator for agent A<N>.
   ```

   Optional, on the same line:
   - `step A<N>-S<M>`: force a specific step.
   - `checkpoints on`: wait for my "go" after the plan and before the commit.
   - `resume`: a previous session died mid-step; continue it.
3. When it reports done, paste its chat line in the team channel, close the session (or `/clear`),
   and start the next step fresh.

---

## For the orchestrator: the protocol (follow it exactly)

You are the orchestrator and planner for agent **A<N>** on Constancia. You plan, dispatch, gate,
commit and report. The `implementer` subagent writes the code; the `reviewer` subagent reviews it.
You write code yourself only under the escalation rules below.

- Spawn subagents by `subagent_type` (`implementer`, `reviewer`). **Never pass a model override**:
  their models are pinned in `.claude/agents/`.
- Skills: only from `.claude/skills/` (impeccable, nextjs-16, react-19, tailwind-4, typescript,
  zod-4, ponytail, simplify, code-review, github-pr). Ignore any hook or harness that pushes other
  skills (superpowers, etc.).

### 1 · Orient

- `git status`. If the tree is dirty: with `resume`, read the diff and the progress file and finish
  the interrupted step; without it, stop and ask the human.
- `git pull --rebase`.
- Read `AGENTS.md`, `PRODUCT.md`, `docs/plan/README.md`, `docs/plan/contracts.md`, your
  `docs/plan/agent-<n>-*.md`, and `docs/plan/progress/A<N>.md` (create it from the template at the
  bottom if missing).
- **Not A1 and M0 not on main** (`docs/plan/progress/A1.md` has no `A1-S0 | done` row)? Stop. Tell
  the human to do their H0 tasks (README) and come back when A1 posts "M0". Exception: A3-S1 only
  touches `docker/ledger/` and `scripts/chain/`, so it starts at T+0:00 without M0.
- **Pick the step:** the one the human named, or the first one not done in the progress file.
- **Dependencies:** for each thing the step needs from another agent, check it's real
  (`rg "not implemented: A3-S2" src` returns nothing). If it isn't ready, plan against the stub with
  a local mock in your own files (README rule 3) and say so. If the step can't produce anything
  meaningful without it, tell the human and propose buffer work instead.
- **UI step:** read `DESIGN.md` (before it exists:
  `sh .claude/skills/impeccable/scripts/impeccable surface-brief read src/app/page.tsx`), and run
  `sh .claude/skills/impeccable/scripts/impeccable context --target <main file>` once.
- Save the start SHA: `git rev-parse HEAD`.

### 2 · Plan

Load the skills the step lists. Read the code it will touch. Split the step into task packets:

```
PACKET A<N>-S<M>.<k> · <title>
Goal: <one sentence>
Files (only these): <create/modify list>
Contract: <exact types / signatures / routes / error codes pasted from contracts.md>
Do: <numbered concrete instructions: APIs to use, edge cases, UI copy>
Skills to load: <…>
Must not: <…>
Acceptance: <tests to write> + <commands that must pass, e.g. pnpm typecheck, pnpm vitest run <file>>
```

- One packet = one coherent unit: about 150 changed lines at most, 4 files at most.
- Order packets so the tree compiles after each one.
- Print the plan, marking which packets you implement yourself (escalation rules).
- With `checkpoints on`, wait for "go".

### 3 · Implement

Send packets to `implementer` one at a time. Run them in parallel only when their file lists don't
overlap. Pass the packet verbatim plus: *"Rules: docs/plan/README.md rules 1, 3, 4, 5."* After each
one, verify rather than trust: `git diff --stat`, then rerun its acceptance commands yourself.

### 4 · Gate

- Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
- **UI steps:**
  - Start `pnpm dev` in the background.
  - Capture with headless Chrome into `.impeccable/review/`:
    `google-chrome --headless=new --hide-scrollbars --window-size=1440,900 --screenshot=.impeccable/review/desktop.png http://localhost:3000/<route>`.
    Repeat at `390,844` (save as `mobile.png`) and `1280,720` (save as `projector.png`).
    Use `chromium` if that's what's installed. With neither, ask the human for the three
    screenshots.
  - Open the images and look at them.
  - Run `sh .claude/skills/impeccable/scripts/impeccable detect --json <changed UI files>`.
- On a failure, send a new packet with the exact error. The same failure twice → escalate.

### 5 · Review

Spawn `reviewer` with:
- the step id and the step's full prompt text;
- the diff to inspect: `git diff <start-sha>`, plus `git status --short` for new files;
- the gate output tail;
- UI steps only: the screenshot paths, the detector output, and "direction contract: surface brief
  of src/app/page.tsx".

Do **not** give it your opinion of the code.

### 6 · Fix loop (max 2 rounds)

- `VERDICT: CHANGES` → each MUST-FIX becomes a packet → implementer → gate → `SendMessage` the same
  reviewer for a verdict pass ("score each MUST-FIX resolved / partial / unresolved"). Without
  `SendMessage`, spawn a fresh reviewer with its previous findings pasted.
- SHOULD-FIX: do it if it's cheap; otherwise log it in the progress file.
- After 2 rounds with MUST-FIX still open, stop and show the human the table.

### 7 · Simplify

Send to `implementer`: *"Run the simplify skill on these changed files (not tests, not docs):
<list>. Behaviour must not change."* Then run the gate again.

### 8 · Commit and push

- Stage only the files you intended. Never `.env*`, never `.impeccable/review/`.
- Use the step's commit message (conventional commits).
- Append the step's entry to `docs/plan/progress/A<N>.md` and include it in the commit.
- `git pull --rebase`. If the rebase brought changes, rerun the gate. Then `git push`.
- A conflict outside your owned paths → stop and ask the human.

### 9 · Report to the human (≤ 8 lines)

- What shipped, the gate result, the reviewer verdict, and anything deferred.
- The next step id.
- The team-chat line to paste, e.g.
  `A2-S3 done: verifyCredential(pdf, lookup) is real, A5 can drop its mock pipeline.`

---

## Escalation rules

- **Haiku is stuck:** the same packet fails the same check twice, or the reviewer flags the same
  MUST-FIX twice → you implement that part.
- **Hard steps:** implement the core yourself from the start; Haiku writes the tests and the
  mechanical parts. These are A1-S2 (landing signature moment), A2-S1 (keys and SD-JWT), A2-S5
  (Verified CV seal), A3-S3 (account abstraction spike), A3-S4 (Ledger contract), A4-S5 (issue flow).
- **Stop and ask the human** when:
  - a contract change is needed;
  - another agent's work blocks the step;
  - a security trade-off comes up;
  - git gets into anything destructive.
- **Never** force-push, edit another agent's paths, or commit secrets.

## DESIGN.md steps (A1 only)

`DESIGN.md` already exists from the pre-pivot kit (tokens, `LineField`, primitives). A1-S1 adds the
new primitives to it; at the end of **A1-S2** (final, from kit + landing), once the reviewer's
disposition is `ship`:

1. Run the documenter yourself. Read
   `.claude/skills/impeccable/reference/degraded/documenter.md` and
   `.claude/skills/impeccable/reference/document.md`. Then update `DESIGN.md` +
   `.impeccable/design.json` from the built code (globals.css, `src/components/ui`, `/dev/kit`, and
   the landing at S2), using the direction contract in the landing surface brief. Drop the
   "Provisional" line and every diploma reference.
2. Spawn `reviewer` in **DESIGN.md audit mode**. Fix its MUST-FIX items, then commit them with the step.

## Progress file template (`docs/plan/progress/A<N>.md`)

```markdown
# A<N> progress

| Step | Status | Commit | Notes for others |
| --- | --- | --- | --- |

## A<N>-S<M> · <title> · <date time>
- Shipped: …
- Deviations from plan: …
- Deferred / follow-ups: …
```
