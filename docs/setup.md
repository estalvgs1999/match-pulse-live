# Setup Guide

MatchPulse Live runs as a Docker stack. This guide covers **local setup** — app + MongoDB running together on your machine.

For self-hosted production deployment (Atlas + VPS), see [deployment.md](deployment.md).

**Time to complete:** ~10 minutes

---

## What you need

| Requirement | Notes |
|-------------|-------|
| [Docker Desktop](https://docs.docker.com/get-docker/) | Version 4.x or later |
| [Pusher Channels account](https://pusher.com/channels) | Free tier — 100 connections, 200k messages/day |

> MongoDB runs locally inside Docker. **No Atlas account required for local setup.**

---

## 1. Get your Pusher credentials

1. Sign up at [pusher.com/channels](https://pusher.com/channels)
2. Create a new **Channels** app — any name, pick the cluster closest to you
3. Open the **App Keys** tab

<!-- SCREENSHOT: Pusher App Keys tab -->
> 📸 *Screenshot — Pusher App Keys (app_id, key, secret, cluster)*

Keep this tab open. You'll paste these values in the next step.

---

## 2. Clone and configure

```bash
git clone https://github.com/estalvgs1999/match-pulse-live.git
cd match-pulse-live
```

**Option A — Installer (recommended):**
```bash
bash install.sh
```
Walks you through each credential, writes `.env`, builds the image, and starts the stack.

**Option B — Manual:**
```bash
cp .env.example .env
```
Open `.env` and fill in:

```env
PUSHER_APP_ID=        ← from Pusher App Keys
PUSHER_KEY=           ←
PUSHER_SECRET=        ←
PUSHER_CLUSTER=       ← e.g. us2, eu, ap1

NEXT_PUBLIC_PUSHER_KEY=       ← same as PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER=   ← same as PUSHER_CLUSTER

CONTROL_PASSWORD=     ← choose a password for the operator login
```

> `MONGODB_URI` can stay blank for local — Docker Compose provides the connection to the local MongoDB container.

---

## 3. Start

```bash
docker compose up -d --build
```

First build: ~3 minutes. Subsequent starts: a few seconds.

<!-- SCREENSHOT: Terminal after successful docker compose up -->
> 📸 *Screenshot — terminal showing stack started*

---

## 4. Open the dashboard

Go to **[http://localhost:4000/dashboard](http://localhost:4000/dashboard)**

You'll be redirected to login. Enter the `CONTROL_PASSWORD` you set.

<!-- SCREENSHOT: Login screen -->
> 📸 *Screenshot — login page*

<!-- SCREENSHOT: Empty dashboard -->
> 📸 *Screenshot — dashboard*

---

## 5. Load demo data (optional)

Creates two teams and a sample match to explore the interface:

```bash
npm run seed:docker
```

<!-- SCREENSHOT: Dashboard with demo match card -->
> 📸 *Screenshot — dashboard with demo match*

---

## 6. Connect to OBS

1. Click the **monitor icon** on a match card to open the OBS modal
2. Copy the overlay URL

<!-- SCREENSHOT: OBS connection modal -->
> 📸 *Screenshot — OBS modal with URL*

3. In OBS → **Add Source → Browser Source**:
   - URL: paste the overlay URL
   - Width: `1920` / Height: `1080`
   - Custom CSS: leave empty
4. Place it **above** your video capture layer

<!-- SCREENSHOT: OBS source list -->
> 📸 *Screenshot — OBS browser source configured*

---

## Development mode (hot reload)

To run with live file reloading instead of a production build:

```bash
npm run docker:dev
```

Changes to source files are picked up immediately inside the container. Useful during theme development or feature work.

To rebuild after changing `package.json`:
```bash
npm run docker:dev:build
```

---

## Remote access

To control OBS from a different network or venue:

```bash
ngrok http 4000 --request-header-add "ngrok-skip-browser-warning: any"
```

Use the ngrok `https://` URL in OBS. Share the `/control/[matchId]` URL with co-operators.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Overlay doesn't update in real time | Pusher credentials incorrect | Check keys in `.env`, rebuild with `docker compose up -d --build app` |
| `Connection refused` on start | Port conflict | Change `APP_PORT=4001` in `.env` |
| Stack starts but login fails | Wrong password | Check `CONTROL_PASSWORD` in `.env` |
| OBS overlay blank | Wrong URL or stack not running | Verify `docker compose ps` shows app running |

---

**Next:** [Operator Guide →](usage.md) · [Production Deployment →](deployment.md)
