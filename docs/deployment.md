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
