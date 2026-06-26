# Setup Guide

This guide gets MatchPulse Live running end-to-end: credentials, Docker, and your first match in OBS.

**Time to complete:** ~10 minutes

---

## Prerequisites

| Tool | Minimum | Check |
|------|---------|-------|
| Docker Desktop | 4.x | `docker --version` |
| Docker Compose | V2 | `docker compose version` |
| Git | any | `git --version` |

You also need two free cloud accounts (no credit card required):

- **[Pusher Channels](https://pusher.com/channels)** — the real-time WebSocket layer. Free tier: 100 concurrent connections, 200k messages/day.
- **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** — the database. Free M0 cluster is permanent.

---

## Step 1 — Pusher Channels

1. Create an account at [pusher.com/channels](https://pusher.com/channels)
2. Create a new **Channels** app — any name, any cluster (pick the one closest to you geographically)
3. Open **App Keys**

<!-- SCREENSHOT: Pusher dashboard → App Keys tab showing app_id, key, secret, cluster -->
> 📸 *Screenshot placeholder — paste your Pusher App Keys screen here*

Keep this tab open. You'll need `app_id`, `key`, `secret`, and `cluster` in Step 3.

---

## Step 2 — MongoDB Atlas

1. Create an account at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free **M0** cluster (any region)
3. Under **Database Access** → Add database user → Username + Password (not OAuth)
4. Under **Network Access** → Add IP Address → `0.0.0.0/0` (allow from anywhere)
5. Click **Connect → Drivers → Copy connection string**

<!-- SCREENSHOT: Atlas "Connect" modal showing the connection string -->
> 📸 *Screenshot placeholder — paste the Atlas connection string modal here*

The string looks like:
```
mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/
```

---

## Step 3 — Clone and configure

```bash
git clone https://github.com/estalvgs1999/match-pulse-live.git
cd match-pulse-live
```

**Option A — Interactive installer (recommended):**
```bash
bash install.sh
```
The script prompts for each credential, writes `.env`, builds the image, and starts the stack.

**Option B — Manual:**
```bash
cp .env.example .env
```
Then open `.env` and fill in:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/matchpulse
MONGODB_DB=matchpulse

PUSHER_APP_ID=        # from Pusher App Keys
PUSHER_KEY=           # from Pusher App Keys
PUSHER_SECRET=        # from Pusher App Keys
PUSHER_CLUSTER=       # e.g. us2, eu, ap3

NEXT_PUBLIC_PUSHER_KEY=       # same as PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER=   # same as PUSHER_CLUSTER

CONTROL_PASSWORD=     # any password you choose for the operator login
```

---

## Step 4 — Build and start

```bash
docker compose up -d --build
```

First build takes 2–3 minutes. Subsequent starts take a few seconds.

<!-- SCREENSHOT: terminal showing docker compose build completing -->
> 📸 *Screenshot placeholder — terminal after successful docker compose up*

> **Note:** `NEXT_PUBLIC_*` variables are compiled into the browser bundle. If you change Pusher credentials later, you need to rebuild: `docker compose up -d --build app`.

---

## Step 5 — First login

Open [http://localhost:4000/dashboard](http://localhost:4000/dashboard)

You'll be redirected to the login page. Enter the `CONTROL_PASSWORD` you set.

<!-- SCREENSHOT: MatchPulse login screen -->
> 📸 *Screenshot placeholder — login page*

<!-- SCREENSHOT: Dashboard after login, showing empty match list with "New Match" button -->
> 📸 *Screenshot placeholder — empty dashboard*

---

## Step 6 — Load demo data (optional)

To explore with pre-built teams and a sample match:

```bash
npm run seed:docker
```

This creates two teams and one match. The match ID is printed in the output.

<!-- SCREENSHOT: Dashboard after seed — match card visible -->
> 📸 *Screenshot placeholder — dashboard with demo match*

---

## Step 7 — Add to OBS

1. Click the **monitor icon** on any match card to open the OBS connection modal
2. Copy the overlay URL

<!-- SCREENSHOT: OBS modal with URL and copy button -->
> 📸 *Screenshot placeholder — OBS connection modal*

3. In OBS, add a **Browser Source**:
   - URL: paste the overlay URL
   - Width: `1920` / Height: `1080`
   - Custom CSS: leave empty
4. Place the browser source **above** your video capture layer

<!-- SCREENSHOT: OBS source list showing browser source above video capture -->
> 📸 *Screenshot placeholder — OBS source configuration*

---

## Remote access (ngrok)

To operate from a different network or broadcast from a venue:

```bash
ngrok http 4000 --request-header-add "ngrok-skip-browser-warning: any"
```

Use the ngrok `https://` URL in OBS. Share the `/control/[matchId]` URL with any additional operators.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Overlay doesn't update | Pusher credentials wrong | Check `PUSHER_KEY` / `PUSHER_CLUSTER` in `.env` and rebuild |
| Clock drifts on OBS reload | — | This shouldn't happen — open an issue if it does |
| `ECONNREFUSED` on start | MongoDB URI wrong | Verify Atlas IP allowlist and connection string |
| Port 4000 already in use | Another service | Set `APP_PORT=4001` in `.env` |

---

**Next:** [Operator Guide →](usage.md)
