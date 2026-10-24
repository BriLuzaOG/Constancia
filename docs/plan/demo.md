# ScholarKey — 3-minute demo

One story, told live: **a registrar issues a diploma → a recruiter verifies it → we try to forge
it and fail three times → the business and the privacy proof → close.** Everything on screen is
real: Privy login, Base Sepolia transactions, did:web resolution, browser-side verification.

Deliver it in the pitch language (Spanish for the Caracas judges); the UI stays in English.

## Roles

| Role | Does |
| --- | --- |
| **Presenter** | Talks. Never touches the laptop. |
| **Driver** | Clicks. Rehearsed to the click. Browser zoom 125%. |
| **Watcher** | Runs `pnpm check:demo` at T−15 and T−2. Holds the backup PDFs and video. Signals "switch to backup" with a hand sign. |
| Others | Q&A on their area (crypto, chain, privacy, design, business). |

## Screen setup (one laptop, one window per role, all full-screen)

1. **Profile "Registrar":** tab 1 `/` (landing), tab 2 `/issuer/issue` (signed in, plan active), tab 3 `/issuer/billing`.
2. **Profile "Recruiter" (incognito, nothing signed in):** tab 1 `/verify`, tab 2 `/verify/lab`.
3. **BaseScan** tab with the CredentialAnchor contract page (stays in the registrar profile).
Switch profiles with Alt+Tab, tabs with Ctrl+number. Notifications off. Downloads folder empty.

---

## The script (3:00)

### 0:00–0:20 · Hook (Registrar · landing)
**Screen:** the landing. The line band shifts as the Driver moves the mouse across it.
**Presenter:** "7.7 million Venezuelans live abroad¹. Every engineer, doctor or teacher among them
has to prove their degree in another country: apostilles, months of waiting, and a system a forger
beats with a PDF editor. ScholarKey makes a diploma prove itself in two seconds, and nobody,
not even us, keeps the graduate's data."

¹ UNHCR Global Appeal 2025: 7.77 million Venezuelan refugees and migrants worldwide, as of May 2024.
Check r4v.info for a newer figure the day before and update this line and the landing.

### 0:20–0:55 · Issue (Registrar · `/issuer/issue`)
**Driver:** clicks **Fill sample graduate** → **Issue certificate**.
**Screen:** six rows resolve: Prepared → Sealed → Signed → Fee sponsored → Recorded → Data
discarded. The PDF downloads.
**Presenter (over the rows):** "This is the registrar of Universidad Waraira, a demo university. She
signed in with her email. No wallet, no crypto, no popups. Right now her browser seals the PDF and
signs it with the university's key, which lives split in pieces and only works while she is signed
in. We just paid her network fee, exactly what it costs, just in time. And the public record holds
a random number, nothing else."
**Driver:** scrolls to the **What ScholarKey stored** receipt.
**Presenter:** "This is everything our database knows about María: a random ID and a transaction
hash. Her name, ID number and degree never reached our server."

### 0:55–1:35 · Verify (Recruiter · `/verify`)
**Driver:** Alt+Tab to the incognito window, drags the downloaded PDF onto the drop slot.
**Screen:** the band scans; five checks resolve one by one: Embedded credential ✓ · Issuer key
from waraira-university… ✓ · Signature ✓ · Document seal ✓ · Public record ✓ → the band floods
green → **AUTHENTIC**, with the data read from the signed credential.
**Presenter:** "Now I'm a recruiter in Madrid. No account. I drop the PDF. The key came from the
university's own website, the same trust as its HTTPS padlock. The signature and the seal were
checked here, in my browser."
**Driver:** points the cursor at the **What left your browser** receipt.
**Presenter:** "And here's the proof: what left this laptop was the university's identifier and that
random number, about 150 bytes. The PDF never left."

### 1:35–2:20 · Forgery Lab (Recruiter · `/verify/lab`)
**Presenter:** "Now let's cheat."
1. **Driver:** **Edit the printed diploma** → the honors become "Summa Cum Laude" on the page →
   the checks stop red at **Document seal**. **Presenter:** "Changing what's printed breaks the seal."
2. **Driver:** **Edit the hidden credential** → red at **Signature**. **Presenter:** "Changing the
   hidden data breaks the signature."
3. **Driver:** **Forge the university's signature** → red at **Signature**: "signed with a key the
   university never published". **Presenter:** "And signing it ourselves fails, because only the
   key on the university's domain counts. Every forgery fails at a named check, in public."

### 2:20–2:40 · Business + the chain sees nothing (Registrar)
**Driver:** `/issuer/billing` → toggles the plan **off** → `/issuer/issue` shows the lock.
**Presenter:** "Universities pay a subscription that covers the network fees. Without it they can't
issue, but every diploma they already issued keeps verifying, forever, for free."
**Driver:** BaseScan tab → the anchor transaction → its input data.
**Presenter:** "And this is all the blockchain knows: a random number and the university's
address. No names. That's how the right to be forgotten holds by design."
**Driver:** toggles the plan back **on** after the demo (not on stage).

### 2:40–3:00 · Close (landing)
**Presenter:** "W3C Verifiable Credentials, did:web, Base and Privy, and the registrar saw none
of it. The graduate holds the diploma; anyone can check it in seconds. ScholarKey: a degree that
travels with you."

---

## Pre-flight

**The night before:** check r4v.info and update the stat; issue fresh backup PDFs on production;
record a full 3-minute backup video of this exact script; top up the sponsor wallet.

**T−15 min:**
- [ ] `pnpm check:demo` against production: all green (sponsor ≥ 0.01 ETH, contract, RPC, demo
      did.json, lookup endpoint, Privy).
- [ ] Wake Render: open `/`, `/verify`, verify a backup PDF once. Free instances sleep after 15 min
      idle and take ~1 min to wake. Upgrade the web service to a paid instance for demo day, or ping
      it every 10 min.
- [ ] Registrar profile: signed in within the last hour, institution verified, **plan active**.
- [ ] Recruiter profile: incognito, signed out, zoom 125%.
- [ ] Downloads folder empty; Wi-Fi up and a phone hotspot ready.
- [ ] Watcher has on the desktop: `valid-diploma.pdf`, `forged-visual.pdf`, `forged-token.pdf`,
      `forged-signature.pdf`, `backup-demo.mp4`.

**T−2 min:** `pnpm check:demo` once more. Registrar tab on the landing, mouse resting off the band.

## Fallbacks (decide in one second)

| Failure | Do |
| --- | --- |
| Issuance hangs > 10 s on "Recorded" | Presenter keeps talking about just-in-time sponsoring; at 10 s the Driver drags `valid-diploma.pdf` instead: "here's one we issued an hour ago". |
| Privy session expired | Sign in again only if it takes < 10 s (email code on the Driver's phone); otherwise skip to verifying `valid-diploma.pdf`. |
| `/verify` shows CANNOT VERIFY RIGHT NOW | It's honest: the university's site or the RPC is down. Say so in one line, then switch to the backup video at the verify segment. |
| Network or projector failure | Play `backup-demo.mp4` from the current segment; the Presenter narrates over it. |

## Q&A cheat sheet (one breath each)

- **Why a blockchain if did:web already proves the key?** It's a timestamped public witness the
  university can't silently rewrite, bound to the issuer's key. It's also where revocation lives in
  the full design.
- **What if the university's website goes down?** Verification honestly says "can't verify right
  now". In production: cached DID documents and mirrors.
- **Can ScholarKey sign as a university?** No. Privy splits the key; signing needs the registrar's
  live session. Our server only pays fees and hands out random IDs.
- **Stolen key?** Key rotation with an on-chain deactivation history is designed (proposal §1.5.2)
  and is the next milestone; it's out of this MVP.
- **Right to be forgotten?** We never stored the data. The chain holds a random ID. When the
  graduate deletes the PDF, nothing links back to them. A "deleted" status is in the full design.
- **Can someone present another person's diploma?** The recruiter sees the signed national ID and
  compares it with the candidate's ID document. Holder binding is a known limit.
- **Why not a QR that points to the university's database?** That needs the university to keep the
  data forever and stay online. Here the PDF proves itself, and the university stores nothing.
- **Standards?** W3C Verifiable Credentials 2.0 as a `vc+jwt`, ES256K (secp256k1), did:web, Base
  Sepolia, Privy embedded wallets.
- **Cost?** A fraction of a cent of network fees per diploma on Base, covered by the subscription.
