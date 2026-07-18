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

Point `core.buekwebsite.com` to the server that runs Docker Compose.

Recommended records:

```text
Type: A
Name: core
Value: <server-ip-address>
TTL: 300
```

If the hosting provider gives a CNAME target instead of an IP address:

```text
Type: CNAME
Name: core
Value: <provider-target-hostname>
TTL: 300
```

Do not point `core` at a static website/CDN target unless that target can also proxy `/api` to the
Buek Core API. The demo needs both the web app and API on the same domain.

## Environment

Create `.env` from the example:

```bash
cp .env.example .env
```

For production on `core.buekwebsite.com`, set:

```bash
NODE_ENV=production
WEB_PORT=80
CORS_ORIGIN=https://core.buekwebsite.com
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4.1-mini
BUEK_DOMAIN_MODULES=@buek/domain-manufacturing
```

`VITE_API_URL` can stay empty. Empty means the frontend calls `/api` on the same domain.

## Run with Docker Compose

```bash
docker compose up --build -d
```

Verify from the server:

```bash
curl http://localhost/health
curl http://localhost/api/modules
```

Verify from the public domain:

```bash
curl https://core.buekwebsite.com/health
curl https://core.buekwebsite.com/api/modules
```

The `/api/modules` response should include the Manufacturing module with no discovery errors.

## SSL

Terminate HTTPS with the hosting provider, a load balancer, Cloudflare, Caddy, or another reverse
proxy in front of Docker Compose. The current `web` container listens on HTTP port 80 internally.

## Current Demo Behavior

This foundation proves:

1. The web app loads from the Buek Core domain.
2. The API is reachable on the same domain.
3. The Manufacturing domain module is discovered and registered without modifying AI Core.

The next milestone is implementing `/api/ask` so AI answers can be grounded in Manufacturing
knowledge.
