#!/usr/bin/env bash
set -euo pipefail

# VPS mode: host Nginx (ports 80/443) proxies to Docker web on 127.0.0.1:8080
# Do NOT use docker-compose.prod.yml (Caddy) on this server — it conflicts with host Nginx.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Pulling latest main..."
git fetch origin main
git checkout main
git pull origin main

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Copy from .env.example and set WEB_PORT=127.0.0.1:8080"
  exit 1
fi

if ! grep -q 'WEB_PORT=127.0.0.1:8080' .env 2>/dev/null; then
  echo "WARNING: .env should contain WEB_PORT=127.0.0.1:8080 for host Nginx mode"
fi

echo "==> Stopping old containers..."
DOCKER="docker"
if ! docker info >/dev/null 2>&1; then
  DOCKER="sudo docker"
fi
$DOCKER compose down --remove-orphans 2>/dev/null || true

echo "==> Rebuilding (host Nginx mode — web on 127.0.0.1:8080)..."
$DOCKER compose up -d --build

echo "==> Waiting for services..."
sleep 5

echo "==> Container status:"
$DOCKER compose ps

echo "==> Health check:"
if curl -sf http://127.0.0.1:8080/health; then
  echo ""
  echo "OK: web container is healthy on port 8080"
else
  echo ""
  echo "FAILED: cannot reach http://127.0.0.1:8080/health"
  echo "Check logs: $DOCKER compose logs web --tail 50"
  echo "            $DOCKER compose logs api --tail 50"
  exit 1
fi

echo ""
echo "==> Done. Verify: https://core.buekwebsite.com"
echo "    Login: Enterprise AI Operating System"
echo "    After login: Good morning + prompt + Today's Summary"
