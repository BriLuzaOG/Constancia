# Agent 2 · Credential core: VC, ES256K, PDF seal, verification, attacks

**Mission:** the cryptographic heart, as pure, tested TypeScript that runs in the browser and in
Node. You build the W3C VC JWT, ES256K signing and verification, the certificate PDF with its
byte-range seal, the five-check verification pipeline, and the attacks the Forgery Lab runs.

**You own:** `src/lib/credential/`, `public/contexts/`, `public/fonts/` (certificate fonts).

Your code has no UI and no server. Everything takes its dependencies as arguments: the signer
(`DigestSigner`) and the lookup (`LookupFn`). That keeps it testable and lets A3, A4 and A5 plug
in. Tests are your proof: every step ships vitest tests.

Every step: follow the rules in [README.md](README.md).

---

## A2-S1 · VC 2.0 + ES256K JWT · T+0:45 · ~75 min

```
You are Agent 2 on ScholarKey. Build the credential and its ES256K signature.

Read: PRODUCT.md, docs/plan/contracts.md §3, §4.1, §4.2, §4.4.
Read the READMEs of @noble/curves v2 (secp256k1 sign/verify, prehash option, signature formats)
and jose v6 (base64url, decodeProtectedHeader, decodeJwt) in node_modules.
Skills: typescript, zod-4, ponytail.

Build in src/lib/credential/:
1. types.ts: fill in the stub exactly as in contracts, plus graduateRecordSchema (zod 4): trimmed
   strings; fullName 2–120; nationalId 3–32; program 2–120; degreeLevel enum; graduationDate ISO
   date, not in the future; honors optional, ≤ 60.
2. vc.ts: buildCredential({ record, issuer, credentialId, sealDigest, issuedAt, appUrl }) returns
   a GraduationCredential (contracts §4.1; @context[1] = `${appUrl}/contexts/scholarkey-v1.jsonld`).
3. jwt.ts: encodeSigningInput(header, payload), assembleJwt(signingInput, sig64),
   decodeCredentialJwt(jwt) → { header, payload, signingInput, signature } with light zod checks.
4. es256k.ts: localSigner(privateKey): DigestSigner (tests + the Forgery Lab attacker);
   normalizeSignature(sig: Uint8Array | Hex) → 64-byte low-s r||s (accept 65-byte r||s||v);
   verifyJwtSignature(jwt, jwk); jwkFromPublicKey(uncompressed); addressFromJwk(jwk) (viem's
   publicKeyToAddress or keccak of x||y).

Tests (src/lib/credential/*.test.ts): sign/verify round-trip with a random key; any payload or
header byte change fails; wrong key fails; high-s signature is normalized and verifies;
addressFromJwk(jwk) === privateKeyToAddress(key); a realistic credential JWT stays under 4 KB.

Gate. Commit: "feat(credential): VC 2.0 builder and ES256K JWT sign/verify".
```

## A2-S2 · Byte-range seal + createSealedCredentialPdf · T+2:00 · ~90 min

```
You are Agent 2 on ScholarKey. Embed the JWT in the PDF so that any edit to the document is
detectable. This is the same idea as the ByteRange of a PDF digital signature.

Read: docs/plan/contracts.md §4.3 and §4.4 (the spec is exact; follow it to the byte).
Skills: typescript, ponytail.

Build in src/lib/credential/:
1. seal.ts:
   - addSealPlaceholder(doc: PDFDocument): an UNCOMPRESSED embedded-file stream via
     doc.context.stream(bytes, dict) (NOT doc.attach(): it compresses), 8192 bytes of 0x20, dict
     /Type /EmbeddedFile /Subtype /application#2Fjwt /ScholarKeySeal true; a Filespec named
     scholarkey-credential.jwt in Names/EmbeddedFiles and the catalog /AF.
   - findSealRegion(bytes) → { start, length: 8192 } | null (marker → next `stream` → skip EOL).
   - computeSealDigest(bytes) (sha256 from @noble/hashes → base64url; sync, works everywhere).
   - writeJwtIntoSeal(bytes, jwt) (ASCII, ≤ 8192, throws otherwise), extractSealedJwt(bytes),
     verifySeal(bytes, expectedDigest) (copy, blank the region, hash, compare).
2. layout.ts + a minimal renderCertificate(record, meta) (plain text lines for now; the real
   design is S4) and CERT_LAYOUT with the coordinates you used.
3. issue.ts: createSealedCredentialPdf(args) = render → placeholder → save({useObjectStreams:false})
   → digest → onProgress('sealed', "<KB> · seal sha-256") → buildCredential → sign via args.sign →
   assemble JWT → write into seal → onProgress('signed', "ES256K · <kid>") → return.

Tests: extract === the JWT; verifySeal true; flip one byte outside the region → false; change the
JWT payload inside the region → verifySeal still true but verifyJwtSignature false; a PDF without a
seal → extract returns null; oversize JWT throws. With WRITE_SAMPLE=1 a test writes
/tmp/scholarkey-sample.pdf: open it and check the attachment shows up in a PDF viewer.

Gate. Commit: "feat(credential): byte-range PDF seal with embedded VC JWT".
```

## A2-S3 · Verification pipeline · T+3:30 · ~75 min

```
You are Agent 2 on ScholarKey. Build the client-side verification as an async generator the
verifier UI renders step by step.

Read: docs/plan/contracts.md §4.5 and §8 (/api/verify/lookup shapes and error codes).
Skills: typescript, ponytail.

Build src/lib/credential/verify.ts: verifyCredential(pdf, lookup): AsyncGenerator<CheckEvent, Verdict>.
Emit CHECKING, then the outcome, for each check in order; time each one (elapsedMs, measured):
1 TOKEN: extractSealedJwt + decode. FAILED: "No ScholarKey credential found in this file" /
  "The embedded credential is damaged". measured: "1,842 bytes".
2 ISSUER: lookup({ did: payload.issuer.id, kid: header.kid, credentialId }) (kid must belong to the
  did). Map errors: ISSUER_UNREACHABLE → UNAVAILABLE ("The university's website didn't answer. Try
  again later."); DID_NOT_FOUND / DID_INVALID / KEY_NOT_FOUND → FAILED. measured: resolved domain.
3 SIGNATURE: verifyJwtSignature with the key from the DID document. measured: "ES256K · 2.4 ms".
4 SEAL: verifySeal(pdf, payload.documentSeal.digest). measured: "212 KB hashed".
  FAILED detail: "The document was changed after the university issued it."
5 ANCHOR: response.anchor.anchored AND response.issuerAddress === addressFromJwk(jwk), recomputed
  locally. CHAIN_UNREACHABLE → UNAVAILABLE. measured: anchored date + "Base Sepolia".
After the first FAILED/UNAVAILABLE, emit NOT_EXAMINED for the rest and return the Verdict.
No artificial delays here (pacing is UI's job). Never send anything to lookup except
{ did, kid, credentialId }.

Tests with a fake lookup: authentic; edited visual → SEAL; edited token → SIGNATURE; key not in
the DID document (KEY_NOT_FOUND) → ISSUER; not anchored → ANCHOR; issuer unreachable → UNAVAILABLE at
ISSUER with 3 NOT_EXAMINED; random bytes → TOKEN; assert lookup received exactly 3 keys.

Gate. Commit: "feat(credential): sequential client-side verification pipeline".
```

## A2-S4 · Certificate design · T+5:15 · ~90 min · needs DESIGN.md (A1-S3)

```
You are Agent 2 on ScholarKey. Make the certificate beautiful. It is what the graduate keeps and
what judges see first.

Read: DESIGN.md (tokens, certificate guidance), the landing surface brief, contracts §4.4 (CERT_LAYOUT).
Skills: impeccable (read reference/craft-floor.md; the certificate is a Read surface in the
ScholarKey world), typescript.

Build src/lib/credential/pdf.ts renderCertificate(record, meta, assets):
- A4 landscape on white paper, ink text. University name (display face), "Certificate of
  Graduation", the graduate's name very large, degree level + program, honors when present,
  graduation date, issue date.
- Right edge: the ScholarKey verification stub, a vertical band of the four line inks drawn as
  vector rects (≥ 1.2 pt pitch so it prints cleanly), with a white window holding a vector QR
  (qrcode's QRCode.create(...).modules drawn as rects) to `${verifyUrl}`, the short credential ID,
  the issuer domain, and "Digitally sealed. Any edit breaks the seal."
- Fonts embedded via @pdf-lib/fontkit from public/fonts/ (download the OFL TTFs named in DESIGN.md).
  Take font bytes as an `assets` argument: the browser fetches /fonts/*, tests read from disk.
  Export loadCertificateAssets() for the browser.
- Update CERT_LAYOUT with the real boxes (the visual attack paints over `honors`).
Visual check: WRITE_SAMPLE=1 test → /tmp/scholarkey-sample.pdf → magick -density 110 to PNG (or
open in a browser) and look. Two rounds max. Synthetic sample data only.

Gate. Commit: "feat(credential): certificate design with line-ink verification stub and QR".
```

## A2-S5 · Forgery Lab attacks · T+6:45 · ~75 min

```
You are Agent 2 on ScholarKey. Write the three attacks the Forgery Lab runs live in the browser.
Each must fail at a different, named check.

Read: contracts §4.4 (Attack, runAttack), §4.5.
Skills: typescript, ponytail.

Build src/lib/credential/attacks.ts runAttack(id, pdf):
1 'edit-visual': load with pdf-lib, paint a paper-coloured rect over CERT_LAYOUT.honors and draw a
  better honor ("Summa Cum Laude"); save({useObjectStreams:false}). Assert the sealed JWT still
  extracts. Expected: fails at SEAL.
2 'edit-token': decode, change credentialSubject.degree.honors (or the name), re-encode the payload,
  keep header and signature, write back into the seal region. Expected: SEAL passes, fails at SIGNATURE.
3 'forge-signature': same edit, re-signed with a fresh random key while keeping the university's
  kid. Expected: fails at SIGNATURE ("signed with a key the university never published").
Each returns attack.changed as a human sentence, e.g. 'Honors changed from "—" to "Summa Cum Laude"
on the printed page'.

Tests: run each through verifyCredential with a fake lookup; assert the failing check.
Gate. Commit: "feat(credential): forgery lab attacks".
```

## A2-S6 · Real signer integration + hardening · T+8:00 · ~2 h · pair with A3/A4

```
You are Agent 2 on ScholarKey. Make the library survive real browsers, the real Privy signer and
real-world PDFs.

Read: contracts §4, §7 (usePrivySigner), the issuer flow in agent-4 S6.
Skills: typescript, ponytail.

Do:
1. public/contexts/scholarkey-v1.jsonld: a small JSON-LD context defining GraduationCredential,
   Graduate, nationalId, degree, honors, graduationDate, documentSeal.
2. Pair with A4 on the first real issuance (/issuer/issue): check that the Privy signature
   normalizes (65 bytes, high-s), fonts load in the browser, and pdf-lib is dynamically imported only
   on /issuer/issue, /verify and /verify/lab.
3. Edge cases with clear messages: non-PDF, empty, > 15 MB (reject before parsing), encrypted PDF,
   a PDF re-saved by Preview/Acrobat (seal broken, or token stripped → TOKEN failed with "This file
   was re-saved by another program and lost its credential").
4. Measure: total local verification time on the sample (excluding network). Post the numbers for
   the demo narration.
Add a regression test for every bug found. Gate. Commit: "fix(credential): real-signer and edge-case hardening".
```

## A2-S7 · Production e2e support · T+12:00 · ~90 min

```
You are Agent 2 on ScholarKey. Walk the full demo on the Render deploy (issue → verify → three lab
attacks) with A4/A5 and fix anything in src/lib/credential/. Then run the code-review skill on your
diff since the M0 commit and address real findings. Stretch, only if all green: visible-text
cross-check (pdf.js text vs signed claims) as an extra detail on SEAL failures.
Commit: "fix(credential): …".
```
