# Deploying

The app is one Node process serving both the API and the built client from a single
origin. Bookings live in **Postgres**, so no persistent disk is needed and the whole
thing runs on free tiers.

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
| **Vercel (front end) + Render (API)** | Free¹ | Front end on a fast CDN; two services to keep in sync. |

¹ Vercel's Hobby plan is free but **not licensed for commercial use**. A practice taking
payments is commercial, so a live clinic site would need a paid Vercel plan. Check their
current terms — and Render's pricing — before relying on either.

**Recommendation: Render as a single service.** One thing to deploy, one origin, no CORS.

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
| Build command | `npm ci && npm run build` |
| Start command | `node server/src/index.js` |
| Health check path | `/api/health` |
| Instance type | Free (or Starter, to stop it sleeping) |

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

Vercel cannot run this backend (see below), so this splits them: Vercel serves the React
app from its CDN, Render runs the API.

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

## Why Vercel cannot host the backend

Vercel runs serverless functions. They have no persistent filesystem — `/tmp` is wiped
between invocations and is not shared between concurrent instances. Bookings live in a
JSON file, so on Vercel they would disappear, and two patients booking at once could hit
different instances and both be given the same slot.

Storage is no longer the blocker — bookings are in Postgres now. What remains is that
Express has to be wrapped as a serverless function, and that serverless Postgres
connections need pooling care (Neon's pooled connection string, or its HTTP driver).
Workable, but it buys little over Option A.

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
- **Set up the uptime pinger** (step 1b) — without it the site sleeps and the database
  eventually pauses.
- **Set up backups.** Supabase's free tier has limited backups and no point-in-time
  restore. For patient records, take your own periodic dump:
  `pg_dump "$DATABASE_URL" > backup.sql`. Supabase's dashboard can also export a table
  to CSV.

## A custom domain

On **Render**: Settings → Custom Domains, then point a CNAME at `<name>.onrender.com`.
On **Vercel**: Project → Settings → Domains.

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
