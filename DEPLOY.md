# Deploying

The app runs two ways from the same code, and both talk to the same **Postgres**:

- **On Vercel** (Option C): the website is served from Vercel's CDN and the API runs as one
  serverless function. Nothing sleeps.
- **On Render** (Option A): one long-running Node process serves the API and the built
  website from a single origin.

Bookings live in Postgres either way, so no persistent disk is needed.

Locally, leaving `DATABASE_URL` unset falls back to a JSON file under `server/data/`, so
you can develop with no database installed. In production that fallback would sit on a
filesystem that is wiped on every deploy and every idle restart, so **the server refuses
to start in production without `DATABASE_URL`.**

---

## Which host

| Option | Cost | Notes |
| --- | --- | --- |
| **Render, one service** | Free | Simplest. One origin, no CORS. Sleeps when idle — see below. |
| **Render, Starter** | ~$7/mo | Same, but always on. |
| **Vercel, everything** (Option C) | Free (Hobby)¹, or Pro ~$20/mo | Fast CDN, API never sleeps, nothing to keep warm. |
| **Vercel (front end) + Render (API)** (Option B) | Pro¹ + Render | The older split. Superseded by Option C unless you want the API on Render. |

¹ This repo's `vercel.json` works on Vercel's free Hobby plan, but Hobby is **not licensed for
commercial use** by Vercel's terms, and a practice taking payments is commercial. Vercel can
suspend a Hobby account that breaks that, so treat free as a stopgap and move to Pro when the
clinic is established. Check their current terms and pricing — and Render's — before relying
on either.

**Which one:** if the site must open instantly for every visitor and a paid plan is fine,
Option C. If you want the cheapest always-on option, Render Starter (~$7/mo) with Option A is
simpler and half the price. The free Render tier is the one that sleeps (the ~50 second wait),
and it cannot be fixed without paying for something.

### Free-tier caveats

Render sleeps a free service after ~15 minutes idle, and a free Supabase project pauses
after about a week. Step 1b below sets up a pinger that handles both.

---

## Before the first deploy

### 1. Generate an admin token

```bash
node -e "console.log(crypto.randomUUID())"
```

The admin view exposes every patient's name, phone, email and symptom summary. The server
**refuses to start in production** with the default token or anything under 24 characters.

### 2a. No Razorpay account? Use manual UPI payments

If Razorpay verification is not through yet, set **`UPI_ID`** (the doctor's UPI ID, e.g.
`name@okaxis`) and leave the Razorpay keys unset. The server then starts in **`upi` mode**:

1. The patient picks a slot and details, then sees a QR code, a "pay in UPI app" button and the UPI ID.
2. They pay from any UPI app and enter the 12-digit **UTR** (reference number).
3. The slot is held, and the doctor gets an email: *Verify UPI payment*.
4. The doctor checks the amount and UTR in their bank/UPI app, then opens **/admin** and presses
   **Confirm payment**. The patient is emailed and gets the WhatsApp join link.
5. To reject a payment that never arrived, press **Cancel booking** — the slot is released.

Things to know: a UTR can back only one booking; the slot is held until the doctor acts (a
patient who submits a made-up UTR holds it until the doctor cancels); refunds are manual.
Without `UPI_ID` and without Razorpay keys the server refuses to start in production.
When Razorpay is later verified, add its keys — they take priority and UPI mode switches off.

### 2. Get Razorpay keys and set up the webhook

From the Razorpay dashboard. The server also **refuses to start in production** without
them, because simulated payments would let patients book real appointments having paid
nothing — and the booking page would say so.

Test keys (`rzp_test_…`) accept only test cards; real patients cannot pay with them. Live
keys require KYC.

For a staging site nobody will book on, `ALLOW_DEMO_PAYMENTS=true` overrides this. Never
set it where patients can reach it.

#### The webhook is not optional once money is real

A booking is confirmed when the payment is proven good. That proof can arrive two ways:
the patient's browser returning from Checkout, or Razorpay telling the server directly.

Only the second is reliable. If the patient pays and then closes the tab, loses signal or
their phone dies in that couple of seconds, Razorpay has their money while the booking
stays `pending`, expires after 15 minutes and releases the slot — and nobody is told.

So once the keys are live, set this up. **The server refuses to start with live keys and
no webhook secret.**

In the Razorpay dashboard, **Settings → Webhooks → Add New Webhook**:

| Field | Value |
| --- | --- |
| Webhook URL | `https://<your-api>/api/payments/webhook` |
| Secret | any strong string — also set it as `RAZORPAY_WEBHOOK_SECRET` |
| Active events | `payment.captured` and `payment.failed` |

The URL must point at the **Render backend**, not the Vercel front end — Razorpay's
servers call it directly, and the front end has no server to receive it.

Also check **Settings → Payments → auto-capture is on**. With it off, payments are only
authorised, `payment.captured` never fires, and the money sits in limbo.

Both paths are safe to fire at once: whichever arrives first confirms the booking, and the
patient is notified exactly once.

---

## Option A — Render, one service (recommended)

### 1. Create a free Postgres (Supabase)

Create a project at [supabase.com](https://supabase.com), region **Singapore**
(`ap-southeast-1`), closest to patients in India.

Then **Project Settings → Database → Connection string**, and take the **Session pooler**
string — *not* "Direct connection":

```
postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

> Supabase's direct connections are IPv6-only, and Render dials out over IPv4. Using the
> direct string gives you a deploy that builds perfectly and then cannot reach the
> database at all — a confusing hour to spend.

#### Watch the password characters

A connection string is a URL, so punctuation in the generated password changes what it
means. A `?` is the dangerous one — everything after it is read as a query string, so

```
postgresql://postgres.abc:pa?ss@aws-0-....pooler.supabase.com:5432/postgres
```

parses with the **hostname `postgres.abc`** and no password at all. It cannot connect, and
the error says nothing about the password.

The simplest fix is to avoid the problem: **Project Settings → Database → Reset database
password**, and choose one with only letters and digits. Supabase generates passwords
containing `?`, `$`, `!` and similar.

If you would rather keep the generated password, percent-encode it:

| Character | Encode as |
| --- | --- |
| `?` | `%3F` |
| `$` | `%24` |
| `!` | `%21` |
| `#` | `%23` |
| `@` | `%40` |
| `/` | `%2F` |
| `:` | `%3A` |

```bash
node -e "console.log(encodeURIComponent('your-password-here'))"
```

You do **not** need to create any tables. The server creates them on first start.

#### One extension is required

The schema uses a GiST exclusion constraint to make double-booking impossible at the
database level, and that needs the `btree_gist` extension. The server creates it on
first start, and **refuses to boot if it cannot** — running without the constraint
would mean two patients could be sold the same consultation slot, which is not a
failure worth degrading gracefully into.

Supabase, Neon, Render Postgres and RDS all allow it. If your database does not, run
this once from its SQL editor as a superuser and restart the app:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

Neon is the main alternative and works identically — the app only needs a `DATABASE_URL`.
It suspends and wakes on its own rather than pausing after a week, but has no table
editor. Free-tier terms change, so check both if you are deciding fresh.

### 1b. Keep it awake

Two things sleep on free tiers, and one external pinger fixes both:

- **Render** sleeps a free web service after ~15 minutes idle. The next visitor waits
  roughly 50 seconds on a blank page — on a booking site that reads as broken.
- **Supabase** pauses a free project after about a week idle, and it needs a **manual
  restore** from the dashboard before bookings work again.

Set up a free monitor — [UptimeRobot](https://uptimerobot.com), Better Stack or
cron-job.org — to request this every **10 minutes**:

```
https://<your-site>.onrender.com/api/health
```

That endpoint runs a `SELECT 1`, so one ping keeps the web service awake *and* the
database active. It also tells you when the site breaks, which is worth having anyway.

Two caveats:

- Render's free tier allows 750 instance-hours a month. Staying awake 24/7 is ~744 hours,
  so this just fits — **for one free service only**. A second would exceed it.
- This is a workaround, not a fix. Before real patients depend on the site, Render's
  Starter plan (~$7/mo) removes the sleep entirely and is the honest answer.

### 2. Create the web service

`render.yaml` describes the whole thing, so in the Render dashboard choose
**New → Blueprint** and point it at the GitHub repo.

To do it by hand — **New → Web Service**, connect the repo, then:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Region | Singapore (closest to India) |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `node server/src/index.js` |
| Health check path | `/api/health` |
| Instance type | Free (or Starter, to stop it sleeping) |

> `--include=dev` is not optional. `NODE_ENV=production` is set below because the
> server needs it at runtime, and it also makes npm skip devDependencies — one of
> which is `vite`, the thing that builds the client. Plain `npm ci` gives you
> `sh: 1: vite: not found`.

### 3. Set environment variables

**Environment → Add Environment Variable:**

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | the Neon or Supabase connection string |
| `CLIENT_ORIGIN` | your Render URL, e.g. `https://dr-richa-rani.onrender.com` |
| `ADMIN_TOKEN` | the token you generated |
| `RAZORPAY_KEY_ID` | `rzp_test_…` or the live key |
| `RAZORPAY_KEY_SECRET` | from Razorpay |
| `RAZORPAY_WEBHOOK_SECRET` | the webhook secret you chose — required with live keys |
| `SMTP_URL` | SMTP URL for confirmation emails, e.g. `smtps://user%40gmail.com:app-password@smtp.gmail.com:465` — without it no emails are sent |

You will not know the Render URL until the service exists, so set `CLIENT_ORIGIN` after
the first deploy and let it redeploy.

### 4. Deploy

Render builds on every push to `main`. The first build takes a few minutes.

If it fails, open **Logs**. The server prints exactly what it refused to start over — a
missing `DATABASE_URL`, a weak `ADMIN_TOKEN`, or missing Razorpay keys. All three are
deliberate (`server/src/preflight.js`). On a successful start it logs:

```
  Server ready on http://localhost:10000
  Storage    : postgres
  Payments   : razorpay-test
```

If `Storage` says `json`, `DATABASE_URL` did not reach the process — fix it before
anyone books, because those bookings will not survive.

---

## Option B — Vercel for the front end, Render for the API

This splits the two: Vercel serves the React app from its CDN, Render runs the API. Since
the API can now run on Vercel too (Option C), this is only worth it if you specifically want
the API on Render.

### 1. Deploy the API to Render

Exactly as in Option A, except `CLIENT_ORIGIN` is your **Vercel** URL, not the Render one.
Multiple origins are allowed, comma-separated — useful for Vercel's per-branch previews:

```
CLIENT_ORIGIN=https://dr-richa-rani.vercel.app,https://dr-richa-rani-git-main-you.vercel.app
```

### 2. Deploy the front end to Vercel

Import the repo at vercel.com. `vercel.json` already sets the build command, the output
directory and the SPA rewrite, so the only thing to add is one environment variable:

| Key | Value |
| --- | --- |
| `VITE_API_BASE` | your Render API URL, e.g. `https://dr-richa-rani.onrender.com` |

**Set it before the first build.** Vite bakes the value into the bundle, so changing it
later needs a redeploy, not just a restart.

### 3. Check the two can talk

Open the booking page. If the consultation types and prices load, CORS is right. If they
do not, it is almost always `CLIENT_ORIGIN` not matching the Vercel origin exactly —
scheme and host must both match, with no trailing slash.

### Trade-offs

Two services to deploy and keep in sync, CORS to get right, and a second set of
environment variables. The upside is Vercel's CDN and instant static delivery. For a
practice this size, Option A is usually the better trade.

---

## Option C — Vercel, everything (nothing sleeps)

The website is served from Vercel's CDN and the API runs as one serverless function
(`api/index.js`). A function wakes in a fraction of a second, so there is no 50-second
wait, no pinger to keep warm, and no region to get wrong beyond the one in `vercel.json`.

### What it needs

- **A Vercel plan.** The free **Hobby** plan runs this repo as it stands. Its terms are
  non-commercial, though (see the note under *Which host*), so plan to move to **Pro**
  (~$20/month at the time of writing — check current pricing) once the clinic is taking real
  patients. Pro is also what brings back the 5-minute reminder job (step 6).
- **Postgres** — the same Supabase or Neon database as before. If you are moving from Render,
  keep using the one you have: nothing needs migrating.

### 1. The database connection string

Each function instance opens its own connections, so use the **pooler**, not a direct
connection:

- **Supabase:** Project Settings → Database → Connection string → **Transaction pooler**
  (port **6543**). On Render you used the Session pooler (5432); on Vercel switch to 6543.
- **Neon:** the **pooled** connection string (the host contains `-pooler`).

The same password rules from Option A step 1 apply (letters and digits only, or percent-encode).
The app uses no prepared statements or session state, so it works through a transaction pooler.

**Region.** `vercel.json` runs the function in Singapore (`"regions": ["sin1"]`), which matches
a Supabase project in `ap-southeast-1`. A booking makes several database round trips, so
function ↔ database distance matters more than function ↔ visitor. If your database is
elsewhere, change `regions` to the nearest Vercel region.

### 2. Create the project

vercel.com → **Add New → Project** → import the GitHub repository. Leave **Framework Preset**
as *Other*: `vercel.json` already sets the build command, output directory and routing.
Add the variables below **before** the first deploy.

### 3. Environment variables

Set these for the **Production** environment only. (Leaving Preview empty means a preview
deployment shows a clear "service unavailable" instead of writing to the live diary.)

| Key | Value |
| --- | --- |
| `DATABASE_URL` | the pooler string from step 1 |
| `CLIENT_ORIGIN` | the site's final address, e.g. `https://richarani.in` — no trailing slash. Patients' emailed sign-in links are built from it |
| `ADMIN_TOKEN` | the token you generated (24+ characters) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | as in Option A — or leave them out and set `UPI_ID` for manual UPI payments |
| `UPI_ID` | the doctor's UPI ID, if paying by manual UPI |
| `SMTP_URL` | for confirmation emails |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | optional, as in Option A |
| `WHATSAPP_PROVIDER`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN` | only with WhatsApp automation |
| `CRON_SECRET` | **required with WhatsApp automation**: any random string, 16+ characters. Vercel sends it to the reminder job; without it the server refuses to start rather than silently never send a reminder |

Do **not** set `VITE_API_BASE` (the website calls `/api` on its own address), `PORT`, or
`CLIENT_IP_HEADER`. Vercel sets `NODE_ENV=production` itself.

### 4. Deploy and check

Push to `main` (or press Deploy). Then open `https://<project>.vercel.app/api/health`. You want
`"storage":"postgres"`, `"database":"up"` and a payment mode that is **not** `mock`. The very
first request after a deploy takes a moment (loading the function and a one-time schema
check); later ones are fast.

If it returns `503` or an error, open **Vercel → your project → Logs**. A line starting
*Refusing to start in production* lists exactly what is missing — the same checks as on Render.

### 5. Cut over from Render

Both can run at once against the same database, so this is a DNS change and nothing else.

1. Test the `*.vercel.app` address: book a slot, sign in to `/admin`, request a patient
   sign-in link.
2. In Vercel → **Settings → Domains**, add `richarani.in` and `www.richarani.in`. Vercel shows
   the DNS records to create; use exactly what it displays.
3. At your DNS provider, replace the current records (apex `A` → `216.24.57.1` and `www`
   `CNAME` → `dr-richa-rani-zg8t.onrender.com` — both Render's) with Vercel's. Lower the TTL
   to ~300 seconds a day beforehand so it takes effect quickly. Nothing else changes: the
   Razorpay webhook URL is the same address.
4. Wait for the domain to show *Valid Configuration* in Vercel. HTTPS is issued automatically.
5. Keep the Render service for a few days as a fallback, then delete it (and any
   UptimeRobot monitor aimed at it).

**Rollback:** point the DNS records back at Render. There is no data to move back, because
both use the same database.

### 6. Costs, limits and what runs when

- **Cron.** `vercel.json` declares one job, which runs on the Production deployment only:
  `/api/health` once a day, which runs `SELECT 1` and so keeps a free Supabase project from
  pausing. Check it in **Settings → Cron Jobs**. It replaces the UptimeRobot pinger from
  Option A.
- **WhatsApp reminders are paused on the free plan.** They need a job that runs every five
  minutes, which only Pro allows (Hobby refuses the deployment). They only matter with
  WhatsApp automation switched on, which is off by default. When you move to Pro and turn
  automation on, set `CRON_SECRET` and add this to the `crons` list in `vercel.json`:

  ```json
  { "path": "/api/cron/reminders", "schedule": "*/5 * * * *" }
  ```
- **Function limits.** The API is capped at 30 seconds per request (`maxDuration`); a booking
  takes well under one.
- **Supabase free tier** still pauses after about a week without activity, and the daily job
  above is what prevents that. It is no substitute for backups (see *Data protection*).

---

## How the Vercel setup works (for whoever maintains it)

Vercel runs functions, not a server that stays up, and that changes four things. Each is
already handled; this is why the code looks the way it does.

- **Two entry points, one app.** `server/src/app.js` builds the Express app. `server/src/index.js`
  runs it as a long-running server (Render, local, tests) and serves the built website.
  `api/index.js` runs it as a function; Vercel's CDN serves `client/dist`. Nothing else may
  live in `api/` — every file there becomes a function.
- **Shared state lives in Postgres.** Requests are spread over however many instances are warm,
  each with its own memory. Rate limits and the "this sign-in link was already used" record
  are kept in a `rate_limits` table there (`server/src/services/shared-state.js`), so a visitor
  cannot spend their allowance once per instance. On Render they stay in memory.
- **Work after the response.** Emails and WhatsApp messages are sent after the patient has been
  answered. A function can be frozen the moment it responds, so these go through `waitUntil`
  (`server/src/services/background.js`) to keep it alive until they are sent.
- **The schema is set up cheaply and safely.** `init()` used to run on every start. Now the
  database remembers a fingerprint of the schema and seed rows it last applied; a start that
  finds it current does one cheap check, and one that does not applies it under a lock, so
  several instances starting together cannot collide.

Smaller points: reminders use Vercel Cron instead of a timer; request bodies are read by
`server/src/middleware/body.js` because Vercel's runtime drains the request stream before Express
sees it (the stock `express.json()` fails with "stream is not readable" there); and the client IP
for rate limiting ignores `CF-Connecting-IP` on Vercel, because anyone can send that header when
Cloudflare is not in front.

**Tests.** `npm test` covers the app on the JSON store. `npm run test:postgres` runs it against a
real Postgres engine with shared state in the database, including two separate server processes
sharing one database. `npm run test:vercel` runs `api/index.js` through Vercel's own Node runtime,
with its request helpers on and off. The last two need packages that are deliberately not
dependencies — each prints the one command to install them, and CI runs them. What no local test
can show is `vercel.json` routing, the CDN, Cron and `waitUntil`; the checks below cover those.

---

## After deploying

- **Check the health endpoint**: `curl https://<your-site>/api/health` should report
  `"storage":"postgres"`, `"database":"up"`, and `"paymentMode":"razorpay-test"` or
  `"razorpay-live"` — never `"mock"`. It returns 503 if the database is unreachable, so
  it is also what the uptime monitor should watch.
- **Make one real booking** end to end and confirm the WhatsApp link works.
- **Check the webhook fires.** Razorpay Dashboard → Settings → Webhooks shows recent
  deliveries and their response codes. A booking should confirm even if you close the tab
  the instant the payment succeeds — that is the whole point of it.
- **Open `/admin`**, confirm your token works and a wrong one is rejected.
- **Send the link to yourself on WhatsApp** to check the preview card renders.
- **Check storage**: the health endpoint and the startup log should both say Postgres.
- **Set up the uptime pinger** (Render only, step 1b) — without it the site sleeps and the
  database eventually pauses. On Vercel nothing sleeps, and the daily cron in `vercel.json`
  keeps a free Supabase awake instead.
- **On Vercel, check what only Vercel can show** (no local test covers these):
  - **Routing.** `curl -s https://<your-site>/api/health` returns JSON (not an HTML page), and a
    page that does not exist, e.g. `/nope`, returns a 404 page.
  - **Link previews.** `curl -s https://<your-site>/about | grep '<title>'` prints the About
    page's own title, not the home page's. Do the same for `/faq` and `/contact`. WhatsApp
    reads exactly this.
  - **Webhook.** With Razorpay keys set, Razorpay Dashboard → Webhooks → *Send test* (or the
    next real payment) should show **200** against `/api/payments/webhook`. A 400 means the
    secret does not match; a 500 would mean the body was altered on the way in, which
    `npm run test:vercel` rules out for Vercel's runtime but only a live delivery proves.
  - **Cron.** *Settings → Cron Jobs* lists both jobs, and *Logs* shows `/api/cron/reminders`
    answering 200 every five minutes. A 401 there means `CRON_SECRET` is missing or short.
  - **Emails still go out.** Book a test slot and confirm the email arrives — these are sent
    after the response, which is the part a serverless function can get wrong.
- **Set up backups.** Supabase's free tier has limited backups and no point-in-time
  restore. For patient records, take your own periodic dump:
  `pg_dump "$DATABASE_URL" > backup.sql`. Supabase's dashboard can also export a table
  to CSV.

## A custom domain

On **Render**: Settings → Custom Domains, then point a CNAME at `<name>.onrender.com`.
On **Vercel**: Project → Settings → Domains; it shows the exact DNS records to create (see
Option C step 5, which also covers moving an existing domain over from Render).

Either way, update `CLIENT_ORIGIN` to the new domain and `og:url` in `client/index.html`,
then redeploy — otherwise the API starts rejecting its own front end and link previews
point at the old address.

---

## Data protection

This stores patient health information, which under the Digital Personal Data Protection
Act, 2023 carries real obligations:

- HTTPS is on by default on both Render and Vercel — keep it that way.
- Neon and Supabase both encrypt at rest and require TLS in transit.
- **Take your own backups.** `pg_dump "$DATABASE_URL" > backup.sql` on a schedule.
- Have a deletion process. A patient can ask for their data to be removed.
- Never commit `server/data/` — it is gitignored, keep it that way.

---

## WhatsApp automation (optional)

By default the site gives the patient a `wa.me` link and they message the clinic. With the
**WhatsApp Business Cloud API** the website messages the patient itself:

| When | Template | What the patient gets |
| --- | --- | --- |
| Patient submits their UPI reference | `booking_received` | "We have your payment details; the clinic will confirm shortly" |
| Doctor presses **Confirm payment** | `booking_confirmed` | "Your consultation is confirmed for …" |
| `WHATSAPP_REMINDER_MINUTES` (default 60) before the slot | `booking_reminder` | A reminder, once |

Messages are sent best-effort: a failure is logged and never fails a booking. The email and the
confirmation page keep working either way.

### Set it up in Meta

1. Create a **Meta Business account** (business.facebook.com) and a **developer app** at
   developers.facebook.com, choosing the **Business** type and adding the **WhatsApp** product.
2. **Add the clinic's number** under WhatsApp → API Setup. **Important:** a number registered on the Cloud
   API generally cannot also be signed in to the WhatsApp Business *app* on a phone (check Meta's current
   "coexistence" rules, which are still rolling out). Use a **separate number** for automation if the doctor
   wants to keep chatting from the app.
3. Copy the **Phone number ID**, and create a **permanent access token**: Business Settings → Users →
   **System users** → add one → assign the WhatsApp app → generate a token with
   `whatsapp_business_messaging` and `whatsapp_business_management`. The temporary token on the API Setup
   page expires after 24 hours and is only for testing.
4. **Create three message templates** (WhatsApp Manager → Message templates), category **Utility**,
   language **English**. Each takes four variables in this order:
   `{{1}}` patient name, `{{2}}` date and time (IST), `{{3}}` service, `{{4}}` booking ID.

   | Name | Suggested text |
   | --- | --- |
   | `booking_received` | Hello {{1}}, we have received your payment details for a {{3}} on {{2}} IST (Booking ID {{4}}). Dr. Richa Rani's clinic will confirm shortly. |
   | `booking_confirmed` | Hello {{1}}, your {{3}} with Dr. Richa Rani is confirmed for {{2}} IST (Booking ID {{4}}). Please message us here at the scheduled time to begin. |
   | `booking_reminder` | Reminder: {{1}}, your {{3}} with Dr. Richa Rani starts at {{2}} IST (Booking ID {{4}}). Please keep any reports handy and message us here when it is time. |

   Approval usually takes minutes to a day. Hindi, Punjabi and Russian versions are optional: register them
   with the same names and list the codes in `WHATSAPP_TEMPLATE_LANGS` (e.g. `en,hi`). A patient whose
   language has no template gets English.
5. **Set these on Render or Vercel** (and in `server/.env` to test locally):

   | Key | Value |
   | --- | --- |
   | `WHATSAPP_PROVIDER` | `cloud-api` |
   | `WHATSAPP_PHONE_NUMBER_ID` | from step 3 |
   | `WHATSAPP_TOKEN` | the permanent token from step 3 |
   | `WHATSAPP_TEMPLATE_LANGS` | `en` (or `en,hi`, …) |

   The server refuses to start in production with `cloud-api` and a missing ID or token.

   **On Vercel, also set `CRON_SECRET`** (any random string, 16+ characters). A function cannot
   hold the timer that sends reminders on Render; Vercel Cron calls `/api/cron/reminders` every
   five minutes instead and presents this secret (Pro only — see Option C step 6 for the line
   to add to `vercel.json`). The server refuses to start on Vercel with
   `cloud-api` and no `CRON_SECRET`, rather than quietly never sending a reminder.
6. Redeploy, then book a test appointment with **your own phone number** and check the three messages arrive.
   `/api/health` reports `"whatsapp":"cloud-api"` when it is on.

**Costs and limits.** Meta charges per message conversation (utility templates are a few paise each in
India; check the current rate card). An unverified business account has a low daily limit of new
recipients, so complete **business verification** in Business Settings before real volume. Patients must
have a WhatsApp number; the 10-digit number they enter at booking is used.

---

## The dashboards

### Clinic dashboard — `/admin`

Sign in with the **clinic email** (`ADMIN_EMAIL`, default `drricha7273@gmail.com`) and the **password**
(`ADMIN_PASSWORD`, default the same value as `ADMIN_TOKEN`). The session lasts 12 hours and ends when the
tab closes. Changing the password or token on Render signs everyone out.

| Tab | What it does |
| --- | --- |
| Overview | Today's schedule, payments waiting to be verified (with a Confirm button), revenue, a 15-day chart |
| Bookings | Every booking: confirm payment, complete, cancel, **private notes and a follow-up date** |
| Calendar | One week at a glance: hours, time off and bookings per day |
| Patients | Searchable list by name, phone or email; each patient's full history and notes |
| Hours & time off | Edit weekly consulting hours without touching code; block days or hours off |

Private notes never leave the clinic view. The follow-up date is the one thing a patient sees.
Notes are health data: the page is only ever served after sign-in, and the notes are stored in your own
database. Back the database up (Supabase does daily backups on paid plans; the free plan does not).

New in the database: `doctor_notes`, `follow_up_date`, `reminder_sent_at` and a `settings` table. They
are added automatically on first start.

### Patient dashboard — `/account`

Patients enter their booking email and receive a **one-time sign-in link** (valid 15 minutes, works once).
No password. They see upcoming and past consultations, can join on WhatsApp, cancel a booking they have
not yet paid for, and see a follow-up date if the doctor set one. Links are only emailed to addresses that
already have a booking, and the page answers identically either way, so it cannot be used to find out who is
a patient. This needs `SMTP_URL` to be working.

