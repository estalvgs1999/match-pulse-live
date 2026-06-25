# MatchPulse Live — Project Reference

## What this is

Live broadcast control system for football/futsal matches. Two distinct surfaces run simultaneously:

- **Control panel** (`/control/[matchId]`) — operator UI to manage clock, score, graphics, lineups. Runs in a browser (desktop + mobile). Must be fully responsive.
- **Overlay** (`/overlay/[matchId]`) — broadcast graphics captured by OBS as a browser source. Transparent background, pixel-perfect, never responsive (fixed broadcast dimensions). CSS Modules only, no Tailwind.

These two surfaces are completely separate in design intent. Do not mix their styling or layout patterns.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, `src/` directory) |
| Language | TypeScript (strict) |
| Styling (control) | Tailwind CSS v4 — `@import "tailwindcss"` + `@theme {}` in globals.css |
| Styling (overlay) | CSS Modules per component, no Tailwind |
| Validation | Zod v4 — all models and API payloads |
| Database | MongoDB 7 via `mongodb` driver (no Mongoose/ORM) |
| Real-time | Pusher Channels (cloud) or soketi (self-hosted, same protocol) |
| Animation | framer-motion (overlay transitions) |
| Runtime | Node 22, production via `next build` → standalone output |

---

## File Structure

```
src/
  app/
    layout.tsx                    # Root layout — loads fonts (Geist, Montserrat)
    globals.css                   # Tailwind v4 import + Obsidian design tokens + utility classes
    page.tsx                      # Landing page
    login/page.tsx                # Operator auth (single shared password)
    control/[matchId]/
      page.tsx                    # Server component — auth gate → renders LiveConsole
      LiveConsole.tsx             # Main control panel (client component, entire operator UI)
    overlay/[matchId]/page.tsx    # Broadcast graphics (client component, transparent bg)
    api/
      auth/login/route.ts         # POST — validates password, sets session cookie
      auth/logout/route.ts        # POST — clears cookie
      matches/route.ts            # GET list + POST create (accepts teamId or inline team)
      matches/[id]/route.ts       # GET — returns Match + team documents
      matches/[id]/state/route.ts # GET + PATCH — match state, clock math, Pusher trigger
      teams/route.ts              # GET list (no portraits) + POST create
      teams/[id]/route.ts         # GET full + PATCH + DELETE
      time/route.ts               # GET — server timestamp for clock drift correction
    dashboard/
      page.tsx                    # Auth gate → DashboardClient
      DashboardClient.tsx         # Match list + sidebar + OBS modal
      new/
        page.tsx                  # Auth gate → NewProjectClient
        NewProjectClient.tsx      # Create match — select existing team or create inline
      teams/
        page.tsx                  # Auth gate → TeamsClient
        TeamsClient.tsx           # Team list with search, delete, sidebar
        new/
          page.tsx                # Auth gate → NewTeamClient
          NewTeamClient.tsx       # Quick-create: name, shortName, color, logo
        [teamId]/
          page.tsx                # Auth gate → TeamEditorClient
          TeamEditorClient.tsx    # Full editor: identity + roster management
  components/
    control/                      # All control panel sub-components
      ClockModule.tsx             # Clock display + play/pause/sync + penalty shootout grid
      TeamPanel.tsx               # Per-team score, cards, fouls, goal scorer, lineup
      MatchFlowPanel.tsx          # Match phase steps + active graphic selector
      MatchSettingsModal.tsx      # Clock config, aggregate score, period settings
      PlayerPickerModal.tsx       # Roster picker (goal scorer / card events)
      LineupEditorModal.tsx       # Starting five + captain + current player
      StandingsEditorModal.tsx    # League table / bracket editor
      StatsEditorModal.tsx        # Possession, corners, shots editor
    overlay/                      # Broadcast graphics — CSS Modules, no Tailwind
      MainBug.tsx / .module.css   # Scoreboard bug (permanent lower-third)
      HTFTScreen.tsx              # Half time / full time full-screen graphic
      LineupsScreen.tsx           # Starting lineup display
      StandingsScreen.tsx         # League table or bracket
      StatsScreen.tsx             # Match stats graphic
      MatchEventChip.tsx          # Timeout / replay chip
      PlayerEventChip.tsx         # Goal / card player chip
    shared/
      defaultLogo.ts              # Base64 fallback team logo
      defaultPortrait.ts          # Base64 fallback player portrait
  hooks/
    useMatchInfo.ts               # Fetches Match + Team documents once (static data)
    useMatchState.ts              # Subscribes to Pusher; PATCH via /api/.../state
    useMatchClock.ts              # Drift-corrected tick using server timestamp anchor
    useServerOffset.ts            # Measures client/server clock delta via /api/time
    usePlayerEventChip.ts         # Handles ephemeral player event chips (goal/card)
  lib/
    auth.ts                       # Cookie session helpers (verifyPassword, isAuthenticated)
    mongodb.ts                    # Singleton MongoDB connection
    pusher-client.ts              # Browser Pusher client (singleton, supports soketi)
    pusher-server.ts              # Server Pusher client for triggering events
    pusher-shared.ts              # Channel name helpers + event constants
    clock-display.ts              # Derives primary/overtime display from elapsed seconds
    format.ts                     # formatMatchClock, visiblePenaltyWindow, countMade
  models/
    Match.ts                      # Zod schema: match metadata (tournament, teams, date)
    Team.ts                       # Zod schema: team + roster (name, colors, kit, players)
    MatchState.ts                 # Zod schema: full live state + patch schema + clock types
```

---

## Design System (Control Panel)

**Obsidian dark theme** — tokens live in `globals.css` under `@theme {}`. Source of truth is the Stitch project `14501289263200053124`. Always use semantic tokens, never raw hex values in Tailwind classes.

### Color palette

| Token | Value | Role |
|---|---|---|
| `background` | `#09090b` | Page background |
| `surface-container-low` | `#0f0f12` | Sidebar, footer |
| `surface-container` | `#121215` | Glass panels bg |
| `surface-container-highest` | `#1e1e22` | Input fields, counters |
| `on-surface-variant` | `#a1a1aa` | Secondary text, icons |
| `primary` | `#a78bfa` | Violet — borders, focus rings |
| `tertiary` | `#34d399` | Emerald — active state, live indicators |
| `error` | `#ef4444` | Red cards, destructive actions |
| `outline-variant` | `#27272a` | Borders, dividers |

### CSS utility classes (globals.css)

- `.glass-panel` — frosted dark card (control panel panels)
- `.obsidian-card` — flat dark card (login form)
- `.glow-effect` — subtle radial violet glow (login bg)
- `.digital-font` — tabular-nums, tight letter spacing (clock, scores)
- `.active-glow-tertiary` — emerald box-shadow for active buttons
- `.custom-scrollbar` — thin scrollbar for overflow containers
- `.material-symbols-outlined` — icon font (Google Material Symbols, loaded in layout.tsx)

### Typography

- Font: Geist (all control UI), Montserrat (overlay graphics only)
- Font tokens: `font-headline`, `font-body`, `font-label`, `font-display` → all map to Geist

---

## Responsive Design Rules

**All control panel work must be mobile-first and fully responsive.** The overlay is exempt (fixed broadcast dimensions).

### Breakpoints (Tailwind v4 defaults)

| Prefix | Min-width | Context |
|---|---|---|
| _(none)_ | 0px | Mobile (primary baseline) |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop (sidebar appears) |

### Layout pattern

```
Mobile  (< 768px):  single column, no sidebar, hamburger menu, bottom nav
Tablet  (768–1023): 2-column grid, no sidebar, hamburger menu, bottom nav
Desktop (≥ 1024px): 12-column grid, fixed sidebar (256px), footer bar
```

### Control panel grid

```
Desktop (lg:grid-cols-12):  [Home 3cols] [Center 6cols] [Away 3cols]
Tablet  (md:grid-cols-2):   [Center full-width md:col-span-2] then [Home] [Away]
Mobile  (grid-cols-1):      [Center] [Home] [Away] — stacked, Center first via order-first
```

The center section (`<section>`) wraps **both** ClockModule and MatchFlowPanel together. Use `order-first lg:order-none` on it. Never use explicit `col-start-*` or `row-start-*` — rely on CSS Grid auto-placement.

### Sidebar pattern

```tsx
// Desktop sidebar — fixed, always visible
<aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 ...">

// Mobile nav overlay — drawer, opened by hamburger button
{mobileNavOpen && (
  <div className="lg:hidden fixed inset-0 z-50 flex">...</div>
)}

// Main content — offset only on desktop
<main className="flex-1 lg:ml-64 lg:h-screen lg:overflow-hidden flex flex-col">
```

### Mobile nav

- Hamburger button: `lg:hidden` in the header
- Bottom tab bar: `lg:hidden sticky bottom-0` with NAV_ITEMS
- Mobile nav overlay drawer: controlled by `mobileNavOpen` state

---

## State Architecture

### Data flow

```
MongoDB (source of truth)
    ↕ REST PATCH
Next.js API route (/api/matches/[id]/state)
    → Pusher trigger (MATCH_STATE_EVENT)
    ↓
Browser: useMatchState subscribes via Pusher
    → renders control panel + overlay simultaneously
```

### Clock system

The clock is **server-anchored**, not client-decremented:
- `clock.periodStartServerTs` — absolute server ms when the period started
- `clock.baseSeconds` — elapsed seconds at last pause
- The overlay uses `periodStartServerTs + (Date.now() - offsetMs)` to compute live time, so Pusher latency cannot cause drift
- `useServerOffset` measures and corrects the client/server clock delta
- `clockAction` (start/pause/sync/restart) is sent to the API; the server stamps the timestamp — never the client

### PATCH pattern

```tsx
// All state changes go through patch()
await patch({ homeScore: state.homeScore + 1 });

// Clock actions always go through clockAction, never raw clock fields
await patch({ clockAction: "start" });
await patch({ clockAction: "sync", syncSeconds: 300 });
```

### Schema enforcement

All models use Zod. The API parses with `MatchStatePatchSchema.safeParse()` and rejects on failure. `MatchStateSchema.parse()` fills defaults on read — documents from older schema versions self-heal on next load.

---

## API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/login` | POST | — | Validates `CONTROL_PASSWORD`, sets session cookie |
| `/api/auth/logout` | POST | — | Clears session cookie |
| `/api/matches` | GET | — | List all matches with joined teams + state status |
| `/api/matches` | POST | ✓ | Create match; accepts `homeTeamId`/`awayTeamId` (existing) or inline team objects |
| `/api/matches/[id]` | GET | — | Returns `{ match, homeTeam, awayTeam }` |
| `/api/matches/[id]/state` | GET | — | Returns current MatchState (creates if missing) |
| `/api/matches/[id]/state` | PATCH | ✓ | Partial update → MongoDB → Pusher trigger |
| `/api/teams` | GET | — | List all teams (roster without portraitUrl) |
| `/api/teams` | POST | ✓ | Create team, returns `{ _id }` |
| `/api/teams/[id]` | GET | — | Full team with roster + portraits |
| `/api/teams/[id]` | PATCH | ✓ | Update team fields + roster |
| `/api/teams/[id]` | DELETE | ✓ | Delete — rejects if team assigned to any match (409) |
| `/api/time` | GET | — | Returns `{ serverTime: Date.now() }` for drift correction |

---

## Environment Variables

```bash
# .env.local (development)
MONGODB_URI=                    # Atlas connection string or mongodb://localhost:27017/matchpulse
MONGODB_DB=matchpulse

CONTROL_PASSWORD=               # Single operator password

# Pusher Cloud
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# OR soketi (self-hosted via docker-compose)
PUSHER_APP_ID=app-id
PUSHER_KEY=app-key
PUSHER_SECRET=app-secret
PUSHER_HOST=soketi              # Docker-internal hostname
PUSHER_PORT=6001
NEXT_PUBLIC_PUSHER_KEY=app-key
NEXT_PUBLIC_PUSHER_HOST=localhost   # Browser-facing hostname
NEXT_PUBLIC_PUSHER_PORT=6001
```

`NEXT_PUBLIC_*` vars are baked into the client bundle at **build time** — they must be set as Docker build args, not runtime env vars.

---

## Docker

```bash
# First run or after dependency/env changes
docker compose up -d --build

# Rebuild only the app after code changes
docker compose up -d --build app

# App runs on port 4000
open http://localhost:4000
```

Services:
- `mongo` — MongoDB 7, port 27017, volume `mongo_data`
- `app` — Next.js standalone, port 4000 (host) → 3000 (container)

**Pusher Cloud** is used for real-time (not soketi). Credentials live in `.env` and `.env.local` (both gitignored via `.env*`). `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` are baked into the production bundle at build time via Docker build args — changing them requires `docker compose up -d --build app`.

### Seed data

```bash
# Local dev (needs .env.local with MONGODB_URI)
npm run seed

# Against the Docker mongo container
npm run seed:docker
```

### Development mode (hot-reload)

```bash
npm run docker:dev          # levanta stack con hot-reload (next dev + bind mount)
npm run docker:dev:build    # igual pero reconstruye la imagen dev (solo necesario al cambiar package.json)
```

`docker-compose.dev.yml` es un override sobre `docker-compose.yml`. Usa `Dockerfile.dev` que solo instala deps y corre `next dev`. El código fuente se monta como bind mount (`./:/app`), `node_modules` y `.next` son volúmenes anónimos del container. `WATCHPACK_POLLING=true` garantiza que el file-watcher funcione sobre bind mounts de macOS/Docker Desktop.

`NEXT_PUBLIC_*` en modo dev se leen del entorno en tiempo de ejecución (no requieren build args). En producción sí son build args y requieren rebuild al cambiar.

---

## Coding Rules

### General

- TypeScript strict mode, no `any`
- Zod for all external data boundaries (API inputs, DB reads)
- No ORMs — raw `mongodb` driver, direct collection queries
- No global state libraries — React state + hooks + Pusher subscriptions
- No test files exist yet — do not add them without being asked

### Components

- `"use client"` only where needed (hooks, event handlers, Pusher)
- Server components for auth-gated pages (`/control/[matchId]/page.tsx`)
- Props interfaces defined with explicit `interface`, not inline types
- `className?: string` prop allowed on layout components for grid placement extension

### Tailwind (control panel)

- Use semantic color tokens (`text-on-surface-variant`, `bg-tertiary-container`) — never raw hex in class strings
- Responsive prefix order: base → `md:` → `lg:`
- Avoid explicit grid placement (`col-start-*`, `row-start-*`) for high column values — rely on auto-placement
- `order-first lg:order-none` pattern for reordering grid items across breakpoints
- Do not use `h-screen` on mobile (breaks scrollable content) — prefix with `lg:h-screen`

### Overlay components

- CSS Modules only, no Tailwind classes
- `position: fixed` layouts for broadcast positioning
- Transparent background — never set `background` on the root container
- Framer Motion for entry/exit animations (`AnimatePresence` + `motion.div`)
- Font: Montserrat (loaded in root layout)
- No responsive design — overlay is always in a fixed broadcast context (OBS browser source)

### Comments

Write comments only when the **why** is non-obvious. Do not describe what the code does. Do not reference issue numbers, PR titles, or current tasks. Good comment targets: hidden constraints, clock math invariants, schema migration behavior, Pusher latency tradeoffs.

---

## Key Invariants

1. **Clock timestamps are server-stamped.** `periodStartServerTs` is always set by the API route, never by the client. Do not let the client send a timestamp.

2. **Overlay stays transparent.** `/overlay/[matchId]` must never apply a background on the root element. OBS captures it as a browser source over video.

3. **`locked` match is immutable.** Once `locked: true`, PATCH rejects all changes except `{ locked: false }`. This is the "match ended" seam — don't bypass it.

4. **Penalty arrays grow past 5 in sudden death.** `homePenalties` and `awayPenalties` can exceed length 5. `visiblePenaltyWindow()` always shows the last 5 — do not assume fixed length.

5. **Pusher events are fire-and-forget.** `useMatchState` subscribes to `MATCH_STATE_EVENT` and replaces state wholesale. There is no optimistic update — the PATCH response is authoritative.

6. **`NEXT_PUBLIC_*` baked at build time.** Changing Pusher client config requires a Docker image rebuild (`docker compose up -d --build app`), not just a container restart.

7. **Pusher Cloud for OBS tunneling.** The project uses Pusher Cloud (not soketi) so only port 4000 needs to be exposed for remote OBS access — Pusher handles real-time via its own cloud infrastructure. When tunneling via ngrok, use `--request-header-add "ngrok-skip-browser-warning: any"` to prevent ngrok's interstitial from blocking the overlay's API fetches. HMR WebSocket errors through ngrok are cosmetic and irrelevant to broadcast.

---

## Dashboard & Project Management

Implemented in this session. Routing:

```
/                   → redirects to /dashboard (authed) or /login (unauthed)
/dashboard          → project list — auth gated server component → DashboardClient
/dashboard/new      → create new match — auth gated server component → NewProjectClient
/control/[matchId]  → existing live console (unchanged)
/overlay/[matchId]  → broadcast overlay (no auth)
```

### API

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/matches` | GET | — | List all matches with joined team data + state status |
| `/api/matches` | POST | ✓ | Create match + home team + away team in one call, returns `{ _id }` |

`POST /api/matches` body:
```json
{
  "tournament": "string",
  "matchday": "string",
  "stadium": "string",
  "date": "ISO string",
  "homeTeam": { "name": "string", "shortName": "string", "primaryColor": "#hex" },
  "awayTeam": { "name": "string", "shortName": "string", "primaryColor": "#hex" }
}
```

### Dashboard design rule

**The dashboard must match LiveConsole.tsx's design exactly** — same sidebar structure, same CSS classes, same header pattern. LiveConsole is the design base. Do not invent a different visual language for the dashboard.

Key CSS classes (from LiveConsole):
- Sidebar: `bg-surface-container-low border-r border-outline-variant p-4`
- Active nav item: `bg-tertiary-container text-tertiary-fixed-dim font-bold rounded-lg`
- Inactive nav item: `text-on-surface-variant hover:bg-surface-container-high rounded-lg group`
- Header: `sticky bg-background flex justify-between items-center px-4 md:px-6 py-2.5 border-b border-outline-variant z-40`

### Nav items behavior (both Dashboard and LiveConsole)

Nav items are functional buttons/links, not placeholder `<a href="#">`. Rules:

- **Dashboard** → `/dashboard`
- **Match Control** → most recent live match, else first match, else `/dashboard/new`
- **Overlay Manager** → opens OBS modal for the most recent/live match
- **Data Streams** → toast "Próximamente"
- **Team Database** → `/dashboard/teams`
- **System Health** → toast "Próximamente"

Never define nav items as `href="#"` — they must do something.

### OBS connection

The dashboard has an OBS modal per match card (monitor icon button). Shows the overlay URL (`/overlay/[matchId]`) with copy-to-clipboard. The Overlay Manager nav item opens this modal for the active match.

### Match status derivation

Match cards on the dashboard derive display status from `state.matchStatus` and `state.locked`:
- `locked` or `matchStatus === "ended"` → "Finalizado"
- `matchStatus` in `["in_progress", "half_time", "extra_time", "extra_time_2", "timeout"]` → "En Vivo"
- otherwise → "Programado"

### POST /api/matches — team slot options

Each team slot (home/away) accepts either an existing team reference or inline creation:
```json
{ "homeTeamId": "<existing ObjectId>" }
```
OR
```json
{ "homeTeam": { "name": "...", "shortName": "...", "primaryColor": "#hex" } }
```
Inline creation is backwards-compatible. Existing team references skip team document creation.

---

## Team Database

Routing:
```
/dashboard/teams            → team list — TeamsClient (full sidebar, "teams" active)
/dashboard/teams/new        → quick-create — NewTeamClient (name, code, color, logo)
/dashboard/teams/[teamId]   → full editor — TeamEditorClient
```

### Image storage

Logos and player portraits are stored as **base64 data URLs** in MongoDB. No external file storage required.
- Logo: max 1 MB, stored in `team.logoUrl`
- Player portrait: max 500 KB, stored in `roster[].portraitUrl`
- `GET /api/teams` excludes `portraitUrl` from roster (list performance). Full portraits only in `GET /api/teams/[id]`.

### Team editor sections

1. **Identity** — logo upload, name, shortName (4 chars max), coach, primary/secondary color
2. **Roster** — list sorted by jersey number; add/edit/remove players; each player has number, name, position (select from futsal positions), portrait upload
3. Save is explicit (single "Guardar" button that PATCHes all fields at once)

Futsal positions offered: Portero, Cierre, Ala, Pivote, Universal (free-text also allowed).

### Team deletion rule

`DELETE /api/teams/[id]` returns 409 if the team is referenced by any match (`homeTeamId` or `awayTeamId`). Teams assigned to matches cannot be deleted.
