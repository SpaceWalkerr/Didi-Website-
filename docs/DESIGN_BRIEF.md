# Design brief: "Time to listen"

## Concept

The practice's promise is unhurried care: twenty minutes with a doctor who
actually listens. The site should feel like the first minute of a good
consultation: calm, warm, unhurried, and quietly competent. A heartbeat that
settles, light that moves slowly, shapes that breathe.

It must not look like a hospital chain (blue, stock photos, badges everywhere)
or a SaaS template (gradient blobs, feature grids, "trusted by"). It should look
like a small, well-made private clinic brand that a patient remembers after
one visit from a WhatsApp link.

**Three words:** unhurried, warm, exact.

## Palette

All colours are CSS custom properties (RGB channels) under `:root` and
`[data-theme="night"]`, mapped into Tailwind so every existing utility
(`bg-paper`, `text-slate-700`, `brand-*`, `amber-*`) switches with the theme.

| Token | Light | Night | Use |
|---|---|---|---|
| `cream` | `#FBF7F0` | `#0B1615` | Page background: warm, never clinical white |
| `paper` | `#FFFDF9` | `#11201E` | Cards, sheets, inputs |
| `ink` (`slate-900`) | `#10302D` | `#EAF2EF` | Display type and headings (deep teal ink) |
| `slate-700` | `#33463F`-ish warm grey | `#C6D3CE` | Body copy |
| `brand-600` | `#0F8078` | `#0F8078` | Primary actions (4.8:1 with white text in both themes) |
| `brand-700/800` | `#0D6660` / `#0F524E` | `#7FD5C9` / `#A6E6DC` | Teal text, links |
| `brand-50/100` | `#EEF8F5` / `#D9F0EA` | `#12302C` / `#173A35` | Luminous teal tints |
| `clay-500` | `#C2683F` | `#E0946E` | **The one warm accent**, used sparingly: the ECG pulse, the ticket notch, a dot on eyebrows, the "held" timer |
| `clay-700` | `#97482A` | `#F0B394` | Accent text (AA on cream and paper) |
| `sand-100` | `#F4EADB` | `#1E2723` | Warm panels (trust, prepare checklist) |

Rules: teal carries every action; clay is decoration plus at most one word of
text per screen; no gradients on text; no pure white page backgrounds.

## Type

- **Display:** Fraunces (opsz 9–144, weights 400/500/600, plus italic 400 for
  one accent word per headline). Large and confident: hero `clamp(2.6rem, 7vw,
  5rem)`, section titles `clamp(2rem, 4.5vw, 3.25rem)`, tight tracking
  (`-0.02em`), optical size high.
- **Text:** Inter 400/500/600/700, body 17px, line-height 1.65.
- **Hindi / Punjabi display:** Noto Serif Devanagari / Noto Serif Gurmukhi
  (500/600), so headings keep a serif voice in every script. Body uses Noto
  Sans. Google's `unicode-range` means a script's font only downloads when that
  script is on screen.
- **Script rules:** headings in `hi`/`pa` get `line-height ≥ 1.3` (matras and
  vowel signs need room), never letter-spacing, never split below word level.
- **Sizes are rem**, so the text-size control (100% / 112.5% / 125%) scales the
  whole layout like browser zoom rather than overflowing fixed boxes.

## Space and shape

- Generous whitespace: sections `py-20 → py-32`, measure capped at ~62ch.
- Radius: 1.25rem cards, 2rem feature panels, full pills for chips.
- Organic shape: one blob (SVG `clipPath`, objectBoundingBox units) for the
  doctor's portrait. Everything else is calm rectangles.
- Icons: one inline line set, 24px grid, 1.6 stroke, round caps.

## The five signature moments

1. **Living hero.** Portrait in a softly breathing organic shape; slow light
   moving behind it; a fine ECG trace draws across the page once, beats three
   times with falling amplitude and settles into a calm resting line, with a
   soft clay pulse at its end. Headline revealed word by word (word-level split,
   so Devanagari and Gurmukhi conjuncts are never broken). Time-of-day greeting
   in the chosen language. Trust strip: Reg. No. 52532 · Bihar State Medical
   Council · 20-minute consultations · on WhatsApp. A live "Next available"
   chip, fetched after the page is idle, appears only if the API answers.
2. **Body map.** A smooth, gender-neutral figure drawn from one spline
   silhouette (front and back). Regions are bands clipped by the silhouette, so
   they follow the body's outline. Regions glow on hover and focus, and a ripple
   spreads from the tap point. Selecting a region zooms the figure to it and
   slides a result card up with common concerns, an emergency note where
   relevant, and "Book for this". The chip list stays as the reliable path, and
   every region is a keyboard button with a label.
3. **Concierge.** "Which consultation is right for me?" Two or three taps, rule
   based: new problem → do you already have a diagnosis to review? (Second
   opinion : General); already seen → within 30 days? (Follow-up : General).
   Animates to a result card with fee and duration from config, then "Book
   this" pre-selects the type. Labelled as a booking guide, not medical advice.
4. **"A consultation, start to finish."** A pinned scroll story: a phone
   mockup stays in place while four steps scroll past (pick a slot, pay, get the
   link, consult). Screens are plain, generic UI with no names, no chat
   dialogue and nothing that could read as a review. With reduced motion it is a
   static four-step list.
5. **Ticket.** The booking page becomes a calm stepper with a date strip, time
   chips, inline validation, and a ring timer showing how long the slot is held
   once it is claimed. The confirmation is an appointment ticket (date, time,
   type, how to join) with a check that draws itself and a soft glow (no
   confetti), plus Add to calendar (.ics) and Share on WhatsApp. The shared
   message contains no booking ID or link, because that page shows patient
   details.

## Supporting touches

Comfort controls (text size and night mode, remembered, applied before first
paint), time-aware greeting, press feedback on every button, magnetic primary
CTAs on pointer devices, view transitions between routes and a crossfade on
language change (fallback: a short fade), installable PWA with an offline
copy of My bookings, branded skeletons, a designed 404, a "What to prepare"
checklist, an About and privacy block on the home page, testimonials behind a
config flag (`FEATURES.testimonials`) that stay hidden until real consented
reviews exist, and a calm footer.

## Motion rules

1. **Only `transform` and `opacity` animate.** The two exceptions are one-shot
   SVG draws (the ECG line and the ticket check), which are a single path each
   and run once.
2. **Slow:** ambient loops are 6–14s; UI responses 160–320ms; entrances
   500–800ms. Easing `cubic-bezier(.22,.61,.36,1)` (out) and
   `cubic-bezier(.65,0,.35,1)` (in-out for loops).
3. **Nothing waits on animation.** Content is readable in its final state if
   JavaScript, IntersectionObserver or animation never runs. Reveals are
   progressive enhancement.
4. **Ambient loops pause off-screen** (IntersectionObserver toggles
   `animation-play-state`).
5. **`prefers-reduced-motion: reduce`** removes every loop, the split text,
   zoom, ripple, the pinned story, magnetic buttons and view transitions, and
   shows the final static state.
6. **Budget:** no animation library on the critical path beyond the existing
   `LazyMotion` (domAnimation). New moments use CSS and small hooks.
