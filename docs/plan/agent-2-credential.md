# Agent 2 · Credential core and the verifier: keys, SD-JWT VC, presentation, checks, Verified CV, `/verify`

**Mission:** the cryptographic heart and the demo's centrepiece. Pure, tested TypeScript that runs in
the browser and Node: device keys, the SD-JWT employment certificate, selective presentation with key
binding, the five-check verification pipeline, the Verified CV join and the Lab's attacks. Then the
`/verify` portal that renders it.

**You own:** `src/lib/credential/`, `public/contexts/`, `src/app/verify/page.tsx`,
`src/app/verify/_components/`, `src/app/verify/_lib/`.

Your library has no server and no UI. Everything takes its dependencies as arguments: the signer
(`Es256Signer`) and the lookup (`LookupFn`). That keeps it testable and lets A3, A4 and A5 plug in.
Tests are your proof: every library step ships vitest tests. Node 24 has WebCrypto, so tests run
without a browser.

Every step: follow the rules in [README.md](README.md).

---

## A2-S1 · Keys, ES256 and SD-JWT VC issuance [M] · T+1:00 · ~75 min · HARD STEP: you implement the core

```
You are Agent 2 on Constancia. Build the keys and the certificate.

Read: PRODUCT.md, docs/plan/contracts.md §3, §4.1, §4.2, §4.5, §5.
Read, in node_modules, the README of jose v6 (base64url, calculateJwkThumbprint) and spend at most
20 minutes on @sd-jwt/core (does it give you: browser + Node, signer/hasher callbacks, a W3C-shaped
payload with disclosures nested under credentialSubject, sorted _sd). If it does, use it for
issuing. If it fights you, hand-roll sdjwt.ts: contracts §4.2 lists the exact mechanics (about 200
lines with jose, @noble/hashes and WebCrypto). Whatever you pick, A2-S2 to S5 also need decoding and
digest checks, so keep them in your own code.
Skills: typescript, zod-4, ponytail.

Build in src/lib/credential/:
1. types.ts: fill in the stub exactly as in contracts §4.1, plus employmentRecordSchema (zod 4)
   with the rules in §4.1.
2. keys.ts: Es256Signer over WebCrypto ECDSA P-256 (sign returns the raw 64-byte r||s that WebCrypto
   gives), generateSigner, signerFromPrivateJwk, keyIdOf(jwk) = viem keccak256 of x||y as 32-byte
   big-endian each, verifyEs256 (crypto.subtle.verify).
3. keystore.ts (browser only): IndexedDB store of CryptoKey objects, so non-extractable keys persist:
   createStoredSigner, loadSigner, importStoredSigner (private JWK imported as non-extractable),
   listSignerNames. shortcut: no automated test (needs a browser), covered by manual checks and by
   A3's /dev/identity page; keep the logic tiny.
4. sdjwt.ts: issueCredential and credentialHashOf per contracts §4.5. Derive employedNow and
   salaryBand. Header and payload exactly as §4.2. validUntil = +90 days only for a current
   employment. Throw a readable error for any record that fails the schema.
5. public/contexts/constancia-v1.jsonld: a small JSON-LD context defining EmploymentCredential,
   Employee and the twelve claim terms.

Tests (src/lib/credential/*.test.ts): sign and verify round trip; one flipped byte fails; a wrong
key fails; keyIdOf matches a hand-computed vector; the issuer JWT payload contains none of the
record's strings (assert the surname, national ID and job title are absent) and has exactly 12
digests; every digest matches its disclosure; all twelve claims come back from a full SD-JWT; the
issuer JWT stays under 3 KB and the full SD-JWT under 6 KB; a current employment has validUntil, a
past one does not.

Gate. Commit: "feat(credential): ES256 keys and SD-JWT VC issuance". Post the exports.
```

## A2-S2 · Presentation, key binding and share crypto [M] · T+2:15 · ~75 min

```
You are Agent 2 on Constancia. The holder shows only what they choose, and every presentation is
bound to the holder's key.

Read: contracts §4.3, §4.5. jose v6 docs for CompactEncrypt, compactDecrypt and the ECDH-ES and
dir algorithms with WebCrypto keys.
Skills: typescript, ponytail.

Build in src/lib/credential/:
1. present.ts: REVEAL_TEMPLATES (§4.3), presentCredential (keeps only the chosen disclosures,
   appends a KB-JWT with { iat, exp, aud, nonce, sd_hash, cv_set? } signed by args.holder; sd_hash
   over "<issuerJwt>~<chosen disclosures>~"), decodePresentation (splits, base64url-decodes,
   recomputes every digest, returns the disclosed claims, the hidden count = digests in _sd minus
   matched disclosures, and the KB-JWT if present; throws TokenError with a human sentence).
2. share-crypto.ts: generateEncKey (non-extractable ECDH P-256, returns the public JWK),
   encryptForHolder and decryptFromIssuer (JWE ECDH-ES + A256GCM), sealShare and openShare (JWE dir
   + A256GCM with a random 256-bit key returned as base64url).

Tests: each template reveals exactly its claims; a hidden claim's name and value appear nowhere in
the presentation string; the KB-JWT verifies with cnf.jwk; sd_hash is correct; a mutated disclosure
fails decodePresentation; a disclosure added by an attacker fails; encrypt/decrypt round trip; the
wrong key fails; openShare with a wrong key fails.

Gate. Commit: "feat(credential): selective presentation, key binding and blind share crypto".
Post "presentCredential and share crypto are real" (A4 and A5 need them).
```

## A2-S3 · Verification pipeline [M] · T+3:30 · ~75 min

```
You are Agent 2 on Constancia. Build client-side verification as an async generator the UI renders
row by row.

Read: contracts §4.5, §4.6, §6 (LookupRequest, LookupResponse).
Skills: typescript, ponytail.

Build src/lib/credential/verify.ts: verifyPresentation(input, ctx) and verifyCertificate(sdJwt, ctx).
Emit CHECKING, then the outcome, for each of the five checks in the fixed order TOKEN, ISSUER,
SIGNATURE, HOLDER, LEDGER (contracts §4.6 lists the exact rule of each). Time each one (elapsedMs)
and fill `measured`:
  TOKEN "1,842 bytes · 7 hidden" · ISSUER the employer name · SIGNATURE "ES256 · 1.1 ms" ·
  HOLDER "key 0x9c… · bound" · LEDGER "block 1,204".
Failure sentences are specific and blame no one ("The employer is not accredited by the
consortium", "A disclosed value was changed after the employer signed it").
"Now" is the lookup's head.time. A lookup that throws LedgerUnreachable, or answers 503, is
UNAVAILABLE at ISSUER (and at LEDGER if it was the second call). After the first FAILED or
UNAVAILABLE, emit NOT_EXAMINED for the rest and return the Verdict.
No artificial delays here (pacing is the UI's job). Never send anything to lookup except
{ issuer, keyId, credentialHash }.

Tests with a fake lookup: authentic; changed disclosure → TOKEN; re-signed with another key →
SIGNATURE; issuer status NONE, PENDING and SUSPENDED → ISSUER; key missing → ISSUER; wrong KB key →
HOLDER; wrong nonce → HOLDER; not anchored → LEDGER; revoked → LEDGER; past validUntil → LEDGER;
key removed before anchoredAt → LEDGER; gateway unreachable → UNAVAILABLE at ISSUER with 3
NOT_EXAMINED; random text → TOKEN; assert the lookup received exactly 3 keys.

Gate. Commit: "feat(credential): sequential client-side verification pipeline".
```

## A2-S4 · `/verify` portal [M] · T+4:45 · ~105 min

```
You are Agent 2 on Constancia. Build the verification portal. This is the demo's centrepiece.

Read: DESIGN.md, the landing surface brief ("Memorable moment"), contracts §4.6, §6, §11
(DropZone, CheckList, CheckRow, Verdict, LineField, ClaimList, Receipt, Disclosure, Mono).
Skills: impeccable (Operate surface in the Constancia world; craft-floor before edits), nextjs-16,
react-19, tailwind-4, typescript.
Needs: A1-S1 (ClaimList), A3-S2 (POST /api/ledger/lookup on the memory ledger), A4-S1 (GET
/api/shares/:id). Until they exist use a fake lookup and a local fixture in
src/app/verify/_lib/fixture.ts, and delete them when the real ones land.

Build src/app/verify/page.tsx + _components + _lib:
1. Input, three ways: a share link (#s=<id>.<key> in the fragment: fetch the ciphertext, openShare,
   parse), a dropped or picked file (.sdjwt, .json) or the file handed over from the landing
   (takeHandoffFile), and pasted text. Detect a presentation versus a Verified CV by its JSON type.
   Reject anything over 256 KB before parsing.
2. src/app/verify/_lib/lookup-client.ts: a LookupFn that POSTs to /api/ledger/lookup and records the
   exact request (URL, method, JSON body, byte length) for the receipt.
3. Run verifyPresentation and render the five CheckRows (Certificate · Employer accredited · Employer's
   signature · Bound to its holder · Ledger record) with real measured values. Pace each row for
   legibility (≥ 450 ms on screen; the measured ms stay real). The LineField band scans while
   running and resolves at the end.
4. Verdict: AUTHENTIC / NOT AUTHENTIC (name the failed check; expected vs found in one sentence) /
   CANNOT VERIFY RIGHT NOW (the ledger gateway did not answer, "try again").
5. AUTHENTIC panel, data from the verified disclosures ONLY: the employer name (from the ledger,
   with its short account) prominently, a ClaimList of the shown claims, then "N more claims stay
   hidden by the holder" (read-only hidden rows). Label: "Read from the signed certificate".
   Holder: "Bound to a key, not a name" when no name was disclosed. validUntil when present.
6. "Check again" button: re-runs the whole pipeline against the same input (the revoke moment in the
   demo depends on it).
7. Receipt "What left your browser": the lookup body as sent (issuer, keyId, credentialHash), its
   byte length, the share fetch (an ID, no key). Beside it "What stayed on this device": the
   disclosed values and the decryption key. The numbers come from the recorded request.
8. Disclosure "Technical details": the JWS header, the issuer DID and kid, the key JWK thumbprint,
   the credential hash, the anchored block and time, the disclosure digests, the standards used
   (VC Data Model 2.0, SD-JWT, ES256, did:constancia).
9. "Try to forge it →" link to /verify/lab. aria-live announcements for each check.
Dynamic-import the credential library.

Verify with A2's own test certificates (fake lookup) now, real ones after M2. 1440, 1280x720, 390.
Detector. Gate.
Commit: "feat(verify): verifier portal with sequential checks, disclosed claims and receipt".
```

## A2-S5 · Verified CV: build, verify, timeline [M] · T+6:30 · ~75 min · HARD STEP: you implement the core

```
You are Agent 2 on Constancia. Join many certificates into one file that cannot be spliced, trimmed
after sealing, or mixed with a stranger's.

Read: contracts §4.4, §4.5, §4.6 (CvEvent, CvVerdict). A5 builds /cv on this and A1 polishes it.
Skills: typescript, ponytail.

Build src/lib/credential/passport.ts:
1. buildVerifiedCv({ items, aud, ttlSec, now }): two passes. Pass 1: for every item compute the
   presentation string without its KB-JWT and its sd_hash. Pass 2: cv_set = base64url(sha256(
   sorted sd_hashes joined with '~')); each item's holder key signs its KB-JWT carrying the shared
   aud, a shared random nonce, exp and cv_set. Return the JSON of contracts §4.4.
2. verifyVerifiedCv(input, ctx): for each entry run the five checks (events carry `entry`); HOLDER
   also recomputes cv_set from all entries and requires it to match. NOT_AUTHENTIC names the entry.
   AUTHENTIC returns every entry's Verdict and the timeline.
3. buildTimeline(entries): sort by startDate; absent endDate with employedNow = present; flag gaps
   longer than 1 month and overlaps; an entry with hidden dates sits last as "dates hidden". Pure,
   no network: A5 also uses it on certificates the holder fully owns.
4. Extend /verify (you own it) to render a CV: a header ("3 certificates · 3 employers · sealed
   together"), the Timeline, and each entry's CheckRows and ClaimList in a collapsible. Reuse the
   components from A2-S4.

Tests: three certificates verify; removing one presentation after sealing makes every remaining
entry fail HOLDER; adding another person's presentation fails; reordering still verifies; a CV with
one expired entry fails at that entry's LEDGER; gap and overlap detection; a single presentation
verifies without cv_set.

Gate. Commit: "feat(credential): Verified CV join sealed by every certificate key".
Post "buildVerifiedCv and buildTimeline are real" (A5 needs them).
```

## A2-S6 · Fake Letter Lab attacks [M] · T+7:45 · ~45 min

```
You are Agent 2 on Constancia. Write the four attacks the Lab runs live in the browser. Each must
fail at a different, named check.

Read: contracts §4.5 (runAttack, Attack, Sample), §4.6.
Skills: typescript, ponytail.

Build src/lib/credential/attacks.ts runAttack(id, sample). The sample is public/demo/sample.json
(A3 writes it): a real, anchored synthetic certificate plus its holder private JWK, published on
purpose so the Lab runs on any laptop.
1 'edit-claim': present the sample with the jobTitle disclosure rewritten to a better title.
  Expected: TOKEN.
2 'forge-signature': swap the issuer JWT's signature for one made with a fresh random key and keep
  the employer's kid. Expected: SIGNATURE.
3 'fake-employer': generate a brand-new key and an account address that was never accredited, issue
  a perfectly valid certificate to the sample holder from it, present it. Expected: ISSUER.
4 'stolen-certificate': present the sample but sign the KB-JWT with a fresh attacker key.
  Expected: HOLDER.
Each returns attack.changed as a human sentence ('jobTitle changed from "Logistics Analyst" to
"Director of Operations"') and expectedFailure.

Tests: run each through verifyPresentation with a fake lookup whose sample issuer is ACTIVE and any
other account is NONE; assert the failing check; assert the untouched sample still passes.
Gate. Commit: "feat(credential): fake letter lab attacks".
```

## A2-S7 · Real ledger, hardening, numbers [M] · T+8:30 · ~90 min

```
You are Agent 2 on Constancia. Make the library survive real browsers, the real ledger and bad input.

Read: contracts §4, §6.
Skills: typescript, ponytail.

Do:
1. After A3-S6 lands, run /verify against the real ledger (LEDGER_MODE=chain). Fix anything that
   differs from the memory ledger (timestamps, key windows, head.time).
2. Edge cases with clear messages: not text, empty, > 256 KB (before parsing), wrong typ or cty,
   an unknown @context, a duplicated or unreferenced disclosure, a future iat, a clock skewed by
   more than 5 minutes, an expired validUntil, a CV with 0 or more than 12 entries.
3. Measure: total local verification time excluding the network, for one presentation and a
   3-entry CV. Post the numbers for the demo narration.
4. Run the code-review skill on your diff since M0 and address real findings.
Add a regression test for every bug found. Gate. Commit: "fix(credential): real-ledger and edge-case hardening".
```

## A2-S8 · Stretch [X] · T+10:00 · ~90 min · only if everything is green

```
Pick one, in this order, and stop at a green push:
X1 Printable letter: a PDF (re-add pdf-lib in a tiny dep commit) rendering the holder's chosen claims
   in the Constancia world with a QR to the share link. The visible text is a convenience; the link
   is the proof. Lives in the holder's browser only. Hook it into the share builder through a small
   exported function and tell A5.
X2 Challenge mode: /verify shows a nonce QR, the vault answers it, the presentation is bound to that
   nonce (verifyPresentation's expectNonce already exists). Needs a tiny blind relay route from A4.
Commit: "feat(credential): <what>".
```
