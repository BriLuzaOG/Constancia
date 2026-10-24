# Agent 5 · Holder: vault, requests, share builder, Verified CV portal, Fake Letter Lab

**Mission:** the employee's side. Ask an employer for a certificate, receive it without anyone in the
middle reading it, show **one fact at a time**, and join every job into one Verified CV. Then let any
judge try to forge a letter and watch it fail. You make "reveal less, not more" something a person
can see.

**You own:** `src/lib/vault/`, `src/app/vault/**`, `src/app/cv/**`, `src/app/verify/lab/**`.

**Privacy rule you enforce:** certificates and their keys live only in this browser. The server sees
the two public keys and an opaque employee number in a request, and later a ciphertext it cannot open.
Nothing else leaves the device except what the holder explicitly chooses to share, and even that goes
out encrypted with a key that stays in the link's fragment.

Every step: follow the rules in [README.md](README.md). UI steps follow `DESIGN.md` and use the
`src/components/ui` primitives. The preview of "what the reader sees" is the most important element
on the share screens.

---

## A5-S1 · Vault and the request flow [M] · T+1:00 · ~105 min

```
You are Agent 5 on Constancia. Build the holder's local vault and the flow that asks an employer for
a certificate.

Read: PRODUCT.md, docs/plan/contracts.md §3, §5, §6 (NetworkState), §8 (request routes), §11.
Skills: impeccable (Operate; craft-floor before UI edits), nextjs-16, react-19, tailwind-4, zod-4,
typescript.
Needs: A2-S1 (createStoredSigner), A2-S2 (generateEncKey; until then use WebCrypto directly in a
local helper), A3-S2 (fetchNetworkState for the employer list), A4-S1 (the request routes). Until
those land, mock them in src/lib/vault/_mock.ts with the same types and delete it afterwards.

Build:
1. src/lib/vault/store.ts: a small VaultStore interface with an IndexedDB implementation and an
   in-memory one for tests. Records: requests { id, employer, employeeRef, kind, keyName, createdAt,
   status } and certificates { id, sdJwt, credentialHash, employer, employerName, kind, keyName,
   receivedAt }. The ECDH private CryptoKey of a request is stored here (non-extractable); the sign
   key is a signer in A2's keystore named "cert:<keyId>".
2. src/lib/vault/requests-client.ts: typed, zod-parsed fetch for POST /api/requests,
   GET /api/requests/:id, POST /api/requests/:id/ack.
3. /vault (first visit): a short, plain intro ("Your vault lives in this browser. The keys are made
   here and never leave."). No account, no email, no wallet words. A note: "Lose this device and you
   ask for your certificates again."
4. /vault/request: the employer picker (ACTIVE issuers from the ledger state, name and short account),
   an employee number field (zod ≤ 40), "I work here now" / "I used to work here". On submit: generate
   a fresh sign signer and a fresh ECDH key for THIS request, POST only { employer, employeeRef,
   kind, signJwk, encJwk }, store the request. The vault page lists pending requests ("Waiting for
   <employer>…") and polls each every 3 s while open.

Tests: the VaultStore logic on the in-memory implementation; the request payload contains the two
public keys, the employer, the employee number and the kind, and nothing else; a second request
creates different keys.
Verify at 1440 and 390, detector, gate.
Commit: "feat(vault): local vault and per-request key flow".
```

## A5-S2 · Receive, store and show certificates [M] · T+2:45 · ~105 min

```
You are Agent 5 on Constancia. When the employer delivers, open it, check it, and keep it.

Read: contracts §4.5 (verifyCertificate, decodePresentation), §4.6, §6 (lookupLedger), §11
(ClaimList, CheckList, Disclosure, Mono).
Skills: impeccable (Operate; craft-floor), react-19, tailwind-4, typescript.
Needs: A2-S2 (decryptFromIssuer), A2-S3 (verifyCertificate), A4-S4/S5 for a real delivery (until
then A4's own test deliveries or your mock).

Build:
1. When a polled request has `delivery`: decryptFromIssuer with the stored ECDH key → the SD-JWT;
   decode it; require cnf.jwk to equal our sign key (else a clear "not bound to your key" error);
   run verifyCertificate silently against the real lookup; store the certificate; ackRequest; drop
   the ECDH key. A status of DECLINED shows a calm "<employer> declined this request".
2. /vault: a card per certificate: employer name (from the ledger), CURRENT or PAST, issued date, a
   live status chip (verified on the ledger, or revoked on a date), and the actions Share, Download
   (.sdjwt text file), Add to my CV, Delete. Pending requests sit above them.
3. /vault/c/[id]: the holder's own view of every claim as a read-only ClaimList (the holder may see
   all of them), the five CheckRows from verifyCertificate (HOLDER says "not examined" here, that is
   fine), and a Technical details Disclosure (issuer DID, kid, hash, anchor block).
4. /vault/import (NEXT_PUBLIC_DEMO_MODE=1): import demo-pack/vault.json from A3's seed: each entry is
   { sdJwt, holderPrivateJwk }; importStoredSigner("cert:<keyId>", jwk) and store the certificate.

Tests: the receive pipeline on the in-memory store with fakes: a good delivery stores a certificate, a
certificate bound to another key is rejected, a decrypt failure leaves the request pending with an error.
Verify at 1440 and 390, detector, gate.
Commit: "feat(vault): receive, verify and show certificates".
Post "M1 vault side: certificates arrive".
```

## A5-S3 · Share builder [M] · T+4:30 · ~120 min · the demo's second beat

```
You are Agent 5 on Constancia. The holder decides, claim by claim, what a reader may see, and sees
the reader's view while deciding.

Read: contracts §4.3 (REVEAL_TEMPLATES, presentCredential, KB-JWT), §4.5 (sealShare), §8 (shares),
§11 (ClaimList, QrBlock, Panel); DESIGN.md.
Skills: impeccable (craft-floor; this is the one holder surface where the world should be loud),
react-19, tailwind-4, typescript.
Needs: A2-S2 (presentCredential, sealShare), A4-S1 (POST /api/shares), A1-S1 (ClaimList, QrBlock).

Build /vault/c/[id]/share:
1. Template chips (Proof of employment · Proof of income · Role · Identity · Everything) set the
   ClaimList toggles; every one of the twelve claims is then individually switchable. Choosing the
   identity template or the nationalId claim shows "This reveals your name and national ID".
2. The preview: "What the reader sees", a read-only ClaimList that updates as toggles change. Shown
   claims are values; hidden ones are solid bars. This preview is the loudest element of the page.
   Under it: "Hidden claims cannot be read or guessed, even by us."
3. Audience (a label, ≤ 40 chars, e.g. "Banco Demo") and expiry (1 hour, 24 hours, 7 days).
4. "Create share link": presentCredential({ credential, holder, reveal, aud, ttlSec }) with this
   certificate's own signer → sealShare → POST /api/shares → the link
   `${APP_URL}/verify#s=<id>.<key>`. Show it as a QrBlock with Copy, plus "Download as a file" (the
   presentation, .sdjwt). The key is only ever in the fragment. Keep a local history of shares
   (label, expiry, claims shown), never the key.
5. At least one claim must be shown to create a share.

Tests: the reveal set the UI builds matches presentCredential's argument for each template; the
share link has the shape #s=<32 hex>.<base64url>; nothing from the presentation is sent to the server
except the ciphertext.
Verify at 1440, 1280x720 (the QR must scan from a phone off a projector) and 390; detector; gate.
Commit: "feat(vault): selective share builder with live reader preview".
Post "share links work" so A2 can test /verify with real ones.
```

## A5-S4 · `/cv`: attach, verify, timeline [M] · T+6:30 · ~90 min

```
You are Agent 5 on Constancia. Attach every certificate you own and see your whole history, verified.

Read: contracts §4.4, §4.5 (verifyCertificate, buildTimeline), §11 (DropZone, Timeline, CheckRow).
Skills: impeccable (Operate; craft-floor), react-19, tailwind-4, typescript.
Needs: A2-S3 (verifyCertificate). buildTimeline arrives with A2-S5 (T+7:45); until then sort locally
and swap it in during A5-S5.

Build /cv:
1. "Attach your certificates": a multiple-file DropZone (.sdjwt) and a "Pick from your vault" list.
   You never upload anything: files are read in the browser.
2. Each attached certificate is decoded in full (the holder owns it) and verified with
   verifyCertificate against the real ledger. One row each: employer, job title, dates, and a status
   (VERIFIED, FAILED with the named check, UNAVAILABLE). A certificate whose cnf key is not in this
   vault gets "Issued to a different vault: it can't be joined here". Duplicates (same hash) collapse.
3. The Timeline (A2's buildTimeline when available) over the verified entries: gaps and overlaps
   named ("Gap · 4 months between …"), the current job marked present.
4. Checkboxes choose which entries go into the CV.

Tests: attaching two files and a duplicate; an unbound certificate is excluded; the status mapping.
Verify at 1440 and 390, detector, gate.
Commit: "feat(cv): attach, verify and see the timeline".
```

## A5-S5 · Create the Verified CV [M] · T+8:00 · ~60 min

```
You are Agent 5 on Constancia. Seal the chosen history into one file and share it.

Read: contracts §4.4, §4.5 (buildVerifiedCv, sealShare), §11 (ClaimList, Timeline, QrBlock).
Skills: impeccable (craft-floor), react-19, tailwind-4, typescript.
Needs: A2-S5 (buildVerifiedCv, buildTimeline), A4-S1 (POST /api/shares).

Build on /cv:
1. Per included entry, pick what it reveals: a CV-level default (employment + role) with the same
   templates and ClaimList toggles per entry in a collapsible. Warn once: "Reveal your name in at
   least one entry, or the reader will not know whose CV this is."
2. The preview: "What the reader sees", a Timeline of exactly the chosen entries and visible fields
   (hidden dates sit last as "dates hidden").
3. Audience and expiry, then "Create Verified CV": buildVerifiedCv with each certificate's own signer
   → sealShare → POST /api/shares → link `${APP_URL}/verify#s=<id>.<key>`, QrBlock, Copy, and
   "Download as a file" (.cv.json). A2's /verify renders it.
4. Use A2's buildTimeline everywhere now; delete the local sort.

Tests: the items passed to buildVerifiedCv match the UI selection; excluded entries are absent; the
link shape.
Gate. Commit: "feat(cv): create and share a Verified CV".
Post "Verified CV links work" so A2 and A1 can test /verify's CV view.
```

## A5-S6 · Fake Letter Lab [M] · T+9:00 · ~75 min

```
You are Agent 5 on Constancia. Let anyone try to forge a work letter, and watch it fail at a named
check. Judges can run this on their own laptop.

Read: contracts §4.5 (runAttack, Attack, Sample), §4.6; DESIGN.md.
Skills: impeccable (craft-floor), nextjs-16, react-19, tailwind-4, typescript.
Needs: A2-S6 (attacks), A3-S7 (public/demo/sample.json; until then build a sample locally from the
memory ledger's seeded identities).

Build src/app/verify/lab/page.tsx:
1. The original: fetch /demo/sample.json, present it fresh with its published holder key and run
   verifyPresentation with the same CheckList. It passes. Say plainly that the sample is synthetic and
   its key is public on purpose.
2. Four attack cards in order: "Edit a claim" (stops at Certificate) · "Forge the employer's
   signature" (stops at Signature) · "Pretend to be an employer" (stops at Employer accredited) ·
   "Use someone else's certificate" (stops at Bound to its holder). Clicking one runs runAttack, shows
   attack.changed in a sentence, then verifyPresentation on the forged presentation with the same
   CheckList, so the failure resolves red at its named row with its own reason.
3. A fifth, non-clickable card: "Revoke the letter → fails the ledger record. Ask the employer to
   revoke it" with a link to /employer/issued.
4. "Download the forgery" so a judge can drop it into /verify themselves, and a Reset.

Verify all four attacks end at the expected check. Gate.
Commit: "feat(verify): fake letter lab with four live attacks".
```

## A5-S7 · Hardening and production e2e [M] · T+10:15 · ~75 min

```
You are Agent 5 on Constancia. Make every unhappy path clear and calm, then walk the whole demo on
the Render deploy.

Skills: impeccable (harden, clarify, adapt), react-19, typescript.

Do: a certificate whose key is missing from this browser; a request that never gets answered
(polling backs off, copy stays honest); an unknown or expired request ID; offline and ledger-
unreachable states; a very large attached file (reject > 256 KB before reading); keyboard-only and
screen-reader pass on the request form and the share builder (labels, aria-pressed on toggles, focus
to the link after creating it); reduced motion; the mobile layout (the share link opens from a
phone). Copy via impeccable clarify: plain, specific, no wallet/gas words. Then on production: request
→ receive → share → verify, a 3-entry CV, the four lab attacks. Fix integration bugs in your area. Run
the code-review skill on your diff since M0 and address real findings.
Gate. Commit: "fix(vault): failure modes, edge hardening and production integration".
```
