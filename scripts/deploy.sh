#!/usr/bin/env bash
set -euo pipefail

# VPS mode: host Nginx (ports 80/443) proxies to Docker web on 127.0.0.1:8080
# Do NOT use docker-compose.prod.yml (Caddy) on this server — it conflicts with host Nginx.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Pulling latest ${DEPLOY_BRANCH}..."
git fetch origin "${DEPLOY_BRANCH}"
git checkout "${DEPLOY_BRANCH}"
git pull origin "${DEPLOY_BRANCH}"

export GIT_COMMIT="$(git rev-parse --short HEAD)"
echo "==> Deploying build ${GIT_COMMIT}"

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
sleep 8

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
echo "==> API feature check:"
curl -sf http://127.0.0.1:8080/health | head -c 500 || true
echo ""

echo ""
echo "==> Done. Verify: https://core.buekwebsite.com"
echo "    IMPORTANT: Hard-refresh browser (Ctrl+Shift+R) to clear cached index.html"
echo ""
echo "    Login page MUST show:"
echo "      - Appearance panel (Light / Dark / Auto)"
echo "      - Language panel (Indonesia / English / 日本語)"
echo "      - Build footer with commit ${GIT_COMMIT}"
echo "      - API Status: Connected + Engineering Analysis API: Ready"
echo ""
echo "    After login as Engineer:"
echo "      - Home shows PPM metrics (not '89% complete')"
echo "      - Investigation opens 5-step wizard (not Fishbone buttons)"
echo ""
echo "    To deploy a feature branch instead of main:"
echo "      DEPLOY_BRANCH=cursor/product-design-engineering-copilot-e866 ./scripts/deploy.sh"
