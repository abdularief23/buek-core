#!/usr/bin/env bash
set -euo pipefail

echo "==> Pulling latest main..."
git fetch origin main
git checkout main
git pull origin main

echo "==> Rebuilding and restarting containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "==> Done. Verify at https://core.buekwebsite.com"
echo "    Login should show: Enterprise AI Operating System"
echo "    After login: Good morning + prompt at top + Today's Summary"
