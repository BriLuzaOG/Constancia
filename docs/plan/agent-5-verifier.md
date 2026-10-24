# Agent 5 · Verifier portal: did:web, lookup API, verify, privacy receipt, Forgery Lab

**Mission:** the moment judges remember. A recruiter drops a PDF and watches five checks resolve,
sees exactly what left their browser, and then watches three forgeries fail at named checks. You
also own the server's only contact with the outside world, did:web resolution, which must be
SSRF-safe.

**You own:** `src/lib/did/`, `src/app/verify/**` (`/verify`, `/verify/lab`),
`src/app/api/verify/lookup/route.ts`.

**Privacy rule you enforce:** the browser sends `{ did, kid, credentialId }` and nothing else. The
file never leaves the browser. The receipt proves it.

Every step: follow the rules in [README.md](README.md). UI steps follow `DESIGN.md` (before
T+5:15: the landing surface brief + `/dev/kit`) and use the `src/components/ui` primitives.

---

## A5-S1 · did:web library + SSRF-guarded resolver · T+0:45 · ~75 min

```
You are Agent 5 on ScholarKey. Build did:web mapping, DID documents, and a resolver that cannot be
abused to reach internal networks.

Read: PRODUCT.md, docs/plan/contracts.md §5 (functions, did.json shape, SSRF rules). The did:web
spec mapping: did:web:example.com → https://example.com/.well-known/did.json;
did:web:example.com:user:alice → https://example.com/user/alice/did.json; %3A decodes to a port.
Skills: typescript, zod-4, ponytail.

Build in src/lib/did/:
1. web.ts: domainToDidWeb, didWebToUrl.
2. document.ts: didDocumentSchema (zod 4), buildDidDocument(did, jwk), findAssertionKey(doc, kid)
   (kid must be listed in assertionMethod and have a secp256k1 publicKeyJwk).
3. resolve.ts (server-only): resolveDidWeb(did). https only; reject IP-literal hosts;
   dns.promises.lookup(host, { all: true }) and reject any address in a node:net BlockList of
   loopback, private, link-local (incl. 169.254.169.254), CGNAT 100.64/10, 0.0.0.0/8, ::1, fc00::/7,
   fe80::/10; fetch with redirect:'manual' (any 3xx → DidInvalidError), AbortSignal.timeout(3000),
   stream-read with a 64 KB cap; parse + zod; document.id must equal did. Errors: DidUnreachableError
   (timeout, DNS failure, 5xx), DidNotFoundError (404), DidInvalidError (everything else).
   shortcut: resolve-then-fetch leaves a DNS-rebinding window; pin the resolved IP in a custom
   undici dispatcher if this ever runs beyond the demo.

Tests: mapping table (bare domain, paths, port); BlockList rejects each private range; redirect,
timeout, 404, oversize, id mismatch (mock fetch + dns); a valid document passes;
buildDidDocument → findAssertionKey round-trip.
Gate. Commit: "feat(did): did:web mapping, documents and SSRF-guarded resolver". Post exports for A4.
```

## A5-S2 · Public lookup endpoint · T+2:00 · ~60 min

```
You are Agent 5 on ScholarKey. Build the one endpoint the verifier calls. It sees an issuer DID
and a random ID, nothing else.

Read: contracts §6 (readAnchor, AnchorInfo), §8 (/api/verify/lookup: request, response, error codes).
Skills: nextjs-16, typescript, zod-4, ponytail.

Build src/app/api/verify/lookup/route.ts (POST):
zod { did: /^did:web:/, kid: starts with did + '#', credentialId: 0x + 64 hex } → resolveDidWeb →
findAssertionKey (422 KEY_NOT_FOUND) → issuerAddress = addressFromJwk (A2) → readAnchor (A3; until
A3-S4 merges it throws "not implemented" → map to 503 CHAIN_UNREACHABLE) →
{ didDocument, resolvedFrom, issuerAddress, anchor }.
Error map: DidUnreachableError → 503 ISSUER_UNREACHABLE; DidNotFoundError → 404; DidInvalidError → 422.
Headers: Cache-Control no-store. Never log the body. No database access.

Tests: the error-mapping function and the request schema (bad did, bad kid, bad id).
Verify with curl against the demo university DID once A1-S2 is deployed. Gate.
Commit: "feat(verify): public lookup endpoint, blind to the document".
```

## A5-S3 · /verify: drop, check, verdict · T+3:00 · ~2 h

```
You are Agent 5 on ScholarKey. Build the verification portal. This is the demo's centrepiece.

Read: DESIGN.md or (until T+5:15) the landing surface brief ("Memorable moment") + /dev/kit;
contracts §4.5 (CheckEvent, Verdict), §8, §11 (DropZone, CheckList, CheckRow, Verdict, LineField).
Skills: impeccable (Operate surface in the ScholarKey world; craft-floor before edits), nextjs-16,
react-19, tailwind-4, typescript.
Needs: A2-S3 (verifyCredential). Until it merges, put a mock generator with the same types in
src/app/verify/_lib/mock-pipeline.ts and delete it when the real one lands.

Build src/app/verify/page.tsx + _components:
1. DropZone (whole-page drag awareness, file-input fallback, keyboard). On load, takeHandoffFile()
   picks up a file dropped on the landing.
2. src/app/verify/_lib/lookup-client.ts: LookupFn that POSTs to /api/verify/lookup and records the
   exact request (URL, method, JSON body, byte length) for the privacy receipt (S4).
3. Run verifyCredential(bytes, lookup); render the five CheckRows (Embedded credential · Issuer key
   from its domain · Signature · Document seal · Public record) with real measured values. Pace each
   row for legibility (≥ 450 ms on screen; the measured ms stay real). The LineField band scans
   while running and resolves at the end.
4. Verdict: AUTHENTIC / NOT AUTHENTIC (name the failed check; expected vs found in one plain
   sentence) / CANNOT VERIFY RIGHT NOW (UNAVAILABLE: domain or chain unreachable, "try again").
5. Credential panel (AUTHENTIC only), with data from the verified JWT ONLY: graduate, national ID,
   degree + program, honors, graduation date, issued on, credential ID; issuer name and the domain
   the key came from shown prominently. Label: "Read from the signed credential, not from the PDF's
   printed text."
6. "Try to forge it →" link to /verify/lab, carrying the PDF in memory (handoff).
Dynamic-import the credential library. aria-live announcements for each check.

Verify with A2's sample PDFs (fake lookup) now, real ones after M2. 1440, 1280×720, 390. Detector.
Gate. Commit: "feat(verify): drop-and-verify portal with sequential checks".
```

## A5-S4 · Privacy receipt + technical details · T+5:00 · ~90 min

```
You are Agent 5 on ScholarKey. Prove, on screen, that the server is blind.

Read: PRODUCT.md (Principle 3), contracts §11 (Receipt, Disclosure, Mono).
Skills: impeccable (craft-floor), react-19, tailwind-4, typescript.

Build:
1. Receipt "What left your browser": destination (/api/verify/lookup), the exact JSON body as sent
   (did, kid, credentialId), its byte length. Beside it, "What stayed on this device": file name,
   file size, and the fields that never left (graduate name, national ID, program, honors, the PDF).
   The numbers come from the recorded request, not from constants.
2. Disclosure "Technical details": JWT header and payload (pretty, with the PDF's own data), the
   signature (shortened), the did.json URL it was resolved from, the JWK thumbprint, the issuer
   address, the seal digest expected vs computed, and the anchor tx link on BaseScan
   (A3 format helpers).
Gate. Commit: "feat(verify): privacy receipt and technical details".
```

## A5-S5 · Forgery Lab · T+6:30 · ~2 h

```
You are Agent 5 on ScholarKey. Let anyone try to forge a diploma, and watch it fail live.

Read: contracts §4.4 (runAttack, Attack), §4.5; DESIGN.md.
Skills: impeccable (craft-floor), nextjs-16, react-19, tailwind-4, typescript.
Needs: A2-S5 (attacks). Build the UI against the contract first if it isn't merged.

Build src/app/verify/lab/page.tsx:
1. Source document: the PDF handed over from /verify, or "Use the sample diploma"
   (/demo/sample-diploma.pdf from A4-S7; until then any A2 sample).
2. Three attack cards, in order: "Edit the printed diploma" · "Edit the hidden credential" ·
   "Forge the university's signature". Clicking one runs runAttack, shows attack.changed, then
   runs verifyCredential on the tampered bytes with the same CheckList, so the failure resolves red
   at its named row (SEAL / SIGNATURE / SIGNATURE, with a different reason).
3. Side-by-side native previews (iframe/object on blob URLs) of original vs tampered, plus "Download
   the forgery" so a judge can drop it into /verify themselves.
4. A reset that returns to the original document.
Verify all three attacks end at the expected check. Gate.
Commit: "feat(verify): Forgery Lab with three live attacks".
```

## A5-S6 · Failure modes + edge hardening · T+8:30 · ~90 min

```
You are Agent 5 on ScholarKey. Make every unhappy path clear and calm.

Skills: impeccable (harden, clarify, adapt), react-19, typescript.

Do: non-PDF, empty file, > 15 MB (rejected before reading), PDF without a credential, damaged
token, unknown or unreachable issuer domain (CANNOT VERIFY RIGHT NOW, with the domain named),
chain RPC down, slow network (rows wait honestly). Mobile layout (the PDF's QR opens /verify on a
phone). Keyboard-only and screen-reader pass; focus moves to the verdict; reduced motion. Copy via
impeccable clarify: plain, specific, no blame, no jargon outside Technical details.
Gate. Commit: "fix(verify): failure modes and edge hardening".
```

## A5-S7 · Production e2e + integration · T+11:00 · ~90 min

```
You are Agent 5 on ScholarKey. On the Render deploy: verify A4's production diplomas, run all three
attacks, check the receipt numbers, and time each check so the presenter can narrate real figures
(post them). Fix integration bugs in your area. Run the code-review skill on your diff since M0 and
address real findings.
Commit: "fix(verify): production integration".
```
