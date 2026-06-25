# MatchPulse Live

Broadcast-grade, low-latency sports overlay system for OBS/vMix. Built with Next.js
(App Router), MongoDB, and the Pusher Channels protocol. Two ways to run it: against
cloud services (MongoDB Atlas + Pusher Channels) via `npm run dev`, or **fully locally**
with `docker compose` — no cloud accounts needed for that path.

This is **Phase 1 (núcleo)**: the Main Bug + HT/FT overlay, the drift-corrected clock,
the Live Console operator panel, and crash-resilient state rehydration. See
`/Users/ealvarado/.claude-personal/plans/expressive-orbiting-metcalfe.md` for the full
plan and what's deliberately out of scope for this phase.

## Architecture at a glance

- **`/overlay/[matchId]`** — what you load as an OBS/vMix Browser Source. Transparent,
  read-only, no auth. Hydrates over REST on load, then stays live via Pusher.
- **`/control/[matchId]`** — the operator console. Password-gated.
- **`/login`** — single shared password gate for the control console.
- **MongoDB** — `teams`, `matches` (static data) and `matchStates` (the live, mutable
  per-match document that the overlay and console both read).
- **Pusher Channels** (or a self-hosted equivalent — see Option A) — the realtime bus.
  The control panel calls `PATCH /api/matches/[id]/state`, which writes to Mongo and
  broadcasts the new state; the overlay and console both just listen.

## Option A: fully local, via Docker (no accounts needed)

```bash
docker compose up --build
```

This starts three containers — `mongo` (MongoDB), `soketi` (a self-hosted,
Pusher-protocol-compatible WebSocket server — same wire protocol Pusher Channels uses,
so the app code doesn't know the difference), and `app` (this Next.js app) — wired
together with fixed local dev credentials baked into `docker-compose.yml`. Nothing to
fill in.

Then seed the local database (only needed once, or after a `docker compose down -v`):

```bash
npm run seed:docker
```

Open:
- Control: `http://localhost:3000/control/<matchId>` (password printed isn't real —
  it's `devpassword`, or whatever you set `CONTROL_PASSWORD` to in your shell env)
- Overlay: `http://localhost:3000/overlay/<matchId>`

`<matchId>` is printed by the seed script. Data persists in the `mongo_data` Docker
volume across restarts; `docker compose down -v` wipes it.

If port 3000 is already taken by something else on your machine, override it without
touching `docker-compose.yml`:

```bash
APP_PORT=3001 docker compose up --build
```

(Only the `app` service's host port changes — `mongo` and `soketi` are unaffected, and
the browser still reaches soketi on `localhost:6001` regardless.)

If you want to point the Docker stack at real cloud Pusher/Mongo instead of the bundled
local ones, edit the hardcoded values in `docker-compose.yml`'s `app` and `args`
sections — they're intentionally inline there rather than env-file-driven, so the
default `docker compose up` always works standalone.

## Option B: cloud services, via `npm run dev`

### 1. Create your accounts (free tier)

#### MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **Project**, then build a **free M0 cluster** (any region close to you).
3. Under **Database Access**, create a database user with a username/password (not
   OAuth) — you'll need these in the connection string.
4. Under **Network Access**, add an IP access entry. For local development, "Allow
   access from anywhere" (`0.0.0.0/0`) is fine; tighten this before going to production.
5. Once the cluster is up, click **Connect → Drivers**, copy the connection string. It
   looks like `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`.
6. Paste it into `.env.local` as `MONGODB_URI`. Leave `MONGODB_DB=matchpulse` — the app
   creates collections automatically on first write, no manual schema setup needed.

#### Pusher Channels

1. Go to https://dashboard.pusher.com/accounts/sign_up and create a free account.
2. Create a new **Channels app** (not Beams, not Chatkit). Pick any cluster close to
   you (e.g. `us2`, `eu`).
3. Open the app's **App Keys** tab. You'll see `app_id`, `key`, `secret`, `cluster`.
4. Fill in `.env.local`:
   - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` — from App Keys.
   - `NEXT_PUBLIC_PUSHER_KEY` — same value as `PUSHER_KEY`.
   - `NEXT_PUBLIC_PUSHER_CLUSTER` — same value as `PUSHER_CLUSTER`.
   (The `NEXT_PUBLIC_` versions are what the browser uses; they're the same key, just
   re-exposed under the prefix Next.js requires for client-side env vars.)

#### Control password

Pick any password and set it as `CONTROL_PASSWORD` in `.env.local`. This is the single
shared password the operator console (`/login`) checks — there's no per-user account
system in this phase.

#### Vercel Blob (optional for now)

Used in a future phase for uploading team logos. You can leave `BLOB_READ_WRITE_TOKEN`
blank for now — team logos work fine as plain URLs (or no logo at all, which falls back
to a default crest).

### 2. Install and seed

```bash
npm install
cp .env.example .env.local   # if you haven't already — then fill in the values above
npm run seed                 # creates 2 demo teams + 1 match in MongoDB
```

The seed script prints the match ID and ready-to-use overlay/control URLs.

### 3. Run it

```bash
npm run dev
```

- Open the **Control URL** printed by the seed script, log in with your
  `CONTROL_PASSWORD`, and start clicking around (score, fouls, clock, HT/FT).
- Open the **Overlay URL** in another tab (or as an OBS Browser Source, 1920x1080,
  transparent background) and watch it update live.

### Verifying resilience

- **Rehydration**: with the clock running, reload the overlay tab. It should come back
  showing the exact same score/fouls/time — this is what happens automatically if OBS's
  browser source crashes or the broadcast PC loses power.
- **Drift**: leave the clock running for a few minutes and compare it to a real
  stopwatch. It's anchored to the server's clock, not a local interval, so it shouldn't
  drift even under network hiccups.

## What's not in this phase

Match Intro, Lineups, the lower-third chips (Goal/Card/Timeout/Coach/Replay), the SVG
jersey generator, and the rest of the admin screens (Dashboard, Team Database, Overlay
Manager, Data Streams) are designed but not built yet — see the plan file for the full
roadmap.
