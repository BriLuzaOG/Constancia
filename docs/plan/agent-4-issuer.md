# Agent 4 · Issuer console: DB, onboarding, did.json gate, subscription, issuance

**Mission:** the registrar's experience, from first email login to a downloaded, sealed,
anchored diploma, with zero Web3 vocabulary. You own the database, the institution lifecycle, and
the issuance orchestration that wires A2 (credential), A3 (Privy + chain) and A5 (did:web)
together.

**You own:** `prisma/`, `prisma.config.ts`, `src/lib/db.ts`, `src/lib/issuer/`,
`src/app/issuer/**`, `src/app/api/issuer/**`, `src/app/api/issuance/**`, `public/demo/`, and the
`prisma` part of `render.yaml`'s build command (tell A1 when you change it).

**Privacy rule you enforce:** the graduate's record lives only in React state on `/issuer/issue`.
It is never posted, logged, put in a URL, or stored. The DB holds institutions and a blind index.

Every step: follow the rules in [README.md](README.md). UI steps follow `DESIGN.md` (before
T+5:15: the landing surface brief + `/dev/kit`) and use the `src/components/ui` primitives. Issuer
screens are **Operate** surfaces: same world, more restraint.

---

## A4-S1 · Prisma 7 + database + guards · T+0:45 · ~90 min

```
You are Agent 4 on ScholarKey. Set up the database with Prisma 7 and the server-side guards that
gate every write.

Read: PRODUCT.md, docs/plan/contracts.md §9, §10. Prisma 7 docs (node_modules/prisma + online):
prisma.config.ts, the `prisma-client` generator with an explicit output, the @prisma/adapter-pg
driver adapter. Prisma 7 differs from what you remember; read before writing.
Skills: typescript, nextjs-16, ponytail.
Needs from your human (H2): DATABASE_URL in .env.local.

Build:
1. prisma/schema.prisma exactly per contracts §9, generator output ../src/generated/prisma
   (gitignored), prisma.config.ts.
2. src/lib/db.ts (server-only): a lazily created singleton PrismaClient with PrismaPg adapter.
3. Migration "init" (prisma migrate dev). Package scripts: db:migrate, db:studio, and
   postinstall "prisma generate". Update render.yaml buildCommand to run `pnpm prisma migrate
   deploy` before `pnpm build` (tell A1).
4. src/lib/issuer/guards.ts per contracts §9 (throw HttpError 402 SUBSCRIPTION_INACTIVE,
   409 DID_NOT_VERIFIED, 404 UNKNOWN_CREDENTIAL, 409 ALREADY_ANCHORED) and src/lib/issuer/dto.ts
   (InstitutionDTO: no secrets).

Tests: guard decisions as pure functions over plain objects (no DB in unit tests).
Verify: pnpm db:migrate against the shared DB; pnpm build passes WITHOUT DATABASE_URL (CI).
Commit: "feat(issuer): Prisma 7 schema, blind issuance index, issuing guards".
```

## A4-S2 · Issuer shell: sign-in and readiness · T+2:15 · ~90 min

```
You are Agent 4 on ScholarKey. Build the issuer console frame: sign in with email, then a
readiness overview that always tells the registrar the one next thing to do.

Read: DESIGN.md or (until T+5:15) the landing surface brief + /dev/kit; contracts §7, §8 (GET
/api/issuer/me); PRODUCT.md Principles.
Skills: impeccable (Operate mode; craft-floor before UI edits), nextjs-16, react-19, tailwind-4,
typescript.
Needs: A3-S1 (IssuerProviders, requireAdmin, issuerFetch). If not merged, code against the stubs.

Build:
1. src/app/issuer/layout.tsx: IssuerProviders (client boundary) + issuer chrome: wordmark, nav
   (Issue · Institution · Plan · Sign out), a thin line-ink strip as the world's accent.
2. src/app/issuer/page.tsx: signed out → "Sign in with your institutional email" (Privy login).
   Signed in → readiness CheckList: Signed in ✓ · Institution registered · Public key published
   on your domain · Plan active → one primary action for the first unmet item
   (Register institution / Publish your key / Activate plan / Issue a credential).
3. GET /api/issuer/me per contracts.
Copy: never "wallet", "gas", "blockchain"; say "your institution's signing key", "public record".

Verify at 1440 and 390, detector, gate.
Commit: "feat(issuer): sign-in and readiness overview".
```

## A4-S3 · Onboarding: institution, key proof, did.json publication gate · T+3:45 · ~105 min

```
You are Agent 4 on ScholarKey. Register the institution, bind its signing key to its web domain
with did:web, and keep issuing locked until the published key matches.

Read: contracts §5, §7 (proveKey, verifyKeyProof), §8 (institution, did/check), §9.
Skills: impeccable (Operate; craft-floor), nextjs-16, react-19, tailwind-4, zod-4, typescript.
Needs: A3-S2 (usePrivySigner.proveKey, verifyKeyProof), A5-S1 (domainToDidWeb,
buildDidDocument, resolveDidWeb, findAssertionKey).

Build:
1. src/app/issuer/onboarding/page.tsx, step 1: institution name + domain (zod hostname, optional
   path, lowercase). Live preview of the resulting DID and the exact URL where did.json must live.
   Submit: proveKey() → POST /api/issuer/institution.
2. POST /api/issuer/institution: requireAdmin → zod → verifyKeyProof(proof, walletAddress) →
   did = domainToDidWeb(domain) → create Institution (409 DOMAIN_TAKEN) → return didDocument.
3. Step 2, "Publish your public key": pretty did.json with Copy and Download (did.json), plain
   instructions ("Upload this file to https://<domain>/.well-known/did.json"), and a
   "Check publication" button → POST /api/issuer/did/check: resolveDidWeb → compare JWK x,y with
   the stored key → set didVerifiedAt. States: unreachable (with the URL tried), not found, key
   mismatch (expected vs found fingerprint), verified ✓ → back to the readiness overview.
4. Already registered → show the institution and its publication status instead of the form.

Verify locally: register "Universidad Waraira (demo)" with the demo site domain from A1-S2 (you
can't publish yet; check that "not found / mismatch" renders well). Gate.
Commit: "feat(issuer): institution onboarding with did:web publication gate".
```

## A4-S4 · Subscription mock · T+5:30 · ~60 min

```
You are Agent 4 on ScholarKey. Gate write operations behind a (mock) subscription, the business
model that pays for the sponsored network fees.

Read: contracts §8 (subscription), §9 guards; PRODUCT.md (out of scope: real Stripe).
Skills: impeccable (Operate, clarify), nextjs-16, react-19, tailwind-4, zod-4.

Build:
1. src/app/issuer/billing/page.tsx: "Institution plan · Test mode, no real charges", status, a
   toggle → POST /api/issuer/subscription. Explain: "Issuing needs an active plan. Every diploma you
   already issued stays verifiable either way." Show no prices: none are decided.
2. Enforcement: assertCanIssue in /api/issuance/prepare (S5) and A3's sponsor route.
3. Locked state on /issuer/issue (placeholder page for now if S5 isn't done): a clear lock with a
   link to Plan.
Gate. Commit: "feat(issuer): mock subscription gating write operations".
```

## A4-S5 · Issuance form + prepare/confirm endpoints · T+6:30 · ~75 min

```
You are Agent 4 on ScholarKey. Build the graduate form and the two server endpoints that
bracket issuance, without the server ever seeing the graduate's data.

Read: contracts §4.1 (GraduateRecord, graduateRecordSchema), §8 (prepare, confirm), §9.
Skills: impeccable (Operate; craft-floor), nextjs-16, react-19, tailwind-4, zod-4, typescript.

Build:
1. src/app/issuer/issue/page.tsx: form for GraduateRecord (client-side validation with A2's
   graduateRecordSchema; degree level select; honors optional). State in React only. A visible note:
   "This data never leaves your browser." A "Fill sample graduate" button with clearly synthetic data
   (for the demo).
2. POST /api/issuance/prepare: requireAdmin → assertCanIssue → 32 random bytes → Issuance PREPARED
   → { credentialId, issuer: { did, name, kid: `${did}#key-1` }, verifyUrl: `${APP_URL}/verify` }.
3. POST /api/issuance/confirm: requireAdmin → zod → assertPreparedCredential → A3 readAnchor(
   walletAddress, credentialId) must be anchored (422 ANCHOR_NOT_FOUND) → status ANCHORED,
   anchorTxHash, fundingTxHash, anchoredAt → return { stored: row }.
Tests: endpoint input schemas; prepare refuses when the plan is off or the DID is unverified (pure guard tests).
Gate. Commit: "feat(issuer): issuance form and prepare/confirm endpoints".
```

## A4-S6 · Issuance orchestration + live progress + "what we stored" · T+7:45 · ~105 min

```
You are Agent 4 on ScholarKey. Wire the whole issuance and make every step visible. This is a demo
moment: judges watch it on a projector.

Read: contracts §4.4 (createSealedCredentialPdf), §7 (usePrivySigner, useAnchorCredential),
§8, §11 (CheckList/CheckRow, Receipt, Disclosure); DESIGN.md.
Skills: impeccable (Operate; craft-floor), react-19, tailwind-4, typescript, ponytail.
Needs: A2-S2, A3-S2, A3-S5.

On submit, a CheckList shows six rows with real measured values:
1 Prepared       → POST prepare                                     measured: short credential ID
2 Sealed         → createSealedCredentialPdf onProgress('sealed')   measured: "212 KB · seal sha-256"
3 Signed         → onProgress('signed'), token embedded             measured: "ES256K · institution key"
4 Fee sponsored  → useAnchorCredential: sponsor part                measured: top-up in ETH (A3 formatEth) + link
5 Recorded       → anchor tx mined                                  measured: block number + link
6 Data discarded → confirm, auto-download the PDF, clear the form state, revoke the blob URL
Before row 4, one line: "This writes a permanent public record. It contains no personal data."
Dynamic-import pdf-lib/credential code on this page only.

After success: "Download again" and a Receipt "What ScholarKey stored", rendering the returned row
verbatim (credentialId, institution, status, tx hashes, times), with "Never stored: name, national
ID, program, honors, the PDF" below it. Technical details (Disclosure): JWT header, DID, kid,
explorer links.
Errors: show the failed row, a plain reason, and "Retry from here" (reuse the prepared ID; anchor
retry re-sponsors). File name: certificate-<surname>-<first 6 of id>.pdf.

Verify: a full real issuance locally (Privy + Base Sepolia), PDF opens, A5's /verify passes it
(M2). Gate. Commit: "feat(issuer): end-to-end issuance with live progress and storage receipt".
Post "M2: first diploma issued" with the PDF in the team channel.
```

## A4-S7 · Demo institution in production · T+9:30 · ~90 min

```
You are Agent 4 on ScholarKey. Set up the real demo state on the Render deploy.

Do:
1. On production, sign in with the demo registrar email; register "Universidad Waraira (demo)" with
   the demo site's domain; download did.json; give it to A1 to commit to
   university-site/.well-known/did.json and redeploy; click "Check publication" → verified.
2. Activate the plan; issue 2–3 diplomas with synthetic graduates; verify each on production /verify.
3. Save one as public/demo/sample-diploma.pdf (synthetic) for the Forgery Lab's "Use sample" button.
   Keep backups of all demo PDFs in the team drive.
4. Write the demo account and URLs in the private channel, never in git.
Commit: "chore(demo): sample diploma for the Forgery Lab".
```

## A4-S8 · Hardening · T+11:00 · ~90 min

```
You are Agent 4 on ScholarKey. Make the issuer flow unbreakable during a live demo.

Skills: impeccable (harden, clarify), react-19, typescript.

Do: double-submit protection; session expiry mid-flow (refresh the token and retry once);
idempotent confirm; ALREADY_ANCHORED by our address = success; stale PREPARED rows are harmless;
offline/RPC errors with human copy; empty and loading states; keyboard and screen-reader pass on
the form (labels, error association, aria-live on progress). Run impeccable clarify on all issuer
copy. Then run the code-review skill on your diff since M0 and fix real findings.
Gate. Commit: "fix(issuer): demo hardening".
```
