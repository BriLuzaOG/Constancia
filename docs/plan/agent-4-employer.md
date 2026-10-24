# Agent 4 · Employer console: DB, blind mailbox, key sign-in, requests, issuing, revoking

**Mission:** HR's experience from first visit to a delivered, anchored certificate, with zero Web3
vocabulary, plus the small server that carries ciphertext between people who never trust it. You own
the database, the session, the employer pages and the issuing orchestration that wires A2
(credentials), A3 (ledger) and A5 (holder) together.

**You own:** `prisma/`, `prisma.config.ts`, `src/lib/server/`, `src/lib/employer/`,
`src/app/employer/**`, `src/app/api/auth/**`, `src/app/api/requests/**`,
`src/app/api/employer/**`, `src/app/api/shares/**`, and the `prisma` part of `render.yaml`'s build
command (tell A1 when you change it).

**Privacy rule you enforce:** the employee's record lives in the HR browser (directory, then form
state) and leaves it only **inside the encrypted certificate**. The database holds public keys,
an opaque employee number and ciphertext. Nothing else, ever.

Every step: follow the rules in [README.md](README.md). UI steps follow `DESIGN.md` and use the
`src/components/ui` primitives. Employer screens are **Operate** surfaces: same world, more restraint.

---

## A4-S1 · Database and blind mailbox [M] · T+1:00 · ~75 min

```
You are Agent 4 on Constancia. Set up Postgres with Prisma 7 and the public routes that carry
ciphertext.

Read: PRODUCT.md, docs/plan/contracts.md §8, §9, §10. Prisma 7 docs (node_modules/prisma and
online): prisma.config.ts, the `prisma-client` generator with an explicit output, the
@prisma/adapter-pg driver adapter. Prisma 7 differs from what you remember; read before writing.
Skills: typescript, nextjs-16, zod-4, ponytail.
Needs from your human (H2): DATABASE_URL in .env.local.

Build:
1. prisma/schema.prisma exactly per contracts §9, generator output ../src/generated/prisma
   (gitignored), prisma.config.ts, the "init" migration. Package scripts db:migrate, db:studio and
   postinstall "prisma generate". Update render.yaml's buildCommand to run
   `pnpm prisma migrate deploy` before `pnpm build` (tell A1).
2. src/lib/server/db.ts (server-only): a lazily created singleton PrismaClient with the PrismaPg adapter.
3. src/lib/server/rate-limit.ts: rateLimit(req, key, { limit, windowMs }) throwing HttpError(429).
   shortcut: in-memory fixed window per instance, move to Redis if we ever run two instances. A3 imports it.
4. Public routes per contracts §8, each with a zod schema, no body logging, a size cap and
   rateLimit: POST /api/requests (the employer must be ACTIVE: getLedgerReader().issuer(...) →
   422 EMPLOYER_NOT_ACCREDITED; both JWKs must be valid P-256), GET /api/requests/:id,
   POST /api/requests/:id/ack (nulls deliveryJwe), POST /api/shares (≤ 64 KB, ttl ≤ 7 days),
   GET /api/shares/:id (404 unknown, 410 EXPIRED). IDs are 16 random bytes as hex. Expired rows are
   purged on read. The employer routes of §8 exist now as stubs that answer 401 until A4-S2.

Tests: the zod schemas; ID shape; expiry and purge-on-read as pure functions; the rate limiter.
Verify: pnpm db:migrate against the shared DB; pnpm build passes WITHOUT DATABASE_URL (CI).
Gate. Commit: "feat(server): Prisma 7 schema, blind request and share mailbox".
Post "mailbox routes are live" (A5 and A2 need them).
```

## A4-S2 · Sign in with the device key; employer shell [M] · T+2:15 · ~60 min

```
You are Agent 4 on Constancia. HR signs in by proving it holds a registered key. No passwords, no
email codes.

Read: DESIGN.md, contracts §5, §7 (AccountClient), §8 (auth routes), PRODUCT.md Principles.
Skills: impeccable (Operate mode; craft-floor before UI edits), nextjs-16, react-19, tailwind-4,
zod-4, typescript.
Needs: A2-S1 (loadSigner, verifyEs256), A3-S2 (getLedgerReader, memory ledger). Code against the
stubs and a fake until they land.

Build:
1. src/lib/server/session.ts (server-only): stateless HS256 JWTs with SESSION_SECRET (jose).
   Challenge token { account, keyId, nonce, exp 2 min }; session cookie { account, keyId } 8 h.
   requireEmployer(req) returns { account, keyId } or throws HttpError(401).
2. Routes: POST /api/auth/challenge (the key must exist and be live on the ledger, else
   404 KEY_UNKNOWN), POST /api/auth/session (verify the ES256 signature of the challenge string with
   the ledger's key for that keyId → HttpOnly, SameSite=Strict, Secure in production cookie),
   GET /api/auth/me, POST /api/auth/logout. Any account with a live key may sign in, including a
   PENDING one (it needs to reach onboarding).
3. src/lib/employer/identity.ts (browser): the local record { signerName, account, orgName } in
   IndexedDB, and src/lib/employer/session-client.ts: signIn(signerName) does challenge → sign →
   session.
4. src/app/employer/layout.tsx: chrome with wordmark, nav (Requests · Issued · Team · Directory),
   sign out, and a thin line-ink strip as the world's accent. src/app/employer/page.tsx: signed out →
   "Sign in with this device" listing local signers named "employer:*" (or "Set up your organization"
   when none); signed in → a readiness CheckList: Signing key on this device · Organization account ·
   Applied to the consortium · Accredited (approvals n of quorum) · Employee directory loaded → one
   primary action for the first unmet item.
Copy: never "wallet", "gas", "seed", "transaction". Say "signing key on this device", "the consortium".

Tests: challenge and session round trip, expired challenge, wrong signature, a removed key.
Verify at 1440 and 390, detector, gate.
Commit: "feat(employer): device-key sign-in and readiness overview".
```

## A4-S3 · Onboarding: organization account and accreditation [M] · T+3:15 · ~75 min

```
You are Agent 4 on Constancia. Create the organization and keep issuing locked until the consortium
accredits it.

Read: contracts §6, §7 (createAccountClient, applyForAccreditation), §8. PRODUCT.md.
Skills: impeccable (Operate; craft-floor), nextjs-16, react-19, tailwind-4, zod-4, typescript.
Needs: A2-S1 (createStoredSigner), A3-S2 (createAccountClient and fetchNetworkState on the memory ledger).

Build src/app/employer/onboarding/page.tsx:
1. Step 1, "Name your organization": a name field (zod, 2–80). Submit creates the device key
   (createStoredSigner('employer:<slug>')), builds the account client, shows the organization's short
   account address, and saves the local identity.
2. Step 2, "Ask the consortium to accredit you": applyForAccreditation(name) with CheckRows (Signed ·
   Written to the ledger · fee 0, real measured values from TxResult). Then a status view that polls
   fetchNetworkState every 3 s: "Waiting for the consortium · 1 of 2 members have approved", and
   unlocks (a clear ACTIVE state, a link to the inbox) when the issuer is ACTIVE. SUSPENDED shows a
   calm explanation.
3. A one-line honest note: "This signing key lives on this device. Add a second device in Team so you
   cannot lock yourself out."
4. Already onboarded → show the organization and its status instead of the form.

Verify locally with the memory ledger: onboard "Demo Org", approve it from A1's /ledger/operator (or
POST /api/dev/ledger/op), watch it unlock. Gate.
Commit: "feat(employer): organization onboarding and accreditation gate".
```

## A4-S4 · Employee directory and request inbox [M] · T+4:30 · ~60 min

```
You are Agent 4 on Constancia. HR sees who is asking, and the employee data stays on HR's device.

Read: contracts §4.1 (EmploymentRecord, employmentRecordSchema), §8 (employer routes), §9.
Skills: impeccable (Operate; craft-floor), nextjs-16, react-19, tailwind-4, zod-4, typescript.
Needs: A2-S1 (employmentRecordSchema).

Build:
1. src/lib/employer/directory.ts (browser, IndexedDB): employeeRef → EmploymentRecord, validated
   with employmentRecordSchema. loadDemoDirectory() with four synthetic employees (María Rojas,
   E-1042, current, Logistics Analyst, full time, salary a few hundred USD; the others past or
   current, clearly fictional). shortcut: one directory per device; real deployments integrate the
   HR system.
2. src/app/employer/directory/page.tsx: list, "Load demo directory", add one employee with a form.
   A visible note: "This list never leaves this browser."
3. The employer routes of contracts §8 for real, behind requireEmployer and the session account:
   GET /api/employer/requests (own PENDING only), POST .../:id/deliver ({ jwe } ≤ 32 KB, only from a
   PENDING request, the employer must be ACTIVE else 403 NOT_ACCREDITED, sets ISSUED and stores the
   ciphertext), POST .../:id/decline.
4. src/app/employer/requests/page.tsx: poll every 3 s. One card per request: employee number,
   the matching directory name or "Not in your directory", CURRENT or PAST, age. Actions: "Review and
   issue" (to /employer/issue/<id>) and Decline.

Tests: the deliver and decline rules (status and ownership) as pure guards; directory validation.
Gate. Commit: "feat(employer): local employee directory and request inbox".
```

## A4-S5 · Issue flow with live progress [M] · T+5:30 · ~105 min · HARD STEP: you implement the core

```
You are Agent 4 on Constancia. Wire the whole issuance and make every step visible. This is a demo
moment: judges watch it on a projector.

Read: contracts §4.5 (issueCredential), §5, §7 (AccountClient), §8, §11 (CheckList/CheckRow,
Receipt, Disclosure); DESIGN.md.
Skills: impeccable (Operate; craft-floor), react-19, tailwind-4, typescript, ponytail.
Needs: A2-S1 (issueCredential), A2-S2 (encryptForHolder), A3-S2 (account client), A5-S1 (to create
requests). Use the memory ledger and a hand-made request until A5 lands.

Build src/app/employer/issue/[id]/page.tsx and src/lib/employer/issue.ts:
1. Load the request, prefill the form from the directory by employee number (editable). CURRENT
   clears the end date, PAST requires one. Validate with employmentRecordSchema. A visible note:
   "This data never leaves your browser except inside the encrypted certificate."
2. On "Issue certificate", a CheckList shows five rows with real measured values:
   1 Request opened      → employee number and kind
   2 Certificate signed  → issueCredential with the device key           measured: "ES256 · key 0x9c… · 2.1 KB"
   3 Written to the ledger → client.anchor(credentialHash)               measured: "block 1,204 · fee 0"
   4 Delivered, encrypted → encryptForHolder(sdJwt, request.encJwk), POST deliver   measured: "1.9 KB · only the holder can read it"
   5 Data discarded      → clear the form state, append { credentialHash, employeeRef, issuedAt,
                           kind } to the local issued log (IndexedDB) for the Issued page
   Before row 3, one line: "This writes a permanent record: a hash. It contains no personal data."
   Order matters: sign, anchor, then deliver; never deliver a certificate that is not anchored.
3. After success, a Receipt "What Constancia stored": the request row (id, employer, employee
   number, kind, status ISSUED, ciphertext size) with "Never stored: name, national ID, job title,
   salary, the certificate". Disclosure "Technical details": JWS header, kid, credential hash, block.
4. Errors: show the failed row, a plain reason, and "Retry from here" (reuse the signed certificate;
   anchoring an already-anchored hash counts as success; delivery retries). Double-submit is blocked.
src/lib/employer/issue.ts holds the orchestration with an onProgress callback so it is testable.

Tests: the orchestration with fakes: call order, a failure at row 3 or 4 and the retry resuming,
state cleared at the end, nothing delivered before the anchor.
Verify: a full run locally on the memory ledger, the holder side decrypts it. Gate.
Commit: "feat(employer): end-to-end issuance with live progress and storage receipt".
Post "M2 half: issuing works" with a screenshot in the team channel.
```

## A4-S6 · Issued list, revoke, team keys [M for revoke, S for team] · T+7:15 · ~75 min

```
You are Agent 4 on Constancia. Revoking is the fifth check made visible, and teammates must not
lock HR out.

Read: contracts §6 (revoke), §7 (addKey, removeKey), §8 (/api/did/resolve).
Skills: impeccable (Operate; craft-floor), react-19, tailwind-4, typescript.

Build:
1. src/app/employer/issued/page.tsx: the local issued log joined with each credential's live status
   from POST /api/ledger/lookup (ACTIVE, REVOKED with date). A "Revoke" button with a confirm
   ("Everyone holding this certificate will see it fail the ledger check") calls client.revoke(hash)
   and updates the row with the TxResult as CheckRows (Signed · Written to the ledger · fee 0).
2. [S] src/app/employer/team/page.tsx: the organization's keys from GET /api/did/resolve (short
   keyId, added date, "this device"), "Add a teammate's device": the teammate opens
   /employer/join, creates their device key (createStoredSigner) and sees a join code (the account
   and public JWK, base64); the admin pastes it and calls client.addKey. Remove a key with
   client.removeKey; the page refuses to remove the last or the current device's key.
3. /employer/join page (S): create the device key, show the join code, then poll until the account
   lists the key, then sign in.

Verify on the memory ledger: revoke, then A2's /verify "Check again" fails at LEDGER. Gate.
Commit: "feat(employer): issued list with revoke, and team keys".
```

## A4-S7 · Demo employers on production [M] · T+8:30 · ~60 min

```
You are Agent 4 on Constancia. Set up the real demo state on the Render deploy.
Needs: A3-S7's seed run against production (A3 does it in its first 30 minutes, about T+8:45), A5's
vault on production.

Do:
1. In the Registrar profile, open /dev/identity (demo mode), import demo-pack/identities.json (A3's
   seed produced it), sign in as "Orinoco Logistics (demo)", load the demo directory.
2. From the Holder profile create a request for María (E-1042); issue it from the Registrar profile on
   production; confirm A5's vault receives it and A2's /verify passes the shared link. This is the
   exact demo flow, run for real.
3. Keep copies of demo-pack/ in the team drive. Write the demo URLs and what is where in the private
   channel, never in git.
4. Put anything broken in front of the owner of that area immediately.
Commit (only if code changed): "chore(employer): demo setup fixes".
```

## A4-S8 · Hardening [M] · T+9:30 · ~90 min

```
You are Agent 4 on Constancia. Make the employer flow unbreakable during a live demo.

Skills: impeccable (harden, clarify), react-19, typescript.

Do: double-submit protection everywhere; session expiry mid-flow (a 401 re-signs in once and
retries); idempotent deliver and revoke; ALREADY_ANCHORED by our own account is success; requests
older than 14 days read as EXPIRED; ledger-unreachable and slow-ledger states with human copy and
honest waiting; empty and loading states; keyboard and screen-reader pass on the issue form (labels,
error association, aria-live on the progress rows). Run impeccable clarify on all employer copy. Then
run the code-review skill on your diff since M0 and fix real findings.
Gate. Commit: "fix(employer): demo hardening".
```
