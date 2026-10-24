---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/ui","src/app/verify","src/app/issuer"]
---

# Landing (`/`)

## Scope and mode
Public landing at `/`. Mode: **Persuade**. It also establishes ScholarKey's visual world, which `/verify`, `/verify/lab`, `/issuer/**` and the certificate PDF inherit (they are Operate surfaces: same world, more restraint).

## Audience, job, action
- Who must act: recruiters and employers holding a candidate's PDF; university registrars considering issuing; hackathon judges on a projector.
- What they must believe: a diploma can prove itself in seconds, forgery fails visibly, and nobody stores the graduate's data.
- Primary action, in working form: **drop a diploma PDF** into the slot on the first viewport (hands the file to `/verify` via `src/lib/handoff.ts`). Secondary: **Issue credentials** → `/issuer`.
- Proof on the page: the live verification itself, the five named checks, the privacy receipt, the trust model with its honest limits. No invented customers, numbers or logos; any statistic carries a source.

## Direction contract
THESIS: Truth resolves when you look closely. ScholarKey's surfaces are Caracas kinetic op-art (the Cruz-Diez / Soto lineage): fields of fine pure-colour lines that interfere at rest and resolve into one solid colour when a diploma is examined. It refuses the category default of a navy shield, a centred upload box and three feature cards.
OWN-WORLD: White modernist ground #F7F6F2, ink #111111; four pure line inks red #E4002B, blue #0047BB, green #00A651, yellow #FFD100, used as dense vertical line fields (never gradients, never glow); text-safe darks for red and green; a heavy expanded grotesk display, a plain grotesk for text, a mono for IDs and hashes; square corners, 2–4px black rules, no shadows, no glass, no rounded cards.
STORY: The visitor learns a diploma can prove itself, believes it by watching the lines resolve check by check, then drops a PDF or goes to issue.
FIRST VIEWPORT: Nav across the top (wordmark left; Verify · Institutions · How it works right). The headline is set left, very large (about 100px, at most two or three lines). A full-bleed band of vertical colour lines crosses the lower half. The drop slot is a white gap cut into the band on the right (about 520×360) with a 4px black border, reading "Drop a diploma PDF". "Verify a diploma" (black, primary) and "Issue credentials" (outline) sit bottom-left. The composition matches the chosen sketch `.impeccable/mocks/decision/pick-r2.html`.
FORM: Chromatic Interference, #1 on the ordered list of the first hand (IMPECCABLE'S PICK card; the user returned to it after one re-roll). seed:96944a755173fe91
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment (signature interaction)
**Chromatic resolution.** At rest the band's line layers shift slightly with the pointer (colour changes with viewpoint, like a physichromie). When a diploma is dropped, the layers lock into alignment one check at a time; on AUTHENTIC the band floods solid green from edge to edge; on failure it floods red from the failing check. A single orchestrated motion: CSS transforms on line layers, 600ms ease-out resolution, no bounce. Under `prefers-reduced-motion` the lines are static and resolution is an instant colour change. State is never colour alone: every resolution carries its word (AUTHENTIC / NOT AUTHENTIC / CANNOT VERIFY RIGHT NOW) and a mark (✓ ✕ !).

## Constraints
- English UI. No wallet, gas or seed-phrase words outside "Technical details".
- Must not read as the crypto/Web3 look, government bureaucracy, or a generic SaaS template.
- A grammar from the art, never a copy of a specific artwork (no reproduction of the Maiquetía floor or any named piece).
- Projector-safe: line pitch at least 4px at display sizes. Check moiré at 1280×720 and 1920×1080; yellow is never text.
- Yellow, and pure red/green, are line inks only; text uses the dark variants and must pass WCAG AA.

## Unresolved decisions
- Exact faces: confirm at build (candidates: Archivo by Omnibus-Type for display and text, Geist Mono for data).
- Logo mark: a square of line inks with a key-shaped gap is the candidate; A1 decides at the submission step.
