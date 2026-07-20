#!/usr/bin/env bash
# Install Vertex AI video-gen tools on VPS (headless Ubuntu)
# Run ON the VPS as ubuntu user:
#   curl -sSL <raw-url> | bash
# Or from repo:
#   cd ~/buek-core/tools/video-gen && ./setup-vps.sh

set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-project-c5cf1cf2-7957-4efb-a33}"
LOCATION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
BUCKET="${GCS_BUCKET:-buek-core-video-output}"
REPO_DIR="${REPO_DIR:-$HOME/buek-core}"
VIDEO_GEN_DIR="$REPO_DIR/tools/video-gen"

echo "=== Buek Core — VPS Video Gen Setup ==="

# 1. System deps
echo "[1/6] Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq python3 python3-pip python3-venv curl apt-transport-https ca-certificates gnupg

# 2. Google Cloud CLI
if ! command -v gcloud >/dev/null 2>&1; then
  echo "[2/6] Installing gcloud CLI..."
  curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | \
    sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list >/dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq google-cloud-cli google-cloud-cli-gke-gcloud-auth-plugin
else
  echo "[2/6] gcloud already installed."
fi

# 3. Clone/pull repo
echo "[3/6] Syncing repo..."
if [ -d "$REPO_DIR/.git" ]; then
  cd "$REPO_DIR" && git pull origin main || true
else
  git clone https://github.com/abdularief23/buek-core.git "$REPO_DIR" || {
    echo "WARN: Could not clone repo. Copy tools/video-gen manually."
  }
fi

# 4. Python venv
echo "[4/6] Python environment..."
cd "$VIDEO_GEN_DIR"
python3 -m venv .venv 2>/dev/null || sudo apt-get install -y -qq python3-venv && python3 -m venv .venv
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

# 5. GCP project + APIs
echo "[5/6] Configuring GCP..."
gcloud config set project "$PROJECT_ID" 2>/dev/null || true

if gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
  echo "  gcloud account already logged in."
else
  echo
  echo "  >>> PERLU LOGIN MANUAL (headless) <<<"
  echo "  Jalankan perintah ini dan ikuti link di browser HP/laptop:"
  echo "  gcloud auth login --no-launch-browser"
  echo "  gcloud auth application-default login --no-launch-browser"
  echo
fi

gcloud services enable aiplatform.googleapis.com storage.googleapis.com --project="$PROJECT_ID" 2>/dev/null || \
  echo "  WARN: Enable APIs manually if this fails (need billing + auth first)"

# 6. GCS bucket + .env
echo "[6/6] Creating bucket and .env..."
if gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
  if ! gsutil ls -b "gs://$BUCKET" >/dev/null 2>&1; then
    gsutil mb -l "$LOCATION" -p "$PROJECT_ID" "gs://$BUCKET" 2>/dev/null || true
  fi
fi

cat > "$VIDEO_GEN_DIR/.env" <<EOF
USE_VERTEX_AI=true
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
GOOGLE_CLOUD_LOCATION=$LOCATION
GCS_OUTPUT_URI=gs://$BUCKET/scenes
VEO_MODEL=veo-3.1-lite-generate-preview
OUTPUT_DIR=$VIDEO_GEN_DIR/output
EOF

mkdir -p "$VIDEO_GEN_DIR/output" "$VIDEO_GEN_DIR/input"

echo
echo "=== Setup selesai ==="
echo "Dir: $VIDEO_GEN_DIR"
echo
echo "Langkah berikutnya (WAJIB, sekali saja):"
echo "  gcloud auth login --no-launch-browser"
echo "  gcloud auth application-default login --no-launch-browser"
echo
echo "Generate video:"
echo "  cd $VIDEO_GEN_DIR"
echo "  source .venv/bin/activate"
echo "  python generate_scene.py --scene scene-01-opening-factory --dry-run"
echo "  python generate_scene.py --scene scene-01-opening-factory"
echo
echo "Image-to-video:"
echo "  python generate_from_image.py --image input/scene-01.jpg"
