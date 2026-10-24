# Constancia — 3-minute demo

One story, told live: **an employee asks for a work certificate → HR issues it → the employee shows
one fact → the whole career joins into one verified CV → we try to cheat and fail → the consortium
behind it.** Everything on screen is real: the four-validator ledger, account-abstraction writes with
zero fees, selective disclosure, browser-side verification.

Deliver it in the pitch language (Spanish for the Caracas judges); the UI stays in English.

## Roles

| Role | Does |
| --- | --- |
| **Presenter** | Talks. Never touches the laptop. |
| **Driver** | Clicks. Rehearsed to the click. Browser zoom 125%. |
| **Watcher** | Runs `pnpm check:demo` at T−15 and T−2. Holds the backup files and video. Signals "switch to backup" with a hand sign. |
| Others | Q&A on their area (credentials, ledger, privacy, design, business). |

## Screen setup (one laptop, three Chrome profiles, all full-screen)

1. **Registrar** (HR at "Orinoco Logistics (demo)"): tab 1 `/employer/requests` (signed in), tab 2
   `/employer/issued`, tab 3 `/ledger`.
2. **Holder** (María): tab 1 `/vault` (vault already holds her two past certificates, **no** current
   one), tab 2 `/cv`.
3. **Recruiter** (incognito, nothing signed in): tab 1 `/verify`, tab 2 `/verify/lab`.
Switch profiles with Alt+Tab, tabs with Ctrl+number. Notifications off. Downloads folder empty.
Optional: a phone that opens the share link from the QR, to show it works with no app.

---

## The script (3:00)

### 0:00–0:20 · Hook (landing)
**Screen:** the landing. The line band shifts as the Driver moves the mouse across it.
**Presenter:** "A work letter in Venezuela is a PDF anyone can fake in five minutes, and banks,
landlords and embassies still have to trust it. Constancia turns it into a credential that proves
itself, written on a ledger no single company controls, and that shows only the one fact the
worker chooses."
*(No number here unless it has a source. If you add the diaspora figure, cite it on the landing too:
r4v.info, re-checked the day before.)*

### 0:20–1:00 · Request and issue (Holder → Registrar → Holder)
**Driver (Holder):** `/vault/request` → Orinoco Logistics, employee number E-1042, "I work here now" →
Request. **(Registrar):** the request appears → **Review and issue** → the form is prefilled →
**Issue certificate**. Five rows resolve: Request opened → Certificate signed → Written to the ledger
(block, fee 0) → Delivered, encrypted → Data discarded. **(Holder):** the certificate appears, verified.
**Presenter (over the rows):** "María asks her employer for a certificate. HR signs in with a key on
their device, no wallet and no password. The browser signs the certificate, writes only a hash to the
ledger, and encrypts the certificate so only María can open it. The network fee is zero. Nobody in
the middle, not even us, can read it."
**Driver:** shows the **What Constancia stored** receipt. **Presenter:** "This is all our server knows:
two public keys, an employee number and a block of ciphertext."

### 1:00–1:40 · Prove one fact (Holder → Recruiter)
**Driver (Holder):** **Share** → template **Proof of employment** → the preview shows "employed since
2024" and everything else as solid bars → audience "Banco Demo" → **Create share link** → QR.
**(Recruiter):** opens the link. The band scans, five checks resolve, the band floods green →
**AUTHENTIC**: the employer name, "accredited by the consortium", "employed since …", and "9 more
claims stay hidden".
**Presenter:** "The bank learns one fact. Her name, her ID, her salary and her title are hidden by
mathematics, not by a promise. The checks ran in the bank's browser."
**Driver:** points at **What left your browser**. **Presenter:** "What went out was the employer's
identifier, a key id and a hash. The certificate never left."

### 1:40–2:10 · One CV, every job (Holder → Recruiter)
**Driver (Holder):** `/cv` → **Pick from your vault** (three certificates) → the verified timeline →
untick the salaries, reveal the name once → **Create Verified CV** → link. **(Recruiter):** opens it:
the entries resolve one by one down the timeline, then the band floods green.
**Presenter:** "Her last three employers, one file. Every certificate's own key signed the whole set,
so nobody can slip in a job that is not hers, or quietly drop one after it was sealed."

### 2:10–2:40 · Cheat, then revoke (Recruiter → Registrar → Recruiter)
**Driver (Recruiter):** `/verify/lab` → **Pretend to be an employer** → red at **Employer accredited**.
**Edit a claim** → red at **Certificate**. **Presenter:** "Four forgeries, four named checks, in
public."
**Driver (Registrar):** `/employer/issued` → **Revoke** María's certificate. **(Recruiter):** the bank's
link → **Check again** → red at **Ledger record**, "revoked by the employer".
**Presenter:** "When the employee leaves, HR revokes, and the same link stops working."

### 2:40–3:00 · The consortium, and close (Registrar · `/ledger`)
**Driver:** `/ledger`: four validators in four colours, blocks rotating between them.
**Presenter:** "These four validators are a chamber of commerce, a bank, a university and a ministry
(fictional here). An employer is accredited only when two of them approve. No single company runs
this ledger, not even us."
**Close:** "W3C credentials, selective disclosure, a consortium ledger and account abstraction, and the
HR clerk saw none of it. Constancia: your work history, verified, shared one fact at a time."

---

## Pre-flight

**The night before:** rehearse the whole script; issue fresh backup files (`valid-presentation.sdjwt`,
`valid-cv.cv.json`) and the four forged files from the Lab; record a full 3-minute backup video of
this exact script; check the VPS disk and that the four validators are up; copy `demo-pack/` to the
team drive. **After every rehearsal**, delete the rehearsal certificates from the Holder's vault and
revoke them in `/employer/issued`, so the live CV beat shows exactly three entries.

**T−15 min:**
- [ ] `pnpm check:demo` against production: all green (four validators, fresh block, contract and
      EntryPoint present, relayer, lookup, sample verifies, DB).
- [ ] Wake Render: open `/`, `/verify`, `/ledger`, run the sample in the Lab once. Free instances sleep
      after 15 min idle and take about a minute to wake. Upgrade the web service for demo day, or ping
      it every 10 min.
- [ ] Registrar profile: signed in within the last hour (the session lasts 8 h), organization ACTIVE,
      demo directory loaded.
- [ ] Holder profile: vault holds the two past certificates and no current one.
- [ ] Recruiter profile: incognito, signed out, zoom 125%.
- [ ] Downloads folder empty; Wi-Fi up and a phone hotspot ready.
- [ ] Watcher has on the desktop: the backup files above and `backup-demo.mp4`.

**T−2 min:** `pnpm check:demo` once more. Registrar tab on the landing, mouse resting off the band.

## Fallbacks (decide in one second)

| Failure | Do |
| --- | --- |
| Issuance hangs > 10 s on "Written to the ledger" | Presenter keeps talking about the consortium; at 10 s the Driver opens the pre-issued certificate already in María's vault: "here's one we issued an hour ago". |
| Registrar session expired | Sign in again (a click, the device key signs) only if it takes < 10 s; otherwise skip to sharing the pre-issued certificate. |
| `/verify` shows CANNOT VERIFY RIGHT NOW | It is honest: the ledger gateway is down. Say so in one line, then switch to the backup video at the verify segment. |
| A validator is down | `/ledger` shows it; it is a feature. Say "three of four keep the chain going" and carry on. |
| Network or projector failure | Play `backup-demo.mp4` from the current segment; the Presenter narrates over it. |

## Q&A cheat sheet (one breath each)

- **Why a consortium and not a public chain?** Employers and institutions share the cost and the
  governance, nobody pays per record, and a chain that only admitted employers can write to is the
  right shape for "who is allowed to certify employment". The ledger is open to read.
- **Who joins, and who decides?** A quorum of members approves each employer. In the demo, two of four.
  Production would raise it to two thirds.
- **Is this zero-knowledge?** It is selective disclosure: a hidden claim is a salted hash, so the
  reader learns nothing about it. True zero-knowledge predicates (say, "salary above X") are on the
  roadmap; today the employer issues an income band for that purpose.
- **Does the ledger prove the employer told the truth?** No. It proves who said it and when. An
  accredited employer that lies can be suspended by the consortium, and then every certificate it issued
  fails.
- **What does the ledger reveal?** A hash, the employer and a time. No names, no claims.
- **Can Constancia read my certificates?** No. We store ciphertext and public keys. The keys live in your
  browser and in the link's fragment, which is never sent to a server.
- **Lost phone?** You ask for the certificates again; each request makes a fresh one. Multi-device
  recovery through multi-owner accounts is next.
- **Can someone replay my link?** Until it expires, yes. A verifier-chosen challenge removes that and is
  a stretch goal.
- **Why account abstraction?** HR works with a key on their device: no wallet, no fee, many devices per
  organization, and every write still comes from an accredited account.
- **Why zero fees?** Writes are gated by accreditation, not by price, and the members run the validators.
- **If the four validators run on one host, is it decentralised?** In the demo they do, and we say so. The
  genesis, the code and the contract do not change when four organizations run one each.
- **Standards?** W3C Verifiable Credentials 2.0 secured with SD-JWT, W3C DID Core with our own
  `did:constancia` method, ES256, ERC-4337, Besu QBFT.
- **Cost?** Zero network fees. Operating cost is shared by the members. No prices are decided.
- **Can an employer's old certificates be checked if the employer closes?** Yes, the ledger keeps them.
  A "retired" state for closed employers is a small addition after the MVP.
