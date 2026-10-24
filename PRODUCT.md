# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Institution admins (issuers).** Registrar or academic-records staff at a university (IES). Not technical, never touched a wallet. Job: turn a graduate's record into an official, verifiable Certificate of Graduation and hand it over, then forget the data.
- **Verifiers.** Recruiters, employers, foreign universities, licensing bodies. They receive a PDF from a candidate and need to know in seconds whether it is authentic, untampered and really from that university. No account, no contact with the university.
- **Holders.** Graduates, including the Venezuelan diaspora who need their degrees recognised abroad. They keep the PDF offline and decide who sees it. They never log in.
- **Evaluation context.** Built in 20 hours for Platanus Hack 26 Caracas, trust track. Judges weigh technical depth, impact, originality, ambition and execution, and see the product in a 3-minute live demo.

## Product Purpose

ScholarKey lets universities issue academic credentials that anyone can verify in seconds and nobody can forge, without the university or the platform keeping the student's data. Success: a recruiter drops a diploma PDF and gets a trustworthy yes/no with the exact reason, and a forged or edited diploma always fails at a named check.

## Positioning

A hybrid trust model no pure-Web2 or pure-Web3 product can claim honestly:

- The credential is a W3C Verifiable Credential (VCDM 2.0) JWT, signed ES256K, embedded inside an ordinary PDF the graduate owns.
- The signing key is bound to the university's own web domain through `did:web` (`/.well-known/did.json`), so trust rides on the reputation the institution already has.
- The blockchain (Base Sepolia) only stores a blind anchor: credential ID hash, issuer address, timestamp. No personal data on-chain, ever.
- Verification runs in the verifier's browser. The server only sees the issuer DID, the key id and the credential ID, never the document.
- The platform stores no student data, which makes GDPR's right to be forgotten and FERPA disclosure rules hold by construction.
- Admins use email login. No wallets, seed phrases, popups or gas: Privy holds the key in shards and a sponsor wallet funds each transaction just in time.

## Operating Context

- Admin flow: sign in with email → register institution and domain → publish the generated `did.json` on the institution's site → issuing unlocks once the published key matches → fill the graduate form → download the sealed PDF.
- Verifier flow: open the verify link printed on the PDF → drop the file → watch each check pass or fail in sequence → read the credential data, taken only from the verified token.
- Subscription: issuing requires an active subscription (mock toggle in the MVP). Verification always works.
- Demo context: projector, live network, 3 minutes, judges watching the verifier react in real time.

## Capabilities and Constraints

**In the MVP**
- Institution onboarding with Privy email login, an embedded wallet, a generated `did.json`, and an issuing lock until the published DID key matches.
- Issuance in the admin's browser: VC JWT signed ES256K through Privy `secp256k1_sign`, a PDF certificate with the JWT embedded and a byte-range seal over the visual layer, and an anchor transaction on Base Sepolia with just-in-time gas sponsoring.
- A public, stateless verifier with sequential checks: extract token → resolve `did:web` (server, SSRF-guarded: HTTPS only, timeouts, private-IP block) → verify signature locally → document seal intact → on-chain anchor exists and was written by the DID key.
- Mock subscription toggle gating write operations.
- A database holding only institution records and a blind issuance index (credential ID, institution, tx hash, timestamp).

**Out of the MVP (decided)**
- On-chain status registry: no revoke, reactivate or delete.
- Credential management dashboard.
- Key rotation and key-deactivation history.
- Strict PDF/A-3: a regular PDF with the embedded JWT.
- Real Stripe: replaced by a mock subscription toggle.
- The performance, privacy and usability evaluation suite (objective 9).

**Stack:** Next.js 16.4 App Router, React 19.3, Tailwind CSS 4, TypeScript strict, pnpm, oxlint and oxfmt, PostgreSQL with Prisma 7, Privy, viem, Solidity 0.8.28 on Base Sepolia, jose plus @noble/curves and @noble/hashes, pdf-lib. Deployed on Render through the existing CD workflow. UI entirely in English.

**Terminology:** Institution (issuer), Graduate (holder), Verifier, Credential, Certificate of Graduation, Anchor, Seal, `did:web`. Users never see "wallet", "gas" or "seed phrase" outside an optional technical-details disclosure.

## Brand Commitments

- Name: **ScholarKey**.
- Must not feel like: the crypto/Web3 look (neon on black, gradients, coins, chain imagery), government bureaucracy (gray form portals, stamp overload, legalese), or a generic SaaS template (purple gradients, icon-tile grids, glass cards).
- English UI for global reach.

## Evidence on Hand

- The academic proposal: problem, architecture and objectives (authors: Antonio Russoniello, Rafael Lara, Gustavo Kufatty).
- No customers, pilots, partner universities, testimonials or benchmarks exist. Do not invent any.
- All demo institutions, graduates and records are synthetic and must be labelled as such where they could be mistaken for real.
- Any statistic used in the pitch (credential fraud, diaspora size) must carry a cited source.

## Product Principles

1. **Prove, don't claim.** Every trust promise appears as a check the user watches pass or fail, with the evidence one click away.
2. **Zero Web3 for humans.** No step requires knowing what a wallet, gas or a seed phrase is.
3. **The server is blind, and shows it.** Make visible what left the browser and what was stored: hashes only.
4. **Fail loudly and specifically.** A failed verification names the exact check, what was expected, and what was found.
5. **The institution's domain is the root of trust.** Always show the domain the key was resolved from.
