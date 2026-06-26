#!/usr/bin/env bash
# MatchPulse Live — local setup installer
# Usage: bash install.sh
set -e

BOLD="\033[1m"; CYAN="\033[36m"; GREEN="\033[32m"
YELLOW="\033[33m"; RED="\033[31m"; DIM="\033[2m"; RESET="\033[0m"

info()    { echo -e "${CYAN}→${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET}  $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }
ask()     { echo -e "${BOLD}$*${RESET}"; }

echo ""
echo -e "${BOLD}${CYAN}MatchPulse Live${RESET} — Local Setup"
echo -e "${DIM}This script sets up the local stack (app + MongoDB in Docker).${RESET}"
echo -e "${DIM}For production deployment, see docs/deployment.md${RESET}"
echo ""

# ── Prerequisite checks ──────────────────────────────────────────────────────
info "Checking prerequisites..."

command -v docker &>/dev/null || error "Docker not found. Install Docker Desktop: https://docs.docker.com/get-docker/"
success "Docker: $(docker --version | awk '{print $3}' | tr -d ',')"

docker compose version &>/dev/null || error "Docker Compose V2 not found. Update Docker Desktop."
success "Docker Compose V2"

# ── .env setup ───────────────────────────────────────────────────────────────
if [ -f ".env" ]; then
  warn ".env already exists."
  read -r -p "  Overwrite it? [y/N] " ow
  [[ "$ow" =~ ^[Yy]$ ]] || { info "Keeping existing .env. Skipping to build."; SKIP_ENV=true; }
fi

if [ -z "$SKIP_ENV" ]; then
  echo ""
  echo -e "${BOLD}You need a free Pusher Channels account to get started.${RESET}"
  echo -e "${DIM}Sign up at https://pusher.com/channels — takes 2 minutes.${RESET}"
  echo -e "${DIM}MongoDB runs locally in Docker — no Atlas account needed for local dev.${RESET}"
  echo ""

  ask "Pusher App ID:"
  read -r -p "  > " PUSHER_APP_ID
  ask "Pusher Key:"
  read -r -p "  > " PUSHER_KEY
  ask "Pusher Secret:"
  read -r -p "  > " PUSHER_SECRET
  ask "Pusher Cluster (e.g. us2, eu, ap1):"
  read -r -p "  > " PUSHER_CLUSTER
  PUSHER_CLUSTER="${PUSHER_CLUSTER:-us2}"

  echo ""
  ask "Operator password for /login:"
  read -r -s -p "  > " CONTROL_PASSWORD; echo ""
  [[ -n "$CONTROL_PASSWORD" ]] || error "A password is required."

  echo ""
  ask "HTTP port [4000]:"
  read -r -p "  > " APP_PORT
  APP_PORT="${APP_PORT:-4000}"

  cat > .env <<EOF
# Pusher Channels
PUSHER_APP_ID=${PUSHER_APP_ID}
PUSHER_KEY=${PUSHER_KEY}
PUSHER_SECRET=${PUSHER_SECRET}
PUSHER_CLUSTER=${PUSHER_CLUSTER}
NEXT_PUBLIC_PUSHER_KEY=${PUSHER_KEY}
NEXT_PUBLIC_PUSHER_CLUSTER=${PUSHER_CLUSTER}

# MongoDB — managed by Docker locally (no URI needed here)
MONGODB_URI=
MONGODB_DB=matchpulse

# App
CONTROL_PASSWORD=${CONTROL_PASSWORD}
APP_PORT=${APP_PORT}
EOF
  success ".env written"
fi

APP_PORT=$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d= -f2); APP_PORT="${APP_PORT:-4000}"

# ── Build & launch ───────────────────────────────────────────────────────────
echo ""
info "Building and starting (first build ~3 min)..."
docker compose up -d --build

echo ""
success "Stack is running!"
echo ""
echo -e "  ${BOLD}Dashboard:${RESET}  http://localhost:${APP_PORT}/dashboard"
echo -e "  ${BOLD}Login:${RESET}      http://localhost:${APP_PORT}/login"
echo ""

# ── Optional seed ────────────────────────────────────────────────────────────
read -r -p "Load demo data (2 teams + 1 sample match)? [y/N] " seed
if [[ "$seed" =~ ^[Yy]$ ]]; then
  if command -v npm &>/dev/null; then
    npm run seed:docker
  else
    warn "npm not found — run 'npm run seed:docker' after installing Node 22."
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}Done!${RESET} Open the dashboard and create your first match."
echo -e "${DIM}Operator guide: https://github.com/estalvgs1999/match-pulse-live/blob/main/docs/usage.md${RESET}"
echo ""
