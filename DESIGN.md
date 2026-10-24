---
name: Constancia
description: Employment letters that prove themselves. Fields of fine pure-colour lines resolve into one solid colour when a certificate is examined; hidden claims are solid bars.
colors:
  paper: "#F7F6F2"
  white: "#FFFFFF"
  ink: "#111111"
  ink-muted: "#55534E"
  rule: "#CFCCC2"
  line-red: "#E4002B"
  line-blue: "#0047BB"
  line-green: "#00A651"
  line-yellow: "#FFD100"
  red-text: "#B0001F"
  green-text: "#00703A"
  focus: "#0047BB"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.5rem, 1.7rem + 5.6vw, 6.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.3rem + 2.4vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  small:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.92em"
    fontWeight: 400
    fontFeature: "'tnum'"
rounded:
  none: "0px"
spacing:
  "2": "8px"
  "4": "16px"
  "6": "24px"
  "12": "48px"
  "24": "96px"
  gutter: "clamp(1.25rem, 4.4vw, 4rem)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  field-input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "48px"
  panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px"
  check-chip-verified:
    backgroundColor: "{colors.line-green}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "36px"
  check-chip-failed:
    backgroundColor: "{colors.line-red}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "36px"
  check-chip-unavailable:
    backgroundColor: "{colors.line-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "36px"
  verdict-mark:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "112px"
---

<!-- PROVISIONAL until A1-S2 finishes: tokens and primitives are final; landing patterns come in S2. -->

# Design System: Constancia

## Overview

**Creative North Star: "Chromatic Interference"**

Caracas kinetic op-art (the Cruz-Diez and Soto lineage) as a grammar, never a copy of a piece. Fields of fine, pure-colour vertical lines interfere at rest, shifting colour with the viewer's position, and resolve into one solid colour when a credential is examined. The page is a white modernist ground with ink rules; colour is earned and arrives as a verdict. The interface refuses the crypto look (neon on black, chain imagery), the government-portal look (grey forms, stamp overload) and the SaaS template (purple gradients, icon-tile grids, glass).

Density is calm and large: type is heavy and expanded, rules are 2 to 4px ink, targets are at least 48px, because the verifier is shown on a projector to a room. Operate surfaces (`/employer`, `/verify`) keep the same world with more restraint; the line field is a material used in a few places, not wallpaper.

**Key Characteristics:**
- Four pure inks appear only as vertical line fields, flooded bands, chips and the unavailable plate; blue is also the focus ring. Text is ink or a text-safe dark.
- Every state is a word plus a drawn mark plus colour. Never colour alone.
- Square corners, flat surfaces, hairline and ink rules. No shadows, no gradients as decoration, no glass.
- One motion family, owned by the line field: parallax at rest, stepped drift or check-by-check convergence while scanning, then the 600ms exponential ease-out flood, no bounce. Elsewhere only 150ms colour inversions.

## Colors

A white modernist ground and ink, with four pure line inks held back for the moment of resolution.

### Primary
- **Ink** (#111111): text, 2 to 4px rules, borders, the primary button, the fourth line layer. The system's structural colour.

### Secondary

The line inks. Never body text.

- **Signal Red** (#E4002B): the red line layer; floods the verdict band on NOT AUTHENTIC; FAILED chip.
- **Interference Blue** (#0047BB): the blue line layer; also the focus ring.
- **Resolve Green** (#00A651): the green line layer; floods on AUTHENTIC; VERIFIED chip.
- **Caution Yellow** (#FFD100): the unavailable flood and chip. Never text.

### Neutral
- **Paper** (#F7F6F2): the page ground and the gap colour between lines.
- **White** (#FFFFFF): form controls, panels, the white gap cut into a line field (drop slot).
- **Muted Ink** (#55534E): secondary text, hints, placeholders (7:1 on paper).
- **Rule** (#CFCCC2): hairlines between rows and receipt entries.
- **Red Text** (#B0001F) and **Green Text** (#00703A): AA text-safe darks, used only for the FAILED and VERIFIED words and error messages.

### Named Rules
**The Pure Ink Rule.** Pure red, green and yellow are lines and floods. Text uses ink, muted ink or the two dark variants. Yellow is never text and never a thin line on paper.
**The Resolution Rule.** Colour is the last thing that arrives. A resolved state always carries its word and its drawn mark (check, cross, bang, dash); a colour-blind reader loses nothing.

## Typography

**Display Font:** Archivo (variable, `wdth` axis, with system sans fallback)
**Body Font:** Archivo, normal width
**Label/Mono Font:** Geist Mono, for IDs, hashes, DIDs and measured values only

**Character:** One family in two voices: expanded and heavy for verdicts and headings, plain width for reading. Mono is data, not decoration.

### Hierarchy
- **Display** (800, clamp 56px to 104px, 0.95, -0.03em, width 125): the landing hero and the verdict word (the verdict uses Headline under 640px).
- **Headline** (800, clamp 32px to 56px, 1.0, -0.025em, width 125): PageHeader titles (a 4px ink rule below, nothing above), section headings, the drop-slot label.
- **Title** (24px, 1.2): check labels at 700 and normal width; Panel, CheckList and Receipt titles at 800 and width 125.
- **Body** (400, 17px, 1.55): paragraphs and detail lines, at most 65ch.
- **Small** (400, 14px, 1.45): hints, footnotes, the issuer line. Field labels and status words are bold; status words are uppercase with wide tracking (0.025em).
- **Mono** (400, 0.92em, tabular numerals): credential IDs, hashes, measured values.

Width 125 is `font-stretch: expanded`, set alongside the size on every display, headline and expanded title; the size tokens alone render at normal width.

### Named Rules
**The Data Is Mono Rule.** Mono appears only on values a person might copy or compare. Prose never goes mono.

## Layout

Single-column reading flow inside a 72rem container with a fluid gutter (20px to 64px, the `gutter` spacing token). Spacing keeps Tailwind's numeric 4px steps (2, 4, 6, 12, 24 = 8, 16, 24, 48, 96px) and `gutter` is the only named spacing utility. Rhythm is 24 / 48 / 96px: tight inside a group, generous between groups, more space above a heading than below it. Check rows are separated by 2px ink rules; receipt rows and quiet panels use the 2px Rule hairline. Nothing is boxed per row. Breakpoints are Tailwind's defaults (640, 768, 1024, 1280, 1536px), plus the Receipt stacking below 480px; at 390px check rows stack (index, chip, label, then status and measured value). Line pitch is 6px (3px line, 3px gap), above the 4px projector floor.

## Elevation & Depth

Flat. Depth is conveyed by ink rules, a white panel on a paper ground, and the line field itself. The theme removes the named shadow and radius scales. `rounded-none`, `rounded-full`, arbitrary values and Tailwind's default `text-*` sizes still compile and are off-system: do not use them.

### Named Rules
**The Flat Rule.** Surfaces never lift. A state change is a colour inversion (ink to paper) or a flood, never a shadow.

## Shapes

Square. Every box is a rectangle with a 2px, 3px or 4px ink border (hairline `Rule` for quiet blocks). Marks are drawn square-capped strokes on a 20px grid. The chip is a 36px square; the verdict mark is a white square with a 4px ink border (80px, 112px from 640px).

## Components

### Buttons
- **Shape:** rectangle, 3px ink border, 48px minimum height, 24px side padding.
- **Primary:** ink fill, paper text. **Secondary:** paper fill, ink text. **Quiet:** no border, underline on hover.
- **Hover:** primary and secondary invert (150ms colour). **Disabled:** 40% opacity, no pointer events. **Focus:** global 3px blue ring offset 3px.

### Fields
- **Style:** 2px ink border, white fill, 48px minimum height, labels above in bold small, placeholder in muted ink.
- **Error:** the border turns red-text, the message carries a drawn cross, announced with `role="alert"`. Hint and error live inside the label so they are read with the control.

### Panel
- White fill with a 2px ink border and 24px padding (quiet tone: transparent fill, hairline rule border). Never nested inside another panel.

### Mono
- Middle-shortened hashes (10 chars, ellipsis, 8 chars). With copy, the whole value is one button that announces "Copy", shows the full value on hover and "Copied" for 1.5s.

### Disclosure
- A native `details` with a 2px top rule and a square plus mark that loses its vertical stroke when open. Used for "Technical details".

### Line Field (signature)
- Four layers of 3px lines on a 24px pitch (red, blue, green, ink), offset so they read as one field of alternating colours. Only transforms move. At rest the layers shift with the pointer in whole-pixel steps. Scanning drifts the layers in whole-pixel steps, or, given a progress of 0 to 5, converges them one check at a time. Resolved states flood a solid colour across the band in 600ms: green (ok), red (fail), yellow with ink hatching (unavailable). Reduced motion: static lines, instant change. A file dragged anywhere over the page locks every field into alignment and inverts the drop slot.

### Check Row (signature)
- Index, a 36px chip, the label with its detail, and the status word with the measured value on the right. The chip interferes (three small line layers) while CHECKING and resolves to a solid square with a mark: check on green, cross on red, bang on yellow, dash on dashed paper (not examined), check on ink (done). CheckList is not a live region; the verifier page owns per-check announcements.

### Verdict (signature)
- A resolved band under a 4px ink border: a white mark square and a huge expanded word over a flooded line field, then the reason and the issuer domain on white. It mounts as lines and floods once; the result is announced through an `sr-only` status region. The unavailable word sits on a solid yellow plate so it stays legible over the hatching.

### Drop Zone
- A white gap with a 4px ink border, intended to sit inside a line field. Keyboard and file-input fallback, credential files (.sdjwt, .json, .txt). Drops outside the slot are swallowed so the browser never navigates to the file.

### Claim List
- One row per claim. **Shown:** an open line field with the value in ink on a white plate. **Hidden:** the row's field resolved into a solid ink bar with the word "Hidden"; the value is never rendered, never blurred. **On/off:** a square toggle with a 3px ink border, a drawn mark when on, , 48px target. State is never colour alone.

### Timeline
- A vertical ink spine; each entry carries the check chip (solid square and mark once VERIFIED), employer, title, dates and the status word. A gap is a hatched interval labelled "Gap · N months"; an overlap doubles the spine and is labelled "Overlap".

### QR Block
- Black on white, square, 4px ink border, 224px growing to 320px, with the label underneath and an optional Copy link. Sized to scan from a phone at 1280x720 on a projector.

### Receipt
- A ledger: a 4px ink rule, an expanded 800 title at Title size, rows of label and value separated by hairlines, mono for identifiers, muted rows for what was not sent or stored.

## Do's and Don'ts

### Do:
- **Do** use the four inks only as lines, floods, chips and the unavailable plate (blue is also the focus ring), and text only in ink, muted ink, red-text or green-text.
- **Do** pair every resolved state with its word and its mark.
- **Do** keep line offsets on whole pixels and use `steps()` for any drift: `steps(24)` on the layers, `steps(8)` on the chip (no shimmer at 1280x720).
- **Do** keep targets at 48px or more and body text at 17px or more; this is read from across a room.
- **Do** put the line field behind the one thing being decided (the drop slot, the verdict), and leave the rest on paper.

### Don't:
- **Don't** use shadows, rounded corners, gradient text, glass or glow.
- **Don't** use yellow as text, or pure red or green as small text on paper.
- **Don't** put wallpaper-density line fields behind running text.
- **Don't** animate anything outside the line field beyond 150ms colour changes. No bounce, no entrance animation on every section.
- **Don't** show wallet, gas or seed-phrase words outside a "Technical details" disclosure.
