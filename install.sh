#!/usr/bin/env bash
# MatchPulse Live — interactive installer
# Usage: bash install.sh

set -e

# ── Colors ──────────────────────────────────────────────────────────────────
BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
DIM="\033[2m"
RESET="\033[0m"

info()    { echo -e "${CYAN}→${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET}  $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; }
prompt()  { echo -e "${BOLD}$*${RESET}"; }

echo ""
echo -e "${BOLD}${CYAN}MatchPulse Live — Setup${RESET}"
echo -e "${DIM}Live broadcast control for football & futsal${RESET}"
echo ""

# ── Prerequisite checks ──────────────────────────────────────────────────────
info "Checking prerequisites..."

if ! command -v docker &>/dev/null; then
  error "Docker is not installed. Install Docker Desktop: https://docs.docker.com/get-docker/"
  exit 1
fi
success "Docker found: $(docker --version | cut -d' ' -f3 | tr -d ',')"

if ! docker compose version &>/dev/null; then
  error "Docker Compose V2 not found. Update Docker Desktop to a recent version."
  exit 1
fi
success "Docker Compose V2 found"

if [ -f ".env" ]; then
  warn ".env already exists."
  read -r -p "  Overwrite it? [y/N] " overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    info "Keeping existing .env. Skipping credential setup."
    SKIP_ENV=true
  fi
fi

# ── Credential collection ────────────────────────────────────────────────────
if [ -z "$SKIP_ENV" ]; then
  echo ""
  echo -e "${BOLD}You'll need:${RESET}"
  echo -e "  ${DIM}• Pusher Channels account → https://pusher.com/channels (free)${RESET}"
  echo -e "  ${DIM}• MongoDB Atlas connection string → https://www.mongodb.com/atlas (free)${RESET}"
  echo ""

  # MongoDB
  prompt "MongoDB connection string (mongodb+srv://...):"
  read -r -p "  > " MONGODB_URI
  while [[ -z "$MONGODB_URI" ]]; do
    warn "Required. Enter your Atlas connection string."
    read -r -p "  > " MONGODB_URI
  done

  prompt "MongoDB database name [matchpulse]:"
  read -r -p "  > " MONGODB_DB
  MONGODB_DB="${MONGODB_DB:-matchpulse}"

  echo ""

  # Pusher
  prompt "Pusher App ID:"
  read -r -p "  > " PUSHER_APP_ID

  prompt "Pusher Key:"
  read -r -p "  > " PUSHER_KEY

  prompt "Pusher Secret:"
  read -r -p "  > " PUSHER_SECRET

  prompt "Pusher Cluster (e.g. us2, eu, ap3):"
  read -r -p "  > " PUSHER_CLUSTER
  PUSHER_CLUSTER="${PUSHER_CLUSTER:-us2}"

  echo ""

  # Operator password
  prompt "Operator password (for /login):"
  read -r -s -p "  > " CONTROL_PASSWORD
  echo ""
  while [[ -z "$CONTROL_PASSWORD" ]]; do
    warn "Required. Enter a password for the operator console."
    read -r -s -p "  > " CONTROL_PASSWORD
    echo ""
  done

  # Port
  echo ""
  prompt "HTTP port [4000]:"
  read -r -p "  > " APP_PORT
  APP_PORT="${APP_PORT:-4000}"

  # Write .env
  cat > .env <<EOF
# MongoDB
MONGODB_URI=${MONGODB_URI}
MONGODB_DB=${MONGODB_DB}

# Pusher Channels
PUSHER_APP_ID=${PUSHER_APP_ID}
PUSHER_KEY=${PUSHER_KEY}
PUSHER_SECRET=${PUSHER_SECRET}
PUSHER_CLUSTER=${PUSHER_CLUSTER}

# Pusher — browser bundle (same values, required NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_PUSHER_KEY=${PUSHER_KEY}
NEXT_PUBLIC_PUSHER_CLUSTER=${PUSHER_CLUSTER}

# Operator login
CONTROL_PASSWORD=${CONTROL_PASSWORD}

# Port
APP_PORT=${APP_PORT}
EOF

  success ".env written"
fi

# Read APP_PORT from .env for the final message
APP_PORT=$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d= -f2)
APP_PORT="${APP_PORT:-4000}"

# ── Build & start ────────────────────────────────────────────────────────────
echo ""
info "Building Docker image (first build takes ~3 minutes)..."
docker compose up -d --build

echo ""
success "Stack is running!"
echo ""
echo -e "  ${BOLD}Dashboard:${RESET}  http://localhost:${APP_PORT}/dashboard"
echo -e "  ${BOLD}Login:${RESET}      http://localhost:${APP_PORT}/login"
echo ""

# ── Optional seed ────────────────────────────────────────────────────────────
read -r -p "Load demo data (2 teams + 1 sample match)? [y/N] " seed_data
if [[ "$seed_data" =~ ^[Yy]$ ]]; then
  info "Seeding demo data..."
  if command -v npm &>/dev/null; then
    npm run seed:docker
  else
    warn "npm not found locally — run 'npm run seed:docker' after installing Node 22."
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}Done!${RESET} Open the dashboard and create your first match."
echo -e "${DIM}Docs: https://github.com/estalvgs1999/match-pulse-live/blob/main/docs/setup.md${RESET}"
echo ""
