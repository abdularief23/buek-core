#!/usr/bin/env bash
# Setup Vertex AI untuk video generation Buek Core
# Jalankan di komputer Anda (bukan di cloud agent)

set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-project-c5cf1cf2-7957-4efb-a33}"
LOCATION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
BUCKET="${GCS_BUCKET:-buek-core-video-output}"

echo "=== Buek Core — Vertex AI Video Setup ==="
echo "Project:  $PROJECT_ID"
echo "Location: $LOCATION"
echo "Bucket:   $BUCKET"
echo

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI belum terinstall."
  echo "Install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

echo "[1/5] Set project..."
gcloud config set project "$PROJECT_ID"

echo "[2/5] Login (browser akan terbuka)..."
gcloud auth application-default login

echo "[3/5] Enable APIs..."
gcloud services enable aiplatform.googleapis.com storage.googleapis.com --project="$PROJECT_ID"

echo "[4/5] Create GCS bucket (skip if exists)..."
if ! gsutil ls -b "gs://$BUCKET" >/dev/null 2>&1; then
  gsutil mb -l "$LOCATION" -p "$PROJECT_ID" "gs://$BUCKET"
  echo "Bucket created: gs://$BUCKET"
else
  echo "Bucket already exists: gs://$BUCKET"
fi

echo "[5/5] Write .env..."
ENV_FILE="$(dirname "$0")/.env"
cat > "$ENV_FILE" <<EOF
USE_VERTEX_AI=true
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
GOOGLE_CLOUD_LOCATION=$LOCATION
GCS_OUTPUT_URI=gs://$BUCKET/scenes
VEO_MODEL=veo-3.1-lite-generate-preview
OUTPUT_DIR=./output
EOF

echo
echo "=== Setup selesai ==="
echo "Edit $ENV_FILE jika perlu."
echo
echo "Test:"
echo "  cd tools/video-gen"
echo "  pip install -r requirements.txt"
echo "  python generate_scene.py --scene scene-01-opening-factory --dry-run"
echo "  python generate_scene.py --scene scene-01-opening-factory"
