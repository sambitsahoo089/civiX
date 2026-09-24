# CiviX — Public Infrastructure Reporting

<p align="center">
  <img src="public/civix-logo.svg" alt="CiviX" width="320">
</p>

**CiviX** is a citizen-centric platform for reporting public infrastructure damage.

A citizen-centric web platform for reporting public infrastructure issues with geo-tagged
photos, tracking them to resolution, and **alerting the police, ambulance and fire brigade
helplines for emergencies**.

Phase 1 scope: web app, geo-tagged photo reporting, status tracking, authority dashboard.
Out of scope for Phase 1: native mobile apps, AI damage detection, public heatmaps.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19, JavaScript |
| Styling | Tailwind CSS v4 |
| Database | MongoDB via Mongoose (`mongodb-memory-server` runs real `mongod` binaries locally) |
| Auth | Auth.js (NextAuth v5) — credentials, JWT sessions, `CITIZEN` / `AUTHORITY` roles |
| Maps | Leaflet + OpenStreetMap tiles |
| 3D | three.js (procedural low-poly city on the landing hero) |
| Uploads | Local `public/uploads` in dev, MongoDB GridFS or Vercel Blob in production |

> The dev database data directory lives **outside** the repo (see `scripts/mongo-server.js`)
> because WiredTiger crashes when its files sit in a cloud-synced folder such as OneDrive.
> Override with `MONGO_DATA_DIR` if you want it elsewhere.

## Getting started

```bash
npm install
cp .env.example .env          # .env already exists in this checkout
npm run db:start              # real mongod on mongodb://127.0.0.1:5434
npm run db:seed               # demo accounts + 9 sample issues (3 emergencies)
npm run dev                   # http://localhost:3000
```

Demo accounts:

| Role | Email | Password |
|---|---|---|
| Authority | `authority@city.gov` | `admin123` |
| Citizen | `citizen@example.com` | `password123` |

## Issue categories

**Civic:** potholes · broken streetlight · water leak · damaged footpath · open drain · other

**Emergency — these unlock one-tap helpline calls:**

| Category | Services offered |
|---|---|
| Road / highway accident | Police · Ambulance · Fire brigade |
| Fire / smoke | Fire brigade · Ambulance · Police |
| Medical emergency | Ambulance · Police |

## Emergency call & dispatch flow

1. **Citizen reports.** Choosing an emergency category reveals call buttons for the relevant
   services. Tapping one dials the helpline (`tel:`) so the call lands in the phone's call log,
   and the tap is stored on the report (`notifiedServices`).
2. **Citizen can also inform later.** The issue page shows the same panel, which records the
   call straight away via `POST /api/reports/[id]/notify`.
3. **Authority sees what happened.** The dashboard flags emergencies, counts those
   **awaiting helpline dispatch**, and the issue page shows, per service, either
   *“Citizen informed this service on &lt;time&gt;”* or a **Forward** button.
   **A service the citizen already informed gets no button** — no duplicate dispatch.
4. **Authority forwards.** Tapping any forward button sends the full report (photo link,
   coordinates, address, description, reporter) to **all three services** — helpline number and
   email — and marks them forwarded so the buttons disappear. `POST /api/reports/[id]/forward`.
5. **Everything is auditable.** Each call/forward is written to the `alertlogs` collection and
   shown in the *Helpline dispatch log* on the issue page.

Helpline (Phase 1, shared by all three services):

- Phone **8895465904**
- Email **comedydedanadan089@gmail.com**

Change them per service in `lib/services.js`. Delivery is pluggable in `lib/alerts.js`:

- `RESEND_API_KEY` → sends the alert email through Resend
- `ALERT_SMS_WEBHOOK_URL` → POSTs `{ to, text }` to your SMS gateway

Without a provider the alert is still fully recorded (recipients, message, per-channel status)
so nothing is silently lost, and the UI reports the channel as `SKIPPED`.

## API

| Route | Who | Purpose |
|---|---|---|
| `POST /api/reports` | citizen | Create a report (multipart: category, description, photo, coordinates, `notifiedServices`) |
| `POST /api/reports/[id]/status` | authority | Move an issue through the workflow with a note |
| `POST /api/reports/[id]/notify` | citizen (owner) / authority | Record that a service was informed by phone |
| `POST /api/reports/[id]/forward` | authority | Forward the report to all emergency services (phone + email) |
| `POST /api/register` | public | Citizen self-registration |
| `GET /api/files/[id]` | public | Streams images uploaded to GridFS (production storage) |

## Design

- **Responsive** across phone, tablet, laptop and desktop: mobile nav drawer, stacked grids,
  44px minimum touch targets, sticky submit bar on the report form, card-style lists instead of
  wide tables.
- **Animated but optional**: siren pulses, gradient headline, floating cards — all disabled
  under `prefers-reduced-motion`.
- **3D hero**: procedural low-poly city block with a pulsing issue marker, drag to orbit.
  Falls back to an SVG city if WebGL is unavailable.
- **Emergency surfaces** are visually distinct (red gradients, pulsing siren) so they cannot be
  mistaken for routine civic reports.

## KPIs

The dashboard tracks open vs resolved vs rejected counts, total reports, emergency volume and
the number of emergencies still awaiting helpline dispatch.

## Deployment (Render + MongoDB Atlas)

The app deploys as a **single Render Web Service** (Next.js handles both frontend and backend)
talking to a **MongoDB Atlas** cluster. A [`render.yaml`](render.yaml) blueprint is included.

### 1. Push this repo to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/sambitsahoo089/civiX.git
git push -u origin main
```

### 2. Create the MongoDB Atlas cluster (free tier works)

1. Sign up at <https://www.mongodb.com/cloud/atlas> → **Build a Database** → **M0 (Free)**.
2. Pick a region close to you, create the cluster.
3. **Database Access** → *Add New Database User* (username + password, role
   *Read and write to any database*). Save the password — you'll paste it into the
   connection string.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** `0.0.0.0/0`
   (Render's IPs aren't fixed on the free plan).
5. **Database → Connect → Drivers** and copy the SRV string, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`.
   Append the database name before any `?`: `...mongodb.net/civix?retryWrites=...`

### 3. Create the Render web service

1. Sign up at <https://render.com> with your GitHub account.
2. **New +** → **Web Service** → connect the `civiX` repository (you may need to
   *Configure account* → grant Render access to the repo first).
3. Render reads `render.yaml` if you use **Blueprint**, otherwise fill in:
   - **Runtime:** Node · **Region:** closest to you
   - **Build Command:** `npm ci --include=dev && npm run build`
   - **Start Command:** `npm run start`
   - **Health Check Path:** `/`
4. **Environment variables** (the important part):

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas SRV string from step 2.5 |
   | `MONGODB_DB` | `civix` |
   | `AUTH_SECRET` | any long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) |
   | `AUTH_TRUST_HOST` | `true` |
   | `AUTH_URL` | your public site URL, e.g. `https://civix-xxxx.onrender.com` (no trailing slash) |
   | `NODE_ENV` | `production` |

   > **`AUTH_URL` is required on Render.** Behind Render's proxy, Auth.js otherwise
   > builds some redirect URLs from `http://localhost:3000` — the classic symptom is
   > refreshing a page bouncing your browser to `localhost`, which shows nothing.

   > **Important:** keep the `--include=dev` flag in the build command. With
   > `NODE_ENV=production`, npm skips devDependencies by default — and Tailwind's
   > PostCSS plugin is a devDependency, so the build fails with
   > `Cannot find module '@tailwindcss/postcss'` without it. (Do **not** drop
   > `NODE_ENV=production` either — the image-storage layer uses it at runtime to
   > select GridFS.)

5. **Create Web Service** — first build takes a few minutes. Your app goes live at
   `https://civix-xxxx.onrender.com`.

### 4. Seed demo data into Atlas (optional)

From your machine, pointing at the production cluster:

```bash
MONGODB_URI="mongodb+srv://..." MONGODB_DB=civix npm run db:seed
```

The seed refuses to run against a production database unless you pass `SEED_FORCE=true` —
it wipes and replaces the sample issues, so only force it when the database is still empty.

### 5. Notes for the Render free plan

- **Ephemeral disk:** uploaded photos would vanish on every deploy — that's why production
  writes them to **MongoDB GridFS** (`lib/storage.js`) and serves them from `/api/files/[id]`.
  For unlimited storage, set `BLOB_READ_WRITE_TOKEN` (Vercel Blob) instead.
- **Spin-down:** free services sleep after ~15 min idle; the first request afterwards
  takes ~30–60 s. Uptime monitors or the paid plan avoid this.
- **Logs & deploys:** every `git push` to the connected branch auto-deploys; logs are in the
  dashboard *Events* / *Logs* tabs.

