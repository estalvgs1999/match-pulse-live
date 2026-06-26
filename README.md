# MatchPulse Live

> **Live broadcast control system for football & futsal.** A web-based operator console that drives real-time scoreboard graphics captured directly by OBS as a browser source — no plugins, no SDI routing, no capture cards.

---

## Overview

MatchPulse Live runs two independent surfaces simultaneously over a single web server:

| Surface | URL | Purpose |
|---------|-----|---------|
| **Control Panel** | `/control/[matchId]` | Operator manages clock, score, cards, graphics |
| **Broadcast Overlay** | `/overlay/[matchId]` | Transparent graphics for OBS Browser Source |

The operator triggers a graphic → the server PATCHes MongoDB → fires a Pusher event → the overlay reacts within ~100 ms, before the next broadcast frame. The clock is **server-anchored**: the overlay computes elapsed time from `periodStartServerTs` so WebSocket reconnects and OBS reloads never cause drift.

---

## Features

### Control Panel
- **Live clock** — start / pause / sync to any time / restart; overtime is calculated automatically
- **Score & cards** — goals, yellow cards, red cards, and fouls counter per team
- **Match phases** — Pre-match → 1st Half → Half Time → 2nd Half → Full Time → Extra Time → Penalties
- **Graphic selector** — scorebug, HT/FT card, lineups, standings, stats, pre-match overlay
- **Penalty shootout** — per-kick scored/missed tracking; the visible window follows sudden death beyond round 5
- **Goal scorer** — pick a player from the roster; name is appended to the scorer strip on the overlay
- **Lineup editor** — configure starting five, captain, and spotlight player per team
- **Standings editor** — build a live league table or bracket
- **Stats editor** — possession, corners, shots on/off target
- **Match settings** — period duration, clock direction, aggregate score for cup ties
- **Timeout & replay chips** — lower-third graphics for timeouts and replay moments
- **Fully responsive** — works on desktop, tablet, and mobile (control from pitch-side on a phone)

### Broadcast Overlay
- **Transparent background** — composites over live video in OBS with no extra tools
- **Three visual templates** — switch per match at creation time; add new ones with a single command
- **Drift-free clock** — server-anchored; survives OBS reloads and network hiccups
- **Animated graphics** — smooth enter/exit transitions on every overlay element
- **Intro scan** — lineup card spotlights each player automatically on reveal
- **Multi-operator** — all control consoles share the same live state via Pusher

### Dashboard & Team Database
- **Project list** — all matches with live / scheduled / ended status badges
- **New match wizard** — select existing teams or create inline; choose template with live preview
- **Team editor** — name, code, colors, logo upload; full roster with numbers, positions, and portraits
- **OBS connection modal** — one-click copy of the overlay URL per match

---

## Overlay Templates

| Template | Key | Visual style |
|----------|-----|-------------|
| **Rediseñado** | `redesigned` | Obsidian dark palette; team-color accent rings; adaptive tints |
| **Clásico** | `classic` | Broadcast green background; clean rectangular scorebug |
| **Champions** | `champions` | UCL-inspired; deep navy `#001233`; cyan `#00B4FF` accent; two-section split widget |

Add custom themes with `/new-overlay-theme` (see [Adding a Theme](#adding-a-theme)).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 — App Router, `src/` directory |
| Language | TypeScript 5 (strict) |
| Styling — control panel | Tailwind CSS v4 (`@import "tailwindcss"` + `@theme {}`) |
| Styling — overlay | CSS Modules per component, no Tailwind |
| Validation | Zod v4 — all models and API payloads |
| Database | MongoDB 7 via `mongodb` driver (no ORM) |
| Real-time | Pusher Channels (cloud) |
| Animation | framer-motion |
| Runtime | Node 22 — `next build` → standalone output |
| Container | Docker multi-stage + Docker Compose |

---

## Quick Start — Docker

### Prerequisites
- Docker + Docker Compose
- [Pusher Channels](https://pusher.com/channels) — free tier (100 concurrent connections is plenty)
- MongoDB 7 — Atlas free tier or local

### 1 — Clone and configure

```bash
git clone https://github.com/craving-ealvarado/match-pulse-live.git
cd match-pulse-live
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/matchpulse
MONGODB_DB=matchpulse

# Pusher Channels
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=us2

NEXT_PUBLIC_PUSHER_KEY=your_key          # same key, browser-exposed
NEXT_PUBLIC_PUSHER_CLUSTER=us2           # same cluster, browser-exposed

# Single shared password for /control
CONTROL_PASSWORD=changeme
```

### 2 — Build and run

```bash
docker compose up -d --build
```

> `NEXT_PUBLIC_*` variables are inlined into the client bundle at **build time**. Changing Pusher credentials requires a rebuild: `docker compose up -d --build app`.

### 3 — Open

| | URL |
|-|-----|
| Dashboard | http://localhost:4000/dashboard |
| Login | http://localhost:4000/login |

### 4 — Seed demo data (optional)

```bash
npm run seed:docker
```

---

## Development — Hot Reload

```bash
cp .env.example .env.local    # fill in your credentials

# Docker stack with live reload
npm run docker:dev

# Rebuild dev image after changing package.json
npm run docker:dev:build
```

Or run fully local (Node 22 + MongoDB + Pusher in `.env.local`):

```bash
npm install
npm run dev      # http://localhost:3000
npm run seed     # seed demo data against .env.local MongoDB
```

---

## OBS Integration

1. Open the dashboard → click the monitor icon on a match card
2. Copy the overlay URL
3. In OBS, add a **Browser Source**:
   - URL: paste the overlay URL
   - Width: `1920`, Height: `1080`
   - Custom CSS: leave empty (background is transparent)
4. Place the browser source above your video capture layer

### Remote access via ngrok

```bash
ngrok http 4000 --request-header-add "ngrok-skip-browser-warning: any"
```

Use the ngrok HTTPS URL in OBS. HMR WebSocket errors in the console are cosmetic and irrelevant to the overlay.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✓ | MongoDB connection string |
| `MONGODB_DB` | ✓ | Database name (default: `matchpulse`) |
| `PUSHER_APP_ID` | ✓ | Pusher Channels App ID |
| `PUSHER_KEY` | ✓ | Pusher key (server-side) |
| `PUSHER_SECRET` | ✓ | Pusher secret |
| `PUSHER_CLUSTER` | ✓ | Pusher region (e.g. `us2`) |
| `NEXT_PUBLIC_PUSHER_KEY` | ✓ | Same key, baked into client bundle |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ✓ | Same cluster, baked into client bundle |
| `CONTROL_PASSWORD` | ✓ | Operator login password |
| `PUSHER_HOST` | — | Self-hosted Pusher-protocol server (e.g. soketi) |
| `PUSHER_PORT` | — | Self-hosted server port |
| `NEXT_PUBLIC_PUSHER_HOST` | — | Browser-facing self-hosted host |
| `NEXT_PUBLIC_PUSHER_PORT` | — | Browser-facing self-hosted port |

---

## Project Structure

```
src/
  app/
    layout.tsx                    # Root layout — Geist + Montserrat fonts
    globals.css                   # Tailwind v4 + Obsidian design tokens
    page.tsx                      # Redirects authenticated users to dashboard
    login/page.tsx                # Operator login
    dashboard/                    # Match list, new match wizard, team management
    control/[matchId]/            # Live operator console
    overlay/[matchId]/            # Broadcast graphics (transparent background)
    api/                          # REST API routes
  components/
    control/                      # Clock, TeamPanel, MatchFlow, modals…
    overlay/
      *.tsx / *.module.css        # Redesigned template (default)
      classic/                    # Classic template
      champions/                  # Champions template
    shared/                       # Default logo and portrait (base64 fallback)
  hooks/
    useMatchState.ts              # Pusher subscription + PATCH helper
    useMatchClock.ts              # Drift-corrected tick
    useMatchInfo.ts               # Static match + team data
    useServerOffset.ts            # Client/server clock delta
    usePlayerEventChip.ts         # Goal/card chip with auto-dismiss
  lib/
    mongodb.ts                    # Singleton MongoDB connection
    pusher-server.ts / client.ts  # Pusher clients
    clock-display.ts              # Primary + overtime seconds derivation
    format.ts                     # Clock formatting, penalty window
  models/
    Match.ts                      # Zod: match metadata + OverlayTemplate enum
    Team.ts                       # Zod: team + roster
    MatchState.ts                 # Zod: full live state + patch schema
```

---

## Adding a Theme

Use the built-in slash command in your Claude Code session:

```
/new-overlay-theme "Theme Name" brief description of the style
```

Attach one or more reference images. The command will:
1. Extract color palette, typography, and shape language from the images
2. Generate all 16 component files in `src/components/overlay/{key}/`
3. Wire the new template into the Zod schema, API, overlay page, and creation wizard

All behavior (clock, scoring, animations, lineup scan, aggregate score) is inherited from the Champions template — only the CSS changes.

---

## Architecture Notes

**Clock** — `periodStartServerTs` is always stamped by the API route, never the client. The overlay derives elapsed time at render: `now − periodStartServerTs + baseSeconds`. This eliminates drift from WebSocket reconnects, OBS reloads, or multi-operator edits.

**State flow** — `PATCH /api/matches/[id]/state` → MongoDB upsert → Pusher event → all subscribers replace state wholesale. No optimistic updates; the PATCH response is authoritative.

**Overlay transparency** — the overlay page root has no `background`. OBS captures it over video. Any background on the root breaks compositing.

**Schema self-healing** — `MatchStateSchema.parse()` fills defaults on every read. Documents from older schema versions self-heal on load without a migration script.

**`NEXT_PUBLIC_*` are build-time constants** — changing Pusher client config requires a Docker image rebuild, not just a container restart.

---

## License

MIT
