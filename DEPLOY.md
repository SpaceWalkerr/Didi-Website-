# Deploying

The app is one Node process serving both the API and the built client from a single
origin. It needs **persistent disk** for the booking store, so a serverless host
(Vercel, Netlify functions, Cloudflare Workers) will not work as-is — their
filesystems are discarded between invocations and every booking would vanish.

Fly.io is configured here because it runs a real process with a mounted volume and
has a Mumbai region. Render, Railway, a VPS, or any container host with a volume
would work the same way.

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

## Deploy to Fly

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

- **Check the health endpoint**: `curl https://<your-app>.fly.dev/api/health` should
  report `"paymentMode":"razorpay-test"` or `"razorpay-live"`, never `"mock"`.
- **Make one real booking** end to end and confirm the WhatsApp link arrives.
- **Open `/admin`** and confirm your token works and a wrong one is rejected.
- **Send the link to yourself on WhatsApp** to check the preview card renders.
- **Set up backups.** `fly volumes` snapshots daily by default, but confirm it — this
  is patient health data and there is no second copy.

## A custom domain

```bash
fly certs add www.example.com
```

Then point a CNAME at `<your-app>.fly.dev`. Update `CLIENT_ORIGIN` in `fly.toml` and
`og:url` in `client/index.html` to the real domain, and redeploy.

---

## Data protection

This stores patient health information, which under the Digital Personal Data
Protection Act, 2023 carries real obligations:

- HTTPS is forced in `fly.toml` — leave it that way.
- The volume holds unencrypted JSON. For anything beyond a small practice, move to a
  managed database with encryption at rest (rewrite `server/src/db.js` only).
- Have a deletion process. A patient can ask for their data to be removed.
- Do not commit `server/data/` — it is gitignored, keep it that way.
