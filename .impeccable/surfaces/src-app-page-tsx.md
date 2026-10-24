---
version: 2
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/ui","src/app/verify","src/app/vault","src/app/employer","src/app/ledger"]
---

# Landing (`/`)

## Scope and mode
Public landing at `/`. Mode: **Persuade**. It establishes Constancia's visual world, which `/verify`, `/vault`, `/cv`, `/employer/**` and `/ledger` inherit (Operate surfaces: same world, more restraint).

## Audience, job, action
- Who must act: recruiters, landlords and consulates holding a work letter; employers (HR); employees who need to prove one fact; hackathon judges on a projector.
- What they must believe: a work letter can prove itself in seconds, the holder shows one fact at a time, and no company or public chain sits in the middle.
- Primary action, in working form: **drop a certificate** into the slot on the first viewport (hands the file to `/verify` via `src/lib/handoff.ts`). Secondary: **Open your vault** → `/vault`; text link **I'm an employer** → `/employer`.
- Proof on the page: the five checks, selective disclosure, the consortium, the honest limits. No invented customers, numbers or logos.

## Direction contract
THESIS: Truth resolves when you look closely. Constancia's surfaces are Caracas kinetic op-art (the Cruz-Diez / Soto lineage): fields of fine pure-colour lines that interfere at rest and resolve into one solid colour when a certificate is verified. A hidden claim is a solid bar the line field has resolved into; on `/ledger` the four validators are the four line inks. It refuses the category default of a navy shield, a centred upload box and three feature cards.
OWN-WORLD: White modernist ground #F7F6F2, ink #111111; four pure line inks red #E4002B, blue #0047BB, green #00A651, yellow #FFD100, used as dense vertical line fields (never gradients, never glow); text-safe darks for red and green; a heavy expanded grotesk display (Archivo), a plain grotesk for text, Geist Mono for IDs and hashes; square corners, 2–4px black rules, no shadows, no glass, no rounded cards.
STORY: The visitor learns a work letter can prove itself, believes it by watching the lines resolve, then drops a certificate or opens their vault.
FIRST VIEWPORT: Nav across the top (wordmark left; Verify · Employers · Vault · Ledger right). The headline is set left, very large (at most three lines): "Work letters that prove themselves." One lead line below. A full-bleed band of vertical colour lines crosses the lower half. The drop slot is a white gap cut into the band on the right, 4px black border, reading "Drop a certificate to check it". "Check a certificate" (primary) and "Open your vault" (outline) sit bottom-left, and a small text link "I'm an employer".
FORM: Chromatic Interference, kept from the pre-pivot build.
FINISH: built faithfully from the kit; DESIGN.md regenerated from the shipped code.

## Memorable moment (signature interaction)
**Chromatic resolution.** At rest the band's line layers shift slightly with the pointer. When a certificate is dropped, the layers lock into alignment, then the page moves to `/verify`, where the band floods green (AUTHENTIC), red from the failing check (NOT AUTHENTIC) or yellow (CANNOT VERIFY RIGHT NOW). One orchestrated motion: CSS transforms on line layers, 600ms ease-out, no bounce. Under `prefers-reduced-motion` the lines are static and resolution is an instant colour change. State is never colour alone: every resolution carries its word and a mark.

## Constraints
- English UI. No wallet, gas or seed-phrase words outside "Technical details". No data-protection law mentions.
- Must not read as the crypto/Web3 look, government bureaucracy, or a generic SaaS template.
- A grammar from the art, never a copy of a specific artwork.
- Projector-safe: line pitch at least 4px. Yellow is never text. Text on lines sits on a white or paper plate.
