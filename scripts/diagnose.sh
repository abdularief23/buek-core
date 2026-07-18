#!/usr/bin/env bash
# Quick diagnose 502 Bad Gateway on VPS
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== 502 Diagnostic ==="
echo ""

echo "1. Docker containers:"
docker compose ps 2>/dev/null || echo "   docker compose not running or not installed"
echo ""

echo "2. Port 8080 (web upstream for host Nginx):"
if curl -sf --max-time 3 http://127.0.0.1:8080/health; then
  echo "   OK — web container responding"
else
  echo "   FAIL — host Nginx gets 502 because nothing listens on 127.0.0.1:8080"
fi
echo ""

echo "3. Port 4000 (API direct):"
curl -sf --max-time 3 http://127.0.0.1:4000/health && echo "   OK" || echo "   FAIL"
echo ""

echo "4. Recent web logs:"
docker compose logs web --tail 15 2>/dev/null || true
echo ""

echo "5. Recent api logs:"
docker compose logs api --tail 15 2>/dev/null || true
echo ""

echo "=== Fix ==="
echo "Run: ./scripts/deploy.sh"
echo "Ensure .env has: WEB_PORT=127.0.0.1:8080"
