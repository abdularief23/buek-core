# Vertex AI Veo — Setup Video Buek Core

Generate video Scene 1–3 dengan **Vertex AI + ADC** (tanpa API key — cocok kalau organisasi memblokir API keys).

---

## Tentang "Free Tier"

| Yang gratis | Yang tidak |
|-------------|------------|
| Trial credit GCP **Rp5.376.601** (90 hari) | Veo **tidak** benar-benar $0 tanpa billing |
| Model **veo-3.1-lite** (paling murah) | Perlu billing account aktif |
| ADC auth (tanpa API key) | Perlu enable Vertex AI API |

**Kesimpulan:** Pakai **trial credit** Anda — itu yang dimaksud "free" di GCP. Billing tetap harus diaktifkan, tapi tidak langsung charge kartu selama credit masih ada.

---

## Opsi A: Vertex AI + ADC (DISARANKAN untuk Anda)

Cocok karena organisasi Anda memblokir API keys (*"API keys are disallowed"*).

### Langkah 1 — Install Google Cloud CLI

Download: [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

### Langkah 2 — Jalankan setup otomatis

```bash
cd tools/video-gen
chmod +x setup-vertex.sh
./setup-vertex.sh
```

Script ini akan:
1. Login via browser (`gcloud auth application-default login`)
2. Enable **Vertex AI API** + **Cloud Storage API**
3. Buat bucket GCS untuk output video
4. Generate file `.env`

### Langkah 3 — Aktifkan billing (wajib)

1. [console.cloud.google.com/billing](https://console.cloud.google.com/billing)
2. Hubungkan project **My First Project** (`project-c5cf1cf2-7957-4efb-a33`)
3. Trial credit Rp5.3 juta akan dipakai otomatis

### Langkah 4 — Generate video

```bash
pip install -r requirements.txt
python generate_scene.py --scene scene-01-opening-factory --dry-run
python generate_scene.py --scene scene-01-opening-factory
```

Output: `tools/video-gen/output/scene-01-opening-factory.mp4`

### Setup manual (kalau script gagal)

```bash
# 1. Login
gcloud auth application-default login
gcloud config set project project-c5cf1cf2-7957-4efb-a33

# 2. Enable APIs
gcloud services enable aiplatform.googleapis.com storage.googleapis.com

# 3. Buat bucket
gsutil mb -l us-central1 gs://buek-core-video-output

# 4. Copy config
cp .env.example .env
# Edit .env — pastikan USE_VERTEX_AI=true
```

Isi `.env`:
```
USE_VERTEX_AI=true
GOOGLE_CLOUD_PROJECT=project-c5cf1cf2-7957-4efb-a33
GOOGLE_CLOUD_LOCATION=us-central1
GCS_OUTPUT_URI=gs://buek-core-video-output/scenes
VEO_MODEL=veo-3.1-lite-generate-preview
OUTPUT_DIR=./output
```

---

## Opsi B: Google AI Studio (browser, tanpa script)

Kalau Vertex ribet, coba langsung di browser:

1. [aistudio.google.com/models/veo-3](https://aistudio.google.com/models/veo-3)
2. Upload gambar pabrik → image-to-video
3. Model: **Veo 3.1 Lite** atau **Fast**
4. Download MP4

---

## Opsi C: Gemini API key (jika tidak diblokir)

Hanya jika organisasi mengizinkan API key (`AIza...`):

```
USE_VERTEX_AI=false
GEMINI_API_KEY=AIza...
```

---

## Model & biaya (perkiraan)

| Model | Kualitas | Biaya estimasi / 6 detik |
|-------|----------|--------------------------|
| `veo-3.1-lite-generate-preview` | Cukup untuk demo | ~$0.04–0.15 |
| `veo-3.1-fast-generate-preview` | Lebih bagus | ~$0.50–1.00 |
| `veo-3.1-generate-001` | Terbaik | ~$2–4 |

3 scene (20 detik total) dengan **Lite** ≈ **Rp5.000–30.000** dari trial credit.

---

## Image-to-video (gambar pabrik Anda)

```bash
# Simpan gambar sebagai input/scene-01.jpg
python generate_from_image.py --image input/scene-01.jpg --scene scene-01-opening-factory
```

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `API keys are disallowed` | Pakai **Vertex AI + ADC** (Opsi A), bukan API key |
| `429 quota exceeded` | Aktifkan billing di GCP |
| `RESOURCE_PROJECT_INVALID` | Cek `GOOGLE_CLOUD_PROJECT` di `.env` |
| `Permission denied` | Jalankan `gcloud auth application-default login` lagi |
| `output_gcs_uri required` | Set `GCS_OUTPUT_URI` di `.env` dan buat bucket |

---

## Prompt siap pakai

Lihat `prompts.json` atau `docs/video-production-guide.md`.

### Scene 1 (image-to-video)
```
Animate this factory scene with slow dolly forward. Conveyors move slowly,
operators continue working, robotic arms move gently. Keep composition
and characters the same. Cinematic, realistic, morning light.
```

---

## Scene 4 — Logo reveal (HTML → MP4)

Scene 4 tidak perlu Veo — pakai animasi HTML lalu render ke MP4.

### Preview di browser

Buka `tools/video-gen/scene-04-logo.html` di Chrome (1920×1080).

### Render otomatis

```bash
cd tools/video-gen
npm install puppeteer-core --no-save   # sekali saja
node render_scene_04.mjs             # default: 2.5 detik @ 30fps
```

Output: `tools/video-gen/output/scene-04-logo.mp4`

Opsi:
```bash
node render_scene_04.mjs --duration 2 --fps 30
```

Animasi: cube pop → hex logo → circuit traces → **BUEK CORE** → divider → tagline.

---

## Scene 7 — Role-Based Workspace (revised)

**Waktu:** 0:40–1:00 (20 detik) — 5 shot × 4 detik

**Voice:** Every user has a dedicated workspace based on their role...

### Render screen recordings

```bash
cd tools/video-gen
node render_scene_07.mjs --shot-duration 4 --fps 30
```

Output:
- `output/scene-07-role-workspaces.mp4` — full scene (screen only)
- `output/scene-07-shot1-login.mp4` … `shot5-manager.mp4` — per-shot untuk CapCut

### Compositing di CapCut

| Shot | Screen record | Veo B-roll (opsional) |
|------|---------------|----------------------|
| 1 | Login → Launch | — |
| 2 | Operator dashboard | Operator di line + touchscreen |
| 3 | Engineer investigation | Engineer OTS laptop |
| 4 | Supervisor approve | Supervisor + tablet |
| 5 | Plant Manager KPI | Executive meeting room |

Veo prompts ada di `prompts.json` → `scene-07-role-workspaces.shots[1-4]`

### Versi per scene (rekomendasi — satu role = satu video full screen)

Cinematic — foto besar + UI panel kanan, **bukan** grid 2×2:

```bash
node render_scene_07_per_role.mjs --duration 5 --fps 30
```

Output per role:
- `scene-07-role-operator.mp4`
- `scene-07-role-engineer.mp4`
- `scene-07-role-supervisor.mp4`
- `scene-07-role-plant-manager.mp4`
- `scene-07-roles-full.mp4` (gabungan 20 detik)

Satu role saja: `node render_scene_07_per_role.mjs --role engineer`

### Versi infografis 2×2 (legacy)

Layout 4 role sekaligus dalam grid — gunakan hanya jika perlu satu file ringkas:

```bash
node render_scene_07_infographic.mjs --duration 20 --fps 30
```

Output: `output/scene-07-role-infographic.mp4`

Upload GCS:
```bash
gsutil -m cp output/scene-07-*.mp4 gs://buek-core-video-output/scenes/scene-07-role-workspaces/
```

---

## Scene 5 — Platform concept (3 segments × 5s)

Split into three Apple/OpenAI-style concept animations (no website UI):

| Segment | Time | File | Content |
|---------|------|------|---------|
| **5.1** | 0:22–0:27 | `scene-05-1-intro.mp4` | Logo glow + tagline |
| **5.2** | 0:27–0:32 | `scene-05-2-architecture.mp4` | 4 AIs merge → Buek Core AI Core |
| **5.3** | 0:32–0:37 | `scene-05-3-industries.mp4` | 8 industries orbit → logo finale |

```bash
cd tools/video-gen
node render_scene_05_all.mjs
# or individually:
node render_scene_05_segment.mjs --html scene-05-1-intro.html --output scene-05-1-intro.mp4 --duration 5
```

Upload ke GCS:
```bash
gsutil cp output/scene-05-1-intro.mp4 gs://buek-core-video-output/scenes/scene-05-1-intro/
gsutil cp output/scene-05-2-architecture.mp4 gs://buek-core-video-output/scenes/scene-05-2-architecture/
gsutil cp output/scene-05-3-industries.mp4 gs://buek-core-video-output/scenes/scene-05-3-industries/
```

---

## Scene 6 — Platform vision infographic

Animasi diagram: **Buek Core** → **Knowledge** → Manufacturing / Healthcare / Construction / Retail.

```bash
cd tools/video-gen
node render_scene_06.mjs --duration 10 --fps 30
```

Output: `output/scene-06-platform-vision.mp4`

Upload ke GCS:
```bash
gsutil cp output/scene-06-platform-vision.mp4 gs://buek-core-video-output/scenes/scene-06-platform-vision/scene-06-platform-vision.mp4
```

---

## Scene 7 — Login & demo launch

Screen record alur login demo: kredensial → Toyota Indonesia → Engineer → Launch Demo → dashboard.

```bash
cd tools/video-gen
node render_scene_07.mjs --duration 25 --fps 30
```

Output: `output/scene-07-login.mp4`

Upload ke GCS:
```bash
gsutil cp output/scene-07-login.mp4 gs://buek-core-video-output/scenes/scene-07-login/scene-07-login.mp4
```

---

## Workflow lengkap

```
Vertex AI generate (Scene 1-3)
        ↓
HTML logo reveal (Scene 4) — render_scene_04.mjs
        ↓
Screen record core.buekwebsite.com (Scene 5-12)
        ↓
Canva infographic (Scene 6, 13, 14)
        ↓
CapCut + voiceover
        ↓
Upload YouTube → link di README
```

---

## Link penting

- [Vertex AI Video Docs](https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview)
- [GCP Billing](https://console.cloud.google.com/billing)
- [Cloud Storage](https://console.cloud.google.com/storage)
- [gcloud install](https://cloud.google.com/sdk/docs/install)
