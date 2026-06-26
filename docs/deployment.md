# Production Deployment

This guide covers deploying MatchPulse Live to a server so it's accessible from the internet — for controlling OBS remotely, running from a broadcast venue, or hosting a shared instance.

**Stack:** app container + [MongoDB Atlas](https://www.mongodb.com/atlas) (external) + [Pusher Channels](https://pusher.com/channels) (external).

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| A VPS or cloud server | 1 vCPU, 512 MB RAM minimum. Any provider works (Hetzner, DigitalOcean, Railway, Fly.io…) |
| Docker + Docker Compose V2 | On the server |
| [MongoDB Atlas](https://www.mongodb.com/atlas) account | Free M0 cluster |
| [Pusher Channels](https://pusher.com/channels) account | Free tier |
| (Optional) A domain name | For HTTPS via nginx + Certbot |

---

## 1. MongoDB Atlas setup

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free **M0 cluster** — any region close to your server
3. **Database Access** → Add user → Username + Password authentication
4. **Network Access** → Add IP → allow your server's IP (or `0.0.0.0/0` to allow all)
5. **Connect → Drivers** → copy the connection string

The connection string looks like:
```
mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

<!-- SCREENSHOT: Atlas connection string modal -->
> 📸 *Screenshot — Atlas Connect dialog*

---

## 2. Pusher Channels setup

If you haven't already, create a Channels app at [dashboard.pusher.com](https://dashboard.pusher.com).  
Go to **App Keys** and note: `app_id`, `key`, `secret`, `cluster`.

---

## 3. Configure the server

Clone the repo on your server:

```bash
git clone https://github.com/estalvgs1999/match-pulse-live.git
cd match-pulse-live
cp .env.example .env
```

Edit `.env` — fill in **all fields**, including `MONGODB_URI`:

```env
# Pusher Channels
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=us2

NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# MongoDB Atlas — required for production
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/matchpulse

MONGODB_DB=matchpulse
CONTROL_PASSWORD=a-strong-password
APP_PORT=4000
```

---

## 4. Build and start (production mode)

```bash
npm run docker:prod
# equivalent to:
# docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

This uses `docker-compose.prod.yml`, which:
- Runs only the **app** container (no local MongoDB)
- Reads `MONGODB_URI` from the environment (→ Atlas)
- Sets `restart: always`

Verify the stack is running:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

---

## 5. Open ports

Ensure port `4000` (or your `APP_PORT`) is accessible from the internet via your server's firewall.

For cloud providers:
- **Hetzner / DigitalOcean**: add inbound TCP rule on port 4000 in the firewall settings
- **AWS EC2**: add inbound rule in the security group
- **Railway / Fly.io**: expose the port in the platform config

---

## 6. (Optional) HTTPS with nginx + Certbot

For a secure HTTPS URL, set up nginx as a reverse proxy:

**`/etc/nginx/sites-available/matchpulse`**
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass         http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/matchpulse /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

The overlay URL for OBS becomes `https://your-domain.com/overlay/<matchId>`.

---

## Updating

To deploy a new version:

```bash
git pull
npm run docker:prod
```

> **Important:** If you change `PUSHER_KEY` or `PUSHER_CLUSTER`, the client bundle must be rebuilt — the command above handles that automatically.

---

## Seeding demo data on production

```bash
# Run against the Atlas database (MONGODB_URI must be set in .env)
MONGODB_URI=$(grep MONGODB_URI .env | cut -d= -f2-) \
MONGODB_DB=matchpulse \
node scripts/seed.mjs
```

---

## Health check

| Check | Command |
|-------|---------|
| Stack status | `docker compose -f docker-compose.yml -f docker-compose.prod.yml ps` |
| App logs | `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app` |
| Dashboard reachable | `curl -I http://localhost:4000/dashboard` |

---

**← Back to [Setup Guide](setup.md)** · **[Operator Guide →](usage.md)**
