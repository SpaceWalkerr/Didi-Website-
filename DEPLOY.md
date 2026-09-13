# Deploying

The app is one Node process serving both the API and the built client from a single
origin. It needs **persistent disk** for the booking store, which is the one fact
that decides where it can go.

## Which host

| Option | Works? | Notes |
| --- | --- | --- |
| **Render** (one service) | ✅ Simplest | Node process + a disk. Needs a paid instance — the free tier has no disk. |
| **Fly.io** (one machine) | ✅ | Same shape, Mumbai region. `fly.toml` included. |
| **Vercel + Render** (split) | ✅ | SPA on Vercel's CDN, API on Render. Two services to manage. |
| **Vercel alone** | ❌ | Serverless: no persistent filesystem, so bookings would vanish. Needs a database first. |

**Recommendation: Render as a single service.** One thing to deploy, one origin, no
CORS, and the whole app in one place. Take the split only if you specifically want
Vercel's CDN for the front end.

Configs for all three are in the repo: `render.yaml`, `fly.toml`, `vercel.json`.

---

## Before the first deploy

### 1. Generate an admin token

```bash
node -e "console.log(crypto.randomUUID())"
```

The admin view exposes every patient's name, phone, email and symptom summary. The
server **refuses to start in production** with the default token or anything under
24 characters.

### 2. Get Razorpay keys

From the Razorpay dashboard. The server also **refuses to start in production**
without them, because simulated payments would let patients book real appointments
having paid nothing — and the booking page would tell them so.

For a staging site nobody will book on, `ALLOW_DEMO_PAYMENTS=true` overrides this.
Never set it on the site patients actually use.

---

## Option A — Render, one service (recommended)

`render.yaml` describes the whole thing. In the Render dashboard: **New → Blueprint**,
point it at this GitHub repo, and it reads that file.

Or set it up by hand — **New → Web Service**, connect the repo, then:

- **Build command:** `npm ci && npm run build`
- **Start command:** `node server/src/index.js`
- **Health check path:** `/api/health`
- **Instance type:** any paid type. **The free tier has no disk**, so bookings would be
  erased on every deploy and on every idle restart.

Add the disk — **Settings → Disks → Add Disk**:

- **Name:** `clinic-data`
- **Mount path:** `/var/data`
- **Size:** 1 GB

Then set the environment variables (**Environment → Add Environment Variable**):

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/var/data` — must match the disk's mount path |
| `CLIENT_ORIGIN` | your Render URL, e.g. `https://dr-richa-rani.onrender.com` |
| `ADMIN_TOKEN` | the token you generated |
| `RAZORPAY_KEY_ID` | from Razorpay |
| `RAZORPAY_KEY_SECRET` | from Razorpay |

Deploy. Render gives you `https://<name>.onrender.com`.

> **The disk is the part people miss.** Render's filesystem is otherwise wiped on every
> deploy. If `DATA_DIR` does not point at a mounted disk, the site will look like it is
> working and quietly lose every booking.

---

## Option B — Vercel for the front end, Render for the API

Vercel cannot run the backend (see below), so this splits them: Vercel serves the React
app from its CDN, Render runs the API.

**1. Deploy the API to Render** exactly as in Option A, but set `CLIENT_ORIGIN` to your
Vercel URL instead. Multiple origins are allowed, comma-separated — useful for Vercel's
per-branch preview URLs:

```
CLIENT_ORIGIN=https://dr-richa-rani.vercel.app,https://dr-richa-rani-git-main-you.vercel.app
```

**2. Deploy the front end to Vercel.** Import the repo; `vercel.json` already sets the
build command, output directory and the SPA rewrite. Add one environment variable:

| Key | Value |
| --- | --- |
| `VITE_API_BASE` | your Render API URL, e.g. `https://dr-richa-rani.onrender.com` |

It must be set **before** the build — Vite bakes it into the bundle, so changing it
later needs a redeploy.

**3. Check the two can talk.** Open the booking page and confirm the consultation types
and prices load. If they do not, it is almost always `CLIENT_ORIGIN` not matching the
Vercel origin exactly — scheme and host must both match, with no trailing slash.

Trade-offs: two services to deploy and keep in sync, CORS to get right, and the API on
Render's free tier sleeps after inactivity, so the first booking of the day would hang
for ~30 seconds. A paid instance avoids that — and you need one for the disk anyway.

---

## Why Vercel cannot host the backend

Vercel runs serverless functions. They have no persistent filesystem — `/tmp` is wiped
between invocations and is not shared between concurrent instances. Bookings are stored
in a JSON file (`server/src/db.js`), so on Vercel they would disappear, and two patients
booking at once could hit different instances and both get the same slot.

To run the whole thing on Vercel, the storage layer has to change first: rewrite
`server/src/db.js` against a real database — Vercel Postgres, Neon, Supabase or MongoDB
Atlas — and expose the Express app as a serverless function. `db.js` is deliberately the
only file that touches storage, but the change is not purely mechanical: the current
functions are synchronous, so `getSlots`, `validateSlot` and their callers would all
become async.

That is worth doing if you expect real traffic or want a managed database with backups.
It is not worth doing to avoid paying for a Render instance.

---

## Option C — Deploy to Fly

```bash
fly auth login
```

```bash
fly launch --no-deploy --copy-config --name dr-richa-rani --region bom
```

Create the volume the bookings live on — **without this, every deploy wipes them**:

```bash
fly volumes create clinic_data --region bom --size 1
```

Set the secrets:

```bash
fly secrets set ADMIN_TOKEN="paste-the-generated-token" RAZORPAY_KEY_ID="rzp_live_..." RAZORPAY_KEY_SECRET="..."
```

Deploy:

```bash
fly deploy
```

```bash
fly open
```

If you use a different app name, update `app` and `CLIENT_ORIGIN` in `fly.toml`.

---

## After deploying

- **Check the health endpoint**: `curl https://<your-site>/api/health` should
  report `"paymentMode":"razorpay-test"` or `"razorpay-live"`, never `"mock"`.
- **Make one real booking** end to end and confirm the WhatsApp link arrives.
- **Open `/admin`** and confirm your token works and a wrong one is rejected.
- **Send the link to yourself on WhatsApp** to check the preview card renders.
- **Set up backups.** `fly volumes` snapshots daily by default, but confirm it — this
  is patient health data and there is no second copy.

## A custom domain

On **Render**: Settings → Custom Domains → add it, then point a CNAME at
`<name>.onrender.com`.

On **Vercel**: Project → Settings → Domains.

On **Fly**:

```bash
fly certs add www.example.com
```

Whichever you use, update `CLIENT_ORIGIN` to the new domain and `og:url` in
`client/index.html`, then redeploy — otherwise the API will start rejecting the browser
and link previews will point at the old address.

---

## Data protection

This stores patient health information, which under the Digital Personal Data
Protection Act, 2023 carries real obligations:

- HTTPS is forced in `fly.toml` — leave it that way.
- The disk holds unencrypted JSON. For anything beyond a small practice, move to a
  managed database with encryption at rest (rewrite `server/src/db.js` only).
- **Back up the disk.** Render snapshots daily on paid plans; confirm it is on. There is
  no second copy of this data.
- Have a deletion process. A patient can ask for their data to be removed.
- Do not commit `server/data/` — it is gitignored, keep it that way.
