#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${1:-https://core.buekwebsite.com}"

echo "=== Verifying deployment at ${SITE_URL} ==="
echo ""

echo "1. Health endpoint:"
HEALTH="$(curl -sf "${SITE_URL}/health" 2>/dev/null || echo '{}')"
echo "   ${HEALTH}"

if echo "${HEALTH}" | grep -q '"engineeringAnalysis":true'; then
  echo "   OK — new API features detected"
else
  echo "   FAIL — API is still OLD (missing features.engineeringAnalysis)"
fi

echo ""
echo "2. Version manifest:"
VERSION="$(curl -sf "${SITE_URL}/version.json" 2>/dev/null || echo '{}')"
echo "   ${VERSION}"

if echo "${VERSION}" | grep -q 'engineering-copilot-v2'; then
  echo "   OK — new frontend build detected"
else
  echo "   FAIL — frontend is still OLD (missing version.json or old featureSet)"
fi

echo ""
echo "3. Login page markers:"
HTML="$(curl -sf "${SITE_URL}/" 2>/dev/null || true)"
if echo "${HTML}" | grep -qi "Enterprise AI Operating System\|Demo Workspace"; then
  echo "   FAIL — old login UI still served"
else
  echo "   OK — old login strings not found in HTML shell"
fi

echo ""
if echo "${HEALTH}" | grep -q '"engineeringAnalysis":true' && echo "${VERSION}" | grep -q 'engineering-copilot-v2'; then
  echo "RESULT: Deployment is UP TO DATE"
  exit 0
fi

echo "RESULT: Deployment is OUTDATED — run ./scripts/console-recover.sh on VPS"
exit 1
