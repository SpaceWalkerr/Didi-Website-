# Online Consultation Website — Solo General Physician

A small, production-shaped website for a single doctor's telemedicine practice in India:
marketing pages, a slot-based booking flow with online payment, WhatsApp as the consultation
channel, and a private view of upcoming bookings for the doctor.

**Stack:** React 18 + Vite + Tailwind CSS · Node/Express · Razorpay (test mode) · JSON file store.

**Languages:** English (default), Hindi, Bhojpuri, Haryanvi, Punjabi, Russian.

---

## Quick start

```bash
npm run setup
```

```bash
npm run dev
```

The site runs at **http://localhost:5173** and the API at **http://localhost:4000**.

Without Razorpay keys the app starts in **mock payment mode**: the entire booking flow works end to
end and no money moves, so you can demo the site before the doctor's payment account exists. The
booking page shows a clear "Demo mode" banner while this is on.

The clinic view is at **/admin**. The default token is `change-me-please` — set `ADMIN_TOKEN` in
`server/.env` before deploying anywhere.

---

## What to edit first

Everything a non-developer needs to change is in two files, and every placeholder is marked `TODO`.

| File | Contains |
| --- | --- |
| `client/src/config.js` | Doctor's name, qualifications, registration number, council, bio, photo, WhatsApp number, email, clinic hours |
| `server/src/config.js` | Service names, **prices and durations**, consulting hours, booking rules, WhatsApp number |
| `client/public/images/` | Doctor photograph and link-preview card — see the README in that folder |
| `client/src/i18n/en.js` | **All patient-facing wording**, including the bio and the disclaimer |
| `client/src/i18n/*.js` | The same keys in each other language |

Two of these are deliberately duplicated across client and server — prices/durations and the
WhatsApp number. The **server copy is authoritative** (the client fetches services from the API, so
a patient cannot be charged a price they didn't see). Keep the two in step.

The doctor's identity is already filled in: **Dr. Richa Rani, MBBS (MD) — General Physician,
Reg. No. 52532, Bihar State Medical Council, 2+ years' experience.**

**Still to replace before launch:**

- **WhatsApp Business number** — in *both* config files (international format, digits only:
  `91XXXXXXXXXX`). Everything currently points at `919999999999`, which is not a real number
- **Email address** — `CONTACT.email` (client) and `PRACTICE.email` (server)
- **Doctor's photograph** — see [`client/public/images/README.md`](client/public/images/README.md)
- **Medical college and year** in `DOCTOR.credentials`, still marked `[Medical College Name]`
- **The telemedicine certificate entry** in `DOCTOR.credentials` — delete it if that course has not
  been completed yet
- Consulting hours in `AVAILABILITY` (server) and the human-readable `CONTACT.hours` (client)
- Service prices, if ₹500 / ₹250 / ₹900 are not the intended fees

The bio copy in `DOCTOR.shortBio` and `DOCTOR.longBio` is written to fit 2+ years of experience, but
it is drafted text — the doctor should read and adjust it.

---

## Languages

The site is published in six languages. English is the default and the fallback:
any key missing from another language falls back to English rather than showing
a blank, so a partial translation degrades gracefully.

| Code | Language | Script |
| --- | --- | --- |
| `en` | English | Latin |
| `hi` | हिन्दी — Hindi | Devanagari |
| `bho` | भोजपुरी — Bhojpuri | Devanagari |
| `bgc` | हरियाणवी — Haryanvi | Devanagari |
| `pa` | ਪੰਜਾਬੀ — Punjabi | Gurmukhi |
| `ru` | Русский — Russian | Cyrillic |

### How the language is chosen

In order of how much the signal can be trusted, from `detectLanguage()` in
[`client/src/i18n/index.jsx`](client/src/i18n/index.jsx):

1. **What the visitor previously picked** here (stored in `localStorage`)
2. **`?lang=` in the URL** — so the clinic can share a link that opens in one
   language, e.g. `…/book?lang=bho`
3. **A region code**, if one is supplied — `REGION_LANGUAGE` maps Haryana to
   Haryanvi, Punjab to Punjabi, Bihar to Bhojpuri, and so on
4. **The browser's own language settings** — reliable, instant, needs no
   permission and makes no network call
5. **Time zone**, which only separates Russia from India
6. **English**

A note on "by location": step 4 is doing the real work today. Step 3 is wired up
and ready, but **nothing currently supplies a region code** — every Indian state
shares one time zone, so a browser cannot tell Haryana from Bihar. Narrowing to a
state needs an IP-geolocation lookup (a third-party service, a per-request cost,
and a privacy trade-off), so it is deliberately left switched off. To enable it,
resolve the visitor's state server-side and pass it to `detectLanguage(region)`.
The language switcher in the header is always available regardless.

### Editing translations

`en.js` is the reference. After changing any language file:

```bash
node scripts/check-translations.mjs
```

That fails if a language is missing a key, has an unknown one, or has a list of
the wrong length — all of which would silently show English to a patient.

Each dictionary is a separate bundle chunk, so a visitor reading English never
downloads the other five (~8 KB gzipped each).

### What is *not* translated

- **The admin view** (`/admin`) is English only — the clinic is the only audience.
  It does show which language each patient booked in, so the doctor knows what to
  expect on the call.
- **Email and SMS templates** in `server/src/services/notify.js` are English. The
  booking record stores the patient's language, so whoever wires up the real
  provider can use it.
- **The WhatsApp join message** *is* translated, in `JOIN_MESSAGES` in
  `notify.js` — the patient reads that one before sending it.

### Translation quality

The English and Hindi text is solid. **Bhojpuri and Haryanvi have not been
reviewed by a native speaker**, and both are languages with limited written
standardisation — the wording will read as serviceable rather than natural, and
some medical phrasing may be off. Have someone who speaks each read through
before launch; each file has a `Reviewed by: ______` line at the top.

Because of that, the footer shows a line in every non-English language stating
that the **English version of the terms is authoritative**. Keep it there unless
a lawyer reviews each translated disclaimer.

---

## How booking works

1. **Pick a slot** — the client asks `GET /api/bookings/slots` for a date and service. The server
   generates start times from `AVAILABILITY` on a 15-minute grid, then marks each one available or
   not. Taken slots are shown struck through rather than hidden, which patients find less confusing.
2. **Fill in details** — name, age, gender, phone, email, symptom summary, and an explicit consent
   checkbox. Validated on both sides; the server's result wins.
3. **Pay** — the server creates a booking with status `pending` and a Razorpay order. The slot is
   held for 15 minutes while the patient pays.
4. **Verify** — Razorpay Checkout returns a signature, which the server verifies with HMAC-SHA256
   before confirming anything. A client claiming "payment succeeded" is never believed.
5. **Confirm** — status becomes `confirmed`, email/SMS placeholders fire, and the patient lands on a
   confirmation page with a `wa.me` link that has the greeting, service and booking ID pre-filled.

Overlaps are handled by duration, not just by start time: a 20-minute appointment at 10:00 blocks
09:45, 10:00 and 10:15. Before confirming a payment the server re-checks the slot, so two patients
paying at once cannot both get it — the loser is flagged `needs-attention` for a refund or reschedule
rather than silently double-booked.

All times are Asia/Kolkata. India has no DST, so a fixed `+05:30` offset is used throughout.

---

## Going live

### 1. Razorpay

Sign up, then from the dashboard with the **Test Mode** toggle on, copy the key pair into
`server/.env`:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
```

Restart the server — the demo-mode banner disappears and real test-mode Checkout opens. Test cards
are in Razorpay's documentation. Switching to live keys later needs no code change, but Razorpay
requires KYC and, for a medical practice, usually a registered business entity.

The mock payment endpoint (`/api/payments/mock-pay`) disables itself automatically once keys are set.

### 2. Email and SMS

`server/src/services/notify.js` currently logs formatted messages to the console instead of sending
them. Each function has one place to drop a provider call:

- **Email** — Resend, SendGrid, Amazon SES, or Nodemailer against the clinic's own SMTP
- **SMS** — MSG91, Twilio or Gupshup. Note that transactional SMS in India requires **DLT template
  registration** before anything will be delivered
- **WhatsApp** — optional. The current design has the *patient* tap a `wa.me` link, which needs no
  API and no approval. Automated reminders would need the WhatsApp Business Cloud API

### 3. Storage

Bookings live in `server/data/bookings.json` (gitignored), written atomically via a temp file. That
is genuinely fine for a solo practice's volume, and it keeps deployment to "copy the folder and run
node".

Every read and write goes through `server/src/db.js`, so moving to SQLite, Postgres or Firestore
means rewriting that one file and nothing else. **Do move** if you add a second doctor, run more than
one server process, or deploy somewhere with an ephemeral filesystem — concurrent writes from
multiple processes are not safe, and patient data needs real backups either way.

### 4. Deploy

See **[DEPLOY.md](DEPLOY.md)** for the full walkthrough. In short:

```bash
npm run build && npm start
```

`npm run build` emits `client/dist`, which the Express server serves automatically when present —
so the whole site runs from one origin on one port, with no CORS configuration needed.

Configs for Render (`render.yaml`), Fly (`fly.toml` + `Dockerfile`) and Vercel (`vercel.json`) are
included. The app needs **persistent disk** for the booking store, so Render or Fly can host the
whole thing; Vercel can serve the front end but not the API, because serverless functions have no
persistent filesystem. **[DEPLOY.md](DEPLOY.md)** covers all three.

In production the server refuses to start if `ADMIN_TOKEN` is still the default or shorter than 24
characters, or if Razorpay keys are missing — both would be live-site problems that are easy to
miss in a deploy log and expensive to discover later. `server/src/preflight.js` has the detail.

Behind a reverse proxy, terminate TLS there. **Serve over HTTPS only** — this handles patient health
information.

### 5. Before accepting real patients

- [ ] Real WhatsApp number and email address in both config files
- [ ] Doctor's photograph in place of the placeholder
- [ ] Registration number and council checked against the council register
- [ ] `ADMIN_TOKEN` changed from the default
- [ ] HTTPS enforced
- [ ] Razorpay live keys, after KYC
- [ ] Email/SMS providers wired up (DLT registration done for SMS)
- [ ] Backups configured for `server/data/`
- [ ] Cancellation and refund terms on the Services page reviewed by the doctor
- [ ] Doctor has completed the mandatory telemedicine training course
- [ ] Bhojpuri and Haryanvi translations read by a native speaker
- [ ] `node scripts/check-translations.mjs` passes

---

## Compliance notes

The site is built around the **Telemedicine Practice Guidelines** notified on 25 March 2020 by the
Board of Governors in supersession of the Medical Council of India (Appendix 5 to the Indian Medical
Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002):

- The doctor's name, qualification and registration number are displayed on every page
- Patient consent is explicitly recorded — the booking cannot be submitted without it, and the
  timestamp is stored with the booking
- An emergency notice appears in the footer of every page and beside the booking form
- The footer states that the doctor decides whether a condition suits a teleconsultation, and that
  medicines prohibited for telemedicine will not be prescribed
- Patient details are collected only for care, in line with the Digital Personal Data Protection
  Act, 2023

The disclaimer text in `client/src/components/Footer.jsx` is a reasonable starting point, not legal
advice. **Have the doctor read it, and ideally a lawyer, before launch.**

---

## Project layout

```
client/
  src/
    config.js              ← doctor details, WhatsApp number, contact info
    pages/                 Home, About, Services, Booking, Confirmation, Contact, Admin
    components/            Navbar, Footer, WhatsAppButton, StepIndicator, Icons …
    lib/                   api client, Razorpay checkout, date/currency formatting
    i18n/                  ← all patient-facing wording; en.js is the reference
  public/images/           ← doctor photo, link-preview card, home-screen icon
scripts/
  check-translations.mjs   verifies every language has the same keys as en.js
server/
  src/
    config.js              ← services, prices, consulting hours, booking rules
    db.js                  JSON store — the only file to rewrite for a real database
    routes/                bookings, payments, admin
    services/              slots (availability + overlap), payments (Razorpay), notify
  data/bookings.json       created at runtime, gitignored
```

## API

Errors come back as a machine-readable `code` (plus `params` where a number is
interpolated), not an English sentence — the server has no idea what language the
patient is reading. The client maps each code to a key under `errors.*` in the
translation files. Field validation returns `fieldErrors` as `{ field: code }`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/bookings/meta` | Services, rules, payment mode, booking window |
| `GET` | `/api/bookings/slots?date=&service=` | Slot availability for a date |
| `POST` | `/api/bookings` | Create a pending booking + payment order |
| `GET` | `/api/bookings/:id` | Confirmation details (join link only once confirmed) |
| `POST` | `/api/payments/verify` | Verify the signature and confirm the booking |
| `POST` | `/api/payments/mock-pay` | Simulated payment — mock mode only |
| `POST` | `/api/payments/cancel` | Release a slot when checkout is dismissed |
| `GET` | `/api/admin/bookings?scope=` | Upcoming or all bookings (requires `x-admin-token`) |
| `PATCH` | `/api/admin/bookings/:id` | Mark completed or cancelled |
