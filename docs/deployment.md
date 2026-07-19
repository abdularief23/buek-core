# Deployment Guide

This guide describes the first demo deployment target for Buek Core:

```text
https://core.buekwebsite.com
```

## Target Shape

Buek Core is configured for a single public domain:

- `https://core.buekwebsite.com/` serves the React web app.
- `https://core.buekwebsite.com/api/*` proxies to the Express API.
- `https://core.buekwebsite.com/health` proxies to the API health check.

The browser does not call `localhost`. In production, the web app uses same-origin API paths by
default.

## DNS

Point `core.buekwebsite.com` to the VPS that runs Docker Compose.

For the current VPS:

```text
Type: A
Name: core
Value: 43.157.226.203
TTL: 300
```

Remove any existing `core` ALIAS or CNAME record that points to a static website/CDN target. The
demo needs both the web app and API on the same VPS.

## Environment

Create `.env` from the example:

```bash
cp .env.example .env
```

For production on `core.buekwebsite.com`, set:

```bash
NODE_ENV=production
APP_DOMAIN=core.buekwebsite.com
ACME_EMAIL=<email-for-lets-encrypt>
WEB_PORT=127.0.0.1:8080
API_HOST_PORT=127.0.0.1:4000
POSTGRES_HOST_PORT=127.0.0.1:5432
CORS_ORIGIN=https://core.buekwebsite.com
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4.1-mini
BUEK_DOMAIN_MODULES=@buek/domain-manufacturing
```

`VITE_API_URL` can stay empty. Empty means the frontend calls `/api` on the same domain.

## Run with Docker Compose

### Current VPS mode: existing host Nginx

The current VPS already runs Nginx on ports 80 and 443 for `buekwebsite.com`. In this mode, run
Buek Core on localhost ports and let host Nginx proxy `core.buekwebsite.com` to the web container:

```bash
docker compose up --build -d
```

Expected container bindings:

```text
web      127.0.0.1:8080->80
api      127.0.0.1:4000->4000
postgres 127.0.0.1:5432->5432
```

Host Nginx server block:

```nginx
server {
    listen 80;
    server_name core.buekwebsite.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After DNS points to the VPS, enable HTTPS with Certbot:

```bash
sudo certbot --nginx -d core.buekwebsite.com
```

### Full Docker mode: Caddy

If no host service is using ports 80 and 443, Caddy can manage HTTPS inside Docker:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Verify from the server:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/modules
```

Verify from the public domain:

```bash
curl https://core.buekwebsite.com/health
curl https://core.buekwebsite.com/api/modules
```

The `/api/modules` response should include the Manufacturing module with no discovery errors.

## Redeploy After Code Changes

Production will **not** update automatically when GitHub is merged. On the VPS, run:

```bash
cd /path/to/buek-core
./scripts/deploy.sh
```

**Important:** This VPS uses **host Nginx** (not Docker Caddy). Do **not** run
`docker-compose.prod.yml` — it conflicts with host Nginx and causes **502 Bad Gateway**.

Required `.env` for this server:

```bash
WEB_PORT=127.0.0.1:8080
API_HOST_PORT=127.0.0.1:4000
```

### If you see 502 Bad Gateway

```bash
./scripts/diagnose.sh
./scripts/deploy.sh
```

502 means host Nginx cannot reach `http://127.0.0.1:8080` — the Docker `web` container is down
or bound to the wrong port.

Or manually:

```bash
git pull origin main
docker compose down
docker compose up -d --build
curl http://127.0.0.1:8080/health
```

Verify the new UI loaded:

- Login page shows **Appearance** (Light/Dark/Auto) and **Language** panels
- Login footer shows **Build** commit hash and **API Status: Connected**
- Login footer shows **Engineering Analysis API: Ready**
- After login as Engineer: PPM metrics card (not `89% complete`)
- Investigation opens **5-step wizard** (not `Generate 5 Why` / `Fishbone` buttons)

If you still see `Enterprise AI Operating System`, `Demo Workspace`, or `Fishbone` buttons,
the VPS is serving an **old frontend bundle**. Run `./scripts/deploy.sh` after merging PR #21.

To deploy the feature branch before merge:

```bash
DEPLOY_BRANCH=cursor/product-design-engineering-copilot-e866 ./scripts/deploy.sh
```

Check bundle hash in page source — it should change after each deploy.

## SSL

`docker-compose.prod.yml` runs Caddy on ports 80 and 443. Caddy automatically requests and renews
Let's Encrypt certificates for `core.buekwebsite.com`.

Before starting Caddy, make sure:

- DNS `core.buekwebsite.com` points to `43.157.226.203`.
- VPS firewall allows inbound TCP `80` and `443`.
- No other service is already using ports `80` or `443`.

## Current Demo Behavior

This foundation proves:

1. The web app loads from the Buek Core domain.
2. The API is reachable on the same domain.
3. The Manufacturing domain module is discovered and registered without modifying AI Core.

The next milestone is implementing `/api/ask` so AI answers can be grounded in Manufacturing
knowledge.
