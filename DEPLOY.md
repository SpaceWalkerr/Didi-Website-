# Deploying

The app is one Node process serving both the API and the built client from a single
origin. Bookings are stored in a JSON file, and that one fact decides everything about
where it can go: **it needs a persistent disk.**

Every host gives each deploy a fresh filesystem. Without a disk the site looks perfectly
healthy and quietly loses every booking on each deploy and each idle restart — the kind
of failure you discover when a patient arrives for an appointment nobody has a record
of. The server now refuses to start in production unless `DATA_DIR` is set, so this
cannot happen silently.

---

## Which host

| Option | Cost | Notes |
| --- | --- | --- |
| **Render, one service + disk** | Paid instance | Simplest correct setup. One origin, no CORS. |
| **Vercel (front end) + Render (API)** | Vercel free¹ + paid Render | Front end on a fast CDN; two services to keep in sync. |
| **Either one, free tier** | Free | ⚠️ **Only after moving storage to a database** — see below. |

¹ Vercel's Hobby plan is free but **not licensed for commercial use**. A practice taking
payments is commercial, so a live clinic site needs a paid Vercel plan. Check their
current terms before relying on it.

**Recommendation: Render as a single service.** One thing to deploy, one origin, no CORS,
and the whole app in one place.

### Deploying for free

A free tier has no disk, so the JSON store has to go first. Swap `server/src/db.js` for a
free managed Postgres (Neon, Supabase, or Render's own) and no disk is needed — storage
lives in the database instead. `db.js` is the only file that touches storage, but the
change is not purely mechanical: its functions are synchronous today, so `getSlots`,
`validateSlot` and their callers all become `async`.

Be aware that Render's free web services sleep after ~15 minutes idle. The first patient
of the day would wait roughly a minute on a blank page before the booking form appeared.

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

### 1. Create the service

`render.yaml` describes the whole thing, so in the Render dashboard choose
**New → Blueprint** and point it at the GitHub repo.

To do it by hand instead — **New → Web Service**, connect the repo, then:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Region | Singapore (closest to India) |
| Build command | `npm ci && npm run build` |
| Start command | `node server/src/index.js` |
| Health check path | `/api/health` |
| Instance type | Any **paid** type — the free tier has no disk |

### 2. Add the disk

**Settings → Disks → Add Disk:**

| Field | Value |
| --- | --- |
| Name | `clinic-data` |
| Mount path | `/var/data` |
| Size | 1 GB |

### 3. Set environment variables

**Environment → Add Environment Variable:**

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/var/data` — must match the disk's mount path exactly |
| `CLIENT_ORIGIN` | your Render URL, e.g. `https://dr-richa-rani.onrender.com` |
| `ADMIN_TOKEN` | the token you generated |
| `RAZORPAY_KEY_ID` | `rzp_test_…` or the live key |
| `RAZORPAY_KEY_SECRET` | from Razorpay |

You will not know the Render URL until the service is created, so set `CLIENT_ORIGIN`
after the first deploy and let it redeploy.

### 4. Deploy

Render builds on push to `main`. The first deploy takes a few minutes.

If it fails, open **Logs** — the server prints exactly what it refused to start over:
a missing `DATA_DIR`, a weak `ADMIN_TOKEN`, or missing Razorpay keys. All three are
deliberate (`server/src/preflight.js`).

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

Running the whole thing on Vercel means replacing the storage layer first: rewrite
`server/src/db.js` against a managed database and expose the Express app as a serverless
function. That is the same migration described under *Deploying for free* above.

---

## After deploying

- **Check the health endpoint**: `curl https://<your-site>/api/health` should report
  `"paymentMode":"razorpay-test"` or `"razorpay-live"` — never `"mock"`.
- **Make one real booking** end to end and confirm the WhatsApp link works.
- **Open `/admin`**, confirm your token works and a wrong one is rejected.
- **Send the link to yourself on WhatsApp** to check the preview card renders.
- **Set up backups.** Render snapshots disks daily on paid plans — confirm it is on. There
  is no second copy of this data.

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
- The disk holds unencrypted JSON. For anything beyond a small practice, move to a managed
  database with encryption at rest (rewrite `server/src/db.js` only).
- **Back up the disk.** There is no second copy of this data.
- Have a deletion process. A patient can ask for their data to be removed.
- Never commit `server/data/` — it is gitignored, keep it that way.
