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

### The one catch with Render's free tier

Free web services sleep after about 15 minutes idle. The first visitor after a quiet
spell waits roughly 50 seconds on a blank page before anything renders — on a booking
site that reads as broken, and most people leave.

That is fine while you are testing and sharing the link for review. Before real patients
use it, either upgrade to Starter, or accept that the first patient of the day waits.

---

## Before the first deploy

### 1. Generate an admin token

```bash
node -e "console.log(crypto.randomUUID())"
```

The admin view exposes every patient's name, phone, email and symptom summary. The server
**refuses to start in production** with the default token or anything under 24 characters.

### 2. Get Razorpay keys

From the Razorpay dashboard. The server also **refuses to start in production** without
them, because simulated payments would let patients book real appointments having paid
nothing — and the booking page would say so.

Test keys (`rzp_test_…`) accept only test cards; real patients cannot pay with them. Live
keys require KYC.

For a staging site nobody will book on, `ALLOW_DEMO_PAYMENTS=true` overrides this. Never
set it where patients can reach it.

---

## Option A — Render, one service (recommended)

### 1. Create a free Postgres

Any Postgres works — the app talks to it with plain `pg` and one `DATABASE_URL`. Two
free options, and the choice matters less than it looks:

| | **Neon** | **Supabase** |
| --- | --- | --- |
| Idle behaviour | Suspends in minutes, **wakes automatically** on the next connection | Free projects **pause after ~1 week idle** and need a manual restore from the dashboard |
| Seeing your data | SQL editor | SQL editor **plus a spreadsheet-style table editor** |
| Extras | Database branching | Auth, file storage, realtime — none of which this app uses |

**The one that actually matters for a clinic site is the idle behaviour.** A new practice
can easily go a quiet week, and on Supabase's free tier that means the database pauses
and bookings start failing until someone logs in and restores it. Neon just wakes up.

**Pick Supabase if** you want to look at bookings in a table editor without writing SQL —
genuinely useful for a non-developer — and you will remember to keep the project awake or
upgrade. **Pick Neon if** you want to set it up and forget about it.

Free-tier terms change; check both before deciding.

#### Neon

Create a project at [neon.tech](https://neon.tech) in the `ap-southeast-1` (Singapore)
region and copy the connection string:

```
postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

#### Supabase

Create a project at [supabase.com](https://supabase.com) in the Singapore region. Then
**Project Settings → Database → Connection string**, and — this part matters — take the
**Session pooler** string, not "Direct connection":

```
postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

Supabase's direct connections are IPv6-only, and most hosts (Render included) make
outbound connections over IPv4. Using the direct string is the usual cause of a deploy
that builds cleanly and then cannot reach the database at all.

Either way you do **not** need to create any tables — the server creates them on first
start.

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
  `"paymentMode":"razorpay-test"` or `"razorpay-live"` — never `"mock"`.
- **Make one real booking** end to end and confirm the WhatsApp link works.
- **Open `/admin`**, confirm your token works and a wrong one is rejected.
- **Send the link to yourself on WhatsApp** to check the preview card renders.
- **Check storage**: the health endpoint and the startup log should both say Postgres.
- **Set up backups.** Neon's free tier keeps a short restore window; Supabase's free tier
  has limited backups. For real patient records, take your own periodic dump —
  `pg_dump "$DATABASE_URL" > backup.sql`.

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
