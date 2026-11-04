# Audit: richarani.in (before the redesign)

Audited on 5 November 2026 against `main` @ `5010171` and the live site.
Live screenshots at 375, 768 and 1440px for every public route and the booking
flow are in [`docs/screens/before/`](screens/before/). They were taken with
`node scripts/visual/shoot-live.mjs docs/screens/before`.

## 1. What to keep

The engineering underneath is strong, and most of it should not be touched.

- **Booking integrity.** The server claims the slot in the database before any
  payment exists (exclusion constraint, `409 slotTaken` on a lost race), holds
  it for `pendingHoldMinutes` (15), and is the only authority on fees. The
  client never decides a price.
- **One source of practice facts.** `shared/practice.config.js` is imported by
  both client and server: fees, hours, registration, contact.
- **i18n.** English is bundled and the other languages are lazy chunks, with an
  English fallback per key and `npm run check:i18n` to keep the files in sync.
  The live site also ships Russian (`ru`), which this work keeps.
- **Accessibility groundwork.** Skip link, real radio group for the service
  picker, `aria-pressed` chips, labelled date buttons (WCAG 2.5.3 handled),
  inline errors tied to inputs by `aria-describedby`, focus moved to submission
  errors, 44px targets on most controls, AA-checked teal and WhatsApp greens.
- **Performance groundwork.** Razorpay Checkout loads only when Pay is pressed,
  `qrcode` loads only on the UPI step, non-home routes are lazy, Google Fonts
  load without blocking render, and Framer Motion is used through `LazyMotion`.
- **Compliance.** Registration in the header, emergency notice on every page,
  telemedicine disclaimer, explicit unticked consent box, body-map footnote
  saying it is not a diagnosis, and no `aggregateRating` in the schema.

## 2. Bugs

| # | Severity | Bug | Evidence |
|---|---|---|---|
| B1 | **High (trust)** | **Hero stats show "0+" and "₹0".** `design/Counter.jsx` initialises its state to `0` and only counts up once `useInView` fires. Below the fold (on most phones the stats row is), in any screenshot, link preview, print, or a browser where the observer is late, the hero reads "0+ years of practice" and "₹0 starting fee". | At 375px the live page reports `0+` for the stat row at load (see `docs/screens/before/home-375.png`). At 768/1440 the stats are in view and read `2+`. |
| B2 | Medium | **Whole sections are invisible until scrolled.** Every `Reveal`/`RevealGroup` starts at `opacity: 0` and waits for an IntersectionObserver. Full-page captures show empty bands where "What I help with", "How it works", "Why patients choose", the testimonial cards and the closing CTA should be. | `docs/screens/before/home-1440.png` |
| B3 | **High (compliance)** | **Placeholder testimonials are live.** Three dashed "Patient name / Consultation type · Month Year" cards with an amber "Placeholder — not real reviews" banner are shown to real patients on the home page. | `home-*.png` |
| B4 | Medium | **Malformed Open Graph locale.** `Seo.jsx` writes `og:locale` as `en` / `hi` / `pa`; the protocol expects `en_IN` form. `index.html` also lacks `twitter:title`, `twitter:description`, `twitter:image`, `og:image:width/height` and `og:image:alt`. | `client/src/components/seo/Seo.jsx`, `client/index.html` |
| B5 | Low | **Placeholder hint leaks into the UI.** If `photoUrl` is ever blank the hero says "Replace client/public/images/doctor-photo.png" (wrong extension, and a file path shown to patients). | `en.js → home.photoHint` |
| B6 | Low | The language listbox trigger has an unlabeled chevron SVG without `aria-hidden`, and the listbox options are `<button role="option">` inside `<li>`, which some screen readers announce twice. | `LanguageSwitcher.jsx` |
| B7 | Low | `PhysicianSchema` describes the three consultation types as `MedicalProcedure` / `NoninvasiveProcedure`, which they are not. | `components/seo/PhysicianSchema.jsx` |
| B8 | Medium | **Body-map "Ask first" WhatsApp message is broken.** The template is "Hello {doctor}, …" but the link passed only `{area}`, so patients sent the clinic a message starting with the literal text `Hello {doctor},`. | `bodymap/RegionPanel.jsx` (found during the rebuild) |

No horizontal overflow was found at 375, 768 or 1440 on any public route, and
no console errors other than the expected 404 on the deliberately missing URL.

## 3. Payment wording vs. the code

**What the code does.** `server/src/services/payments.js` picks the mode:
`razorpay-test` if Razorpay keys are set, otherwise `upi` if `UPI_ID` is set,
otherwise `mock`. The live API (`GET /api/bookings/meta`) currently returns
**`"paymentMode": "upi"`**: patients pay the doctor directly by UPI QR / UPI ID
and submit a UTR, and the clinic confirms manually. Razorpay code is present
and dormant in production. (The local `server/.env` has Razorpay keys, so a
local dev server runs in `razorpay-test` mode. That is a difference between
local and live behaviour, not a bug.)

| Where | Wording | Matches live (UPI)? |
|---|---|---|
| `index.html` meta description | "Pick a slot, **pay securely** and consult from home" | Vague but true |
| `booking.description` | "tell the doctor what's troubling you, and **pay securely**" | Vague but true |
| `home.steps[1]` | "then a **secure payment**. Your slot is held while you pay." | Vague but true |
| `services.paymentBody` | "paid … directly to the doctor **by UPI**: scan the QR code or use the UPI ID" | ✅ |
| `legal.*` (privacy, terms, refund) | UPI, UTR, refunds by UPI | ✅ |
| `booking.secureNote` | "Payments are processed **by Razorpay**" | Only shown in Razorpay mode, so ✅. If Razorpay is switched on, the Services page and the legal pages become wrong. |
| `booking.paying` | "Opening **secure payment**…" | Flashes briefly in UPI mode as well; harmless |
| `home.steps[2]`, `faq.items[2]`, `confirmation.confirmedBody` | "You get a WhatsApp link **by email and SMS**" / "sent … **by SMS** to {phone}" | ❌ **Not true.** `server/src/services/notify.js` logs SMS only ("SMS not sent — no provider configured"). Email is sent when SMTP is configured; WhatsApp messages only when the WhatsApp Cloud API is configured. |
| `services.items.general.includes[0]` | "**Video** consultation with the doctor" | Partly. Elsewhere it is "audio, video or chat on WhatsApp". |

**Recommendation (needs the client's answer, see the content list):** decide
whether the practice stays on manual UPI or moves to Razorpay, then make the
wording say exactly that in one place. The SMS claims should be removed or an
SMS provider connected. **Per the brief, no payment behaviour and no legal or
payment wording has been changed in this work.** It is flagged here so the
doctor can decide.

## 4. What is weak (design)

- **Generic.** Stock Tailwind look: white cards on white, teal buttons, centred
  section headings, the same `card` everywhere. Nothing a patient would
  remember or associate with this doctor.
- **Hero.** A rectangle photo, a ping badge, and a count-up stat row (B1). No
  sense of the "time to listen" promise beyond the copy.
- **Body map.** A figure built from ellipses and rounded rectangles. It reads as
  a placeholder, gives little feedback on touch, and the panel jumps rather
  than responding to the tap.
- **How it works.** Three numbered cards. The most reassuring story on the
  site (how simple a WhatsApp consultation is) gets the least attention.
- **No help choosing a consultation type.** Patients have to work out
  General vs Follow-up vs Second opinion from three cards.
- **Booking.** Functional but flat: no sense of the 15-minute hold, no inline
  validation until the server answers, and the confirmation is a table.
- **No comfort controls.** No text-size option or night mode, though many
  patients are older or browse late at night.
- **Footer.** Correct but dense; the brand ends on a wall of grey text.
- **Not installable.** A manifest exists but there is no service worker, so
  there is no offline view and no install prompt.

## 5. Things deliberately left alone

- Booking, slot-holding, payment, My bookings, admin and every API contract.
- All legal pages and their wording.
- `DOCTOR.yearsExperience = 2` is a real config fact; it is still shown on the
  About page, but no longer as a headline stat.

## 6. Status after the redesign (branch `feature/time-to-listen`)

| # | Resolution |
|---|---|
| B1 | Count-up removed from the hero; the `Counter` component is deleted. The trust strip shows only static facts. |
| B2 | Scroll reveals are now CSS scroll-driven animations: content is visible by default, and only browsers that support them fade it in. Nothing waits on JavaScript or an observer. |
| B3 | Placeholder cards removed. The section renders only when `FEATURES.testimonials` is on and `TESTIMONIALS` is non-empty (`shared/practice.config.js`). |
| B4 | `og:locale` uses `en_IN` / `hi_IN` / `pa_IN`; Twitter title/description/image, `og:image` dimensions and alt text added; canonical in the static HTML. |
| B5 | The hero no longer shows file paths; the fallback is an icon. |
| B6 | Language options are plain buttons with `aria-pressed`; decorative SVGs are `aria-hidden`. |
| B7 | Replaced by build-time JSON-LD (`shared/schema.js`): `Physician` + `MedicalBusiness`, an `OfferCatalog` of services, credentials and hours from config, and no ratings. |
| B8 | Fixed: the doctor's name is now passed in. |

**Payment wording (section 3) is unchanged on purpose.** It needs the doctor's
decision first; see the content checklist in the hand-over notes.
