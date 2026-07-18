#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Running database migrations..."
pnpm prisma migrate deploy --schema prisma/schema.prisma

echo "==> Seeding database (idempotent)..."
pnpm prisma:seed || true

echo "==> Starting API..."
exec pnpm start
