#!/usr/bin/env bash
# Paste & run this in SumoPod Web Console (no SSH from PC needed)
set -euo pipefail

echo "=== Buek Core 502 Recovery ==="

# Install GitHub Actions deploy key (idempotent)
DEPLOY_KEY_FILE="$(dirname "$0")/../deploy/authorized_key.pub"
if [ -f "$DEPLOY_KEY_FILE" ]; then
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  touch ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  DEPLOY_KEY="$(cat "$DEPLOY_KEY_FILE")"
  if ! grep -qF "$DEPLOY_KEY" ~/.ssh/authorized_keys 2>/dev/null; then
    echo "$DEPLOY_KEY" >> ~/.ssh/authorized_keys
    echo "==> Added GitHub Actions deploy key"
  fi
fi

# Find project directory
if [ -d "$HOME/buek-core" ]; then
  cd "$HOME/buek-core"
elif [ -d "/root/buek-core" ]; then
  cd "/root/buek-core"
elif [ -d "/var/www/buek-core" ]; then
  cd "/var/www/buek-core"
else
  echo "Cloning repo..."
  cd "$HOME"
  git clone https://github.com/abdularief23/buek-core.git
  cd buek-core
fi

echo "==> Project: $(pwd)"

# Ensure .env exists
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Force host-nginx mode (fixes 502)
grep -q '^WEB_PORT=' .env && sed -i 's|^WEB_PORT=.*|WEB_PORT=127.0.0.1:8080|' .env || echo 'WEB_PORT=127.0.0.1:8080' >> .env
grep -q '^API_HOST_PORT=' .env && sed -i 's|^API_HOST_PORT=.*|API_HOST_PORT=127.0.0.1:4000|' .env || echo 'API_HOST_PORT=127.0.0.1:4000' >> .env
grep -q '^CORS_ORIGIN=' .env && sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://core.buekwebsite.com|' .env || echo 'CORS_ORIGIN=https://core.buekwebsite.com' >> .env

echo "==> Pulling latest code..."
git fetch origin main
git checkout main
git pull origin main

echo "==> Stopping old containers..."
DOCKER="docker"
if ! docker info >/dev/null 2>&1; then
  DOCKER="sudo docker"
fi
$DOCKER compose down --remove-orphans 2>/dev/null || true

echo "==> Building and starting (host Nginx mode)..."
$DOCKER compose up -d --build

echo "==> Waiting..."
sleep 8

echo "==> Status:"
$DOCKER compose ps

echo "==> Health check:"
if curl -sf http://127.0.0.1:8080/health; then
  echo ""
  echo "SUCCESS! Site should work at https://core.buekwebsite.com"
  echo "Hard refresh browser: Ctrl+Shift+R"
else
  echo ""
  echo "FAILED. Check logs:"
  echo "  $DOCKER compose logs web --tail 30"
  echo "  $DOCKER compose logs api --tail 30"
  exit 1
fi
