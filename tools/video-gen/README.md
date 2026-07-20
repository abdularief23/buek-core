# Gemini Veo — Setup Video Buek Core

Panduan setup untuk generate video Scene 1–3 dengan **Google Gemini Veo**, lalu edit di CapCut.

---

## Opsi A: Google AI Studio (paling mudah — tanpa coding)

Cocok kalau mau coba cepat di browser.

### Langkah 1 — Aktifkan billing

Veo adalah fitur **berbayar** (paid preview). Trial credit GCP Anda (~Rp5.3 juta) bisa dipakai.

1. Buka [Google AI Studio](https://aistudio.google.com/)
2. Login dengan akun Google yang sama dengan GCP
3. Klik ikon **Key** (kanan atas) → pilih project **My First Project**
4. Jika diminta, aktifkan **Paid tier** / billing di [Google Cloud Console](https://console.cloud.google.com/billing)

### Langkah 2 — Buat API Key

1. Buka [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Klik **Create API key**
3. Pilih project GCP Anda
4. Salin key — simpan aman, jangan commit ke GitHub

### Langkah 3 — Generate video di browser

1. Buka [Veo 3.1 di AI Studio](https://aistudio.google.com/models/veo-3)
2. Pilih model **Veo 3.1 Fast** (lebih cepat & murah)
3. Paste prompt dari `prompts.json` (lihat bawah)
4. Setting:
   - **Aspect ratio:** 16:9
   - **Duration:** 6 detik (Scene 1 & 2) atau 8 detik (Scene 3)
   - **Resolution:** 720p (cukup untuk CapCut)
5. Klik Generate → tunggu 1–3 menit
6. Download MP4

### Image-to-video (gunakan gambar Scene 1 Anda)

Di AI Studio Veo, upload gambar pabrik yang sudah Anda punya, lalu prompt:

```
Animate this factory scene with slow dolly forward. Conveyors move slowly,
operators continue working, robotic arms move gently. Keep composition
and characters the same as the source image. Cinematic, realistic.
```

---

## Opsi B: Script Python (batch generate)

Cocok kalau mau generate banyak scene sekaligus dari terminal.

### Langkah 1 — Install

```bash
cd tools/video-gen
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### Langkah 2 — Isi API key

Edit `.env`:

```
GEMINI_API_KEY=AIza...your_key_here
VEO_MODEL=veo-3.1-fast-generate-preview
OUTPUT_DIR=./output
```

### Langkah 3 — Cek prompt (tanpa bayar)

```bash
python generate_scene.py --list
python generate_scene.py --scene scene-01-opening-factory --dry-run
```

### Langkah 4 — Generate video

```bash
# Satu scene
python generate_scene.py --scene scene-01-opening-factory

# Semua scene GPT (1-3)
python generate_scene.py --all
```

Output ada di `tools/video-gen/output/`.

### Image-to-video dari gambar Anda

Simpan gambar pabrik sebagai `tools/video-gen/input/scene-01.jpg`, lalu:

```bash
python generate_from_image.py --image input/scene-01.jpg --scene scene-01-opening-factory
```

---

## Estimasi biaya

| Model | Per detik video | Scene 6 detik |
|-------|-----------------|---------------|
| Veo 3.1 Fast | ~$0.15–0.40/s | ~$1–2.4 |
| Veo 3.1 (full) | ~$0.75/s | ~$4.5 |

3 scene (6+6+8 = 20 detik) ≈ **$3–15** tergantung model. Trial credit GCP Anda lebih dari cukup.

---

## Prompt siap paste (AI Studio)

### Scene 1 — Opening Factory (6 detik)

```
Wide cinematic slow dolly forward shot of a modern inkjet printer manufacturing factory. Clean white and gray production floor, multiple parallel conveyor belts with white and black inkjet printers at assembly stages. Six to eight operators in light blue uniforms working at stations. One engineer in navy blue uniform walking down the center aisle away from camera. White robotic arms on the right. Large windows on the left with bright morning sunlight, polished reflective floor.

CHARACTER CONSISTENCY: East Asian woman operator age 25 in light blue factory uniform and blue safety cap. East Asian male engineer age 30 with thin rectangular glasses and navy blue engineer uniform. Never looking at camera. Photorealistic Apple commercial style, 16:9 cinematic, no text, no logos.
```

### Scene 2 — Engineer Looking (6 detik)

```
Over-the-shoulder cinematic shot from behind a manufacturing engineer sitting at a modern desk inside a factory office. Three monitors: left shows quality dashboard with charts, center shows PDF SOP technical document, right shows Excel spreadsheet with historical defect data. Engineer has hand on chin thinking. Glass partition behind shows blurred factory floor. Slow zoom in.

Same engineer character: East Asian man age 30, thin rectangular glasses, navy blue engineer uniform. Never looking at camera. Photorealistic, 16:9, no readable text on screens.
```

### Scene 3 — Production Waiting (8 detik)

```
Close-up cinematic shot of a stopped inkjet printer production line. White inkjet printer still on conveyor. Yellow warning light blinking on control panel. Two operators in blue uniforms looking concerned. Engineer in background with hand on head thinking. Tense atmosphere, shallow depth of field. Slow horizontal pan.

Same characters as previous scenes. Never looking at camera. Photorealistic factory, 16:9, no logos.
```

---

## Scene yang TIDAK perlu Veo

| Scene | Cara |
|-------|------|
| 4 Logo | Pakai `docs/images/buek-core-hero.svg` di Canva |
| 5, 7, 8, 10, 12 | Screen record `core.buekwebsite.com` |
| 6, 13 | Infografis Canva |
| 11 | Ilustrasi brain/network di Canva |
| 14 | Logo + URL di Canva |

---

## Workflow lengkap

```
Gemini Veo (Scene 1-3)
        ↓
   Download MP4
        ↓
CapCut + Screen record (Scene 5-12)
        ↓
Canva animasi (Scene 4, 6, 13, 14)
        ↓
Voiceover + musik di CapCut
        ↓
Export 1080p → YouTube (unlisted) → link di README
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `API key invalid` | Buat key baru di AI Studio, pastikan billing aktif |
| `Veo not available` | Pastikan pakai paid tier, bukan free tier |
| `Quota exceeded` | Tunggu atau upgrade limit di Cloud Console |
| Karakter tidak konsisten | Pakai image-to-video dari Scene 1 sebagai reference |
| Video terlalu pendek | Veo max 4/6/8 detik — extend di CapCut dengan slow-mo |

---

## Link penting

- [Google AI Studio](https://aistudio.google.com/)
- [API Keys](https://aistudio.google.com/apikey)
- [Veo 3.1 Model](https://aistudio.google.com/models/veo-3)
- [Veo API Docs](https://ai.google.dev/gemini-api/docs/video)
- [GCP Billing](https://console.cloud.google.com/billing)
