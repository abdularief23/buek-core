# Buek Core — Video Production Guide

Panduan produksi video ~3 menit untuk hackathon / demo. Susun di **CapCut**; gambar dari **GPT**; animasi ringan di **Canva**; screen recording untuk bagian produk.

---

## Karakter Konsisten (copy ke SETIAP prompt gambar)

Tempel blok ini di akhir setiap prompt GPT agar karakter tidak berubah-ubah:

```
CHARACTER CONSISTENCY (must match exactly):
- Operator A: East Asian woman, age 25, light blue factory uniform, blue safety cap, focused on work, never looking at camera
- Engineer: East Asian man, age 30, thin rectangular glasses, navy blue engineer uniform with name badge, calm professional demeanor, never looking at camera
- Supervisor: East Asian person, age 40, dark blue supervisor uniform, holding tablet, observant posture, never looking at camera

STYLE: Photorealistic, Apple commercial aesthetic, clean modern manufacturing, soft natural morning light, shallow depth of field, 16:9 cinematic, no text overlays, no logos, no watermarks
```

---

## Ringkasan Adegan

| Scene | Waktu | Tipe | Voice? |
|-------|-------|------|--------|
| 1 Opening Factory | 0:00–0:06 | GPT + Canva | ✅ |
| 2 Engineer Looking | 0:06–0:12 | GPT + Canva | ✅ |
| 3 Production Waiting | 0:12–0:20 | GPT + Canva | ✅ |
| 4 Logo | 0:20–0:22 | Logo SVG/PNG | ❌ |
| 5 Website Hero | 0:22–0:35 | Screen record | ✅ |
| 6 Platform Vision | 0:35–0:45 | Canva infographic | ✅ |
| 7 Login Flow | 0:45–1:10 | Screen record | ✅ |
| 8 Investigation | 1:10–1:30 | Screen record | ✅ |
| 9 AI Analysis | 1:30–1:50 | Screen record + Canva | ✅ |
| 10 Countermeasure | 1:50–2:05 | Screen record | ✅ |
| 11 Company Brain | 2:05–2:30 | Canva + screen | ✅ |
| 12 AI Copilot | 2:30–2:50 | Screen record | ✅ |
| 13 Vision | 2:50–3:05 | Canva animation | ✅ |
| 14 Closing | 3:05–3:15 | Logo + URL | ✅ |

---

## SCENE 1 — Opening Factory (0:00–0:06)

**Voice:**  
*"Every day... manufacturing teams face production issues that demand fast decisions."*

**GPT Prompt:**
```
Wide cinematic shot of a modern inkjet printer manufacturing factory. Clean white and gray production floor, multiple parallel conveyor belts with white and black inkjet printers at various assembly stages. 6-8 operators in light blue uniforms and blue safety caps working at stations along the line. One engineer in navy blue uniform walking down the center aisle away from camera. White robotic arms on the right side of the line. Large windows on the left with bright morning sunlight streaming in, soft lens flare, polished reflective floor. Slow dolly forward perspective, deep depth of field showing factory scale.

[CHARACTER CONSISTENCY BLOCK]
```

**Canva animasi:** Ken Burns slow zoom in (2%) + subtle left-to-right pan. Durasi 6 detik.

**CapCut:** Fade in dari hitam 0.5s. Music: ambient corporate, low volume.

---

## SCENE 2 — Engineer Looking (0:06–0:12)

**Voice:**  
*"Engineers spend valuable time... searching through SOPs... historical reports... and company knowledge..."*

**GPT Prompt:**
```
Over-the-shoulder shot from behind a manufacturing engineer sitting at a modern desk inside a factory office. Three monitors on the desk: left monitor shows a quality dashboard with charts and KPI graphs, center monitor shows a PDF SOP document with technical diagrams, right monitor shows an Excel spreadsheet with historical defect data. Engineer has hand on chin, thinking, slightly concerned expression. Glass partition behind desk shows blurred factory floor in background. Warm office lighting mixed with cool monitor glow.

[CHARACTER CONSISTENCY BLOCK]
```

**Canva animasi:** Slow zoom 3% ke monitor tengah. Optional: overlay transparan highlight pada setiap monitor bergantian (dashboard → SOP → Excel).

**CapCut:** Cut dari Scene 1. Over-shoulder feel — crop sedikit lebih tight di post jika perlu.

---

## SCENE 3 — Production Waiting (0:12–0:20)

**Voice:**  
*"Before they can even begin solving the problem... While production waits... Every minute matters. What if AI could become another engineer on your team?"*

**GPT Prompt:**
```
Close-up cinematic shot of an inkjet printer production line that has stopped. A white inkjet printer sits still on the conveyor belt. Yellow warning light blinking on a control panel nearby. Two operators in blue uniforms standing beside the line, looking at each other with concerned expressions. Engineer in navy blue uniform in background, one hand on head, thinking deeply. Tense atmosphere, slightly dimmer lighting than Scene 1, industrial details sharp in foreground. Shallow depth of field.

[CHARACTER CONSISTENCY BLOCK]
```

**Canva animasi:** Slow horizontal pan kiri-ke-kanan. Tambah elemen kedip kuning (opacity pulse) di area lampu warning.

**CapCut:** Panning bisa juga di CapCut dengan keyframe. Transisi ke Scene 4: flash putih singkat atau dissolve.

---

## SCENE 4 — Logo (0:20–0:22)

**Voice:** *(tidak ada)*

**Aset:** Gunakan `docs/images/buek-core-hero.svg` atau logo PNG asli.

**Canva animasi:**
- Background putih
- Logo scale 80% → 100% (ease out, 1.5 detik)
- Subtle glow: duplicate logo, blur 20px, opacity 30%, di belakang

**CapCut:** 2 detik total. Sound: soft whoosh atau chime ringan.

---

## SCENE 5 — Buek Core Website (0:22–0:35)

**Voice:**  
*"Meet Buek Core. A platform designed to build AI Workers... for any industry."*

**Screen recording checklist:**
1. Buka https://core.buekwebsite.com (belum login)
2. Rekam hero / landing — scroll pelan ke bawah
3. Tunjukkan tagline dan navigasi
4. Resolusi 1920×1080, 60fps jika bisa
5. Cursor jangan terlalu cepat — gerakan halus

**CapCut:** Crop ke browser frame bersih. Blur area di luar jika perlu. Zoom ringan ke hero text.

---

## SCENE 6 — Platform Vision (0:35–0:45)

**Voice:**  
*"Instead of creating a different AI for every business... Buek Core separates AI reasoning... from domain knowledge."*

**Canva infographic (buat dari nol):**

```
        ┌─────────────┐
        │  Buek Core  │  ← gradient biru-ungu
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  Knowledge  │  ← kotak putih, border biru
        └──────┬──────┘
       ┌───────┼───────┐
       ▼       ▼       ▼
Manufacturing Healthcare Construction Retail
```

**Animasi Canva:** Muncul satu per satu dari atas ke bawah (stagger 0.8s). Warna ikut brand Buek Core (#0D4FF0 → #7A2AF7).

---

## SCENE 7 — Role-Based Workspace (0:40–1:00)

**Voice:**  
*"Every user has a dedicated workspace based on their role. Operators focus on keeping production running. Engineers investigate production issues and identify root causes. Supervisors review findings and approve corrective actions. Plant Managers monitor operational performance through real-time executive insights. One platform... Different roles... Working together."*

**Format rekomendasi:** Satu video full-screen per role (foto besar + UI panel kanan) — **bukan** grid 2×2.

**Durasi:** 20 detik total (4 role × 5 detik), atau potong per role di CapCut.

| Role | Waktu (saran) | Visual | Output |
|------|---------------|--------|--------|
| Operator | 0:40–0:45 | Foto operator di line + Operator Dashboard | `scene-07-role-operator.mp4` |
| Engineer | 0:45–0:50 | Foto engineer OTS + Investigation workspace | `scene-07-role-engineer.mp4` |
| Supervisor | 0:50–0:55 | Foto supervisor + Review & Approve | `scene-07-role-supervisor.mp4` |
| Plant Manager | 0:55–1:00 | Foto manager + Executive KPI dashboard | `scene-07-role-plant-manager.mp4` |

**Render (per role):**
```bash
cd tools/video-gen
node render_scene_07_per_role.mjs --duration 5 --fps 30
```

Satu role saja: `node render_scene_07_per_role.mjs --role engineer`

**GCS:** `gs://buek-core-video-output/scenes/scene-07-role-workspaces/scene-07-role-*.mp4`

**Foto referensi:** Taruh di `tools/video-gen/input/role-references/` (`01-operator.jpg` … `04-plant-manager.jpg`), lalu re-render.

**Alternatif — screen record live site (5 shot × 4 detik):**
```bash
node render_scene_07.mjs --shot-duration 4 --fps 30
```
CapCut: overlay screen recording di device (touchscreen/laptop/tablet) pada Veo B-roll shots 2–5.

**Flow penonton:** Operator laporkan → Engineer investigasi → Supervisor approve → Plant Manager lihat KPI.

---

## SCENE 8 — Investigation Starts (1:10–1:30)

**Voice:**  
*"A production issue has just been reported..."*

**Screen recording script:**
1. Dashboard Engineer → issue **White Streak**
2. Klik **Open Investigation**
3. Upload gambar (gunakan sample defect photo)
4. Upload laporan (PDF sample)
5. Tunjukkan wizard step 1–2

---

## SCENE 9 — AI Analysis (1:30–1:50)

**Voice:**  
*"AI analyzes the available information..."*

**Screen recording:** Submit analysis → tunjukkan AI thinking / loading → hasil muncul (SOP, history, similar cases).

**Canva overlay (opsional):** Animasi "AI thinking" — pulsing circle biru-ungu, teks "Analyzing knowledge base..." — taruh sebagai PiP kecil di pojok saat loading.

---

## SCENE 10 — Countermeasure (1:50–2:05)

**Voice:**  
*"Buek Core recommends possible countermeasures..."*

**Screen recording:** Checklist countermeasure → Action Plan → tombol Approve/Submit.

---

## SCENE 11 — Company Brain (2:05–2:30)

**Voice:**  
*"Every completed investigation becomes part of the Company's Brain."*

**Screen recording:** Panel Company Brain / similar cases / knowledge tree di app.

**Canva ilustrasi (backup atau overlay):**
```
Prompt GPT:
Abstract knowledge network illustration. Glowing nodes connected by lines forming a brain-like neural network shape. Center node labeled conceptually as "Company Brain" (no readable text). Blue and purple gradient nodes on dark navy background (#020617). Nodes multiplying and growing outward. Clean, modern, tech startup aesthetic. 16:9.
```

**Animasi:** Node muncul satu per satu, garis connecting draw-in effect.

---

## SCENE 12 — AI Copilot (2:30–2:50)

**Voice:**  
*"Engineers can also interact naturally with company knowledge."*

**Screen recording script:**
1. Buka AI Copilot (✨)
2. Ketik: "Find similar white streak defects"
3. Tunggu jawaban AI
4. Ketik: "Generate investigation report"
5. Tunjukkan respons

---

## SCENE 13 — Vision (2:50–3:05)

**Voice:**  
*"Manufacturing is only our first domain..."*

**Canva animasi:** Satu kolom vertikal — industry muncul bergantian:

Manufacturing → Healthcare → Education → Construction → Energy → Mining → Finance

Setiap item: icon + label, fade in dari bawah, warna berbeda tipis tapi palette tetap profesional.

---

## SCENE 14 — Closing (3:05–3:15)

**Voice:**  
*"One AI Core. Unlimited Industry Knowledge. This is Buek Core. Build AI Workers... for Any Industry."*

**Visual:**
- Background gelap (#020617) dengan partikel halus (Canva: dust/particle overlay)
- Logo Buek Core center
- Teks bawah: `core.buekwebsite.com` | `github.com/abdularief23/buek-core`
- Fade out ke hitam

---

## CapCut Assembly Checklist

1. **Timeline:** 1920×1080, 30fps
2. **Voiceover:** Script di [docs/voiceover-script.md](../docs/voiceover-script.md). Audio TTS: `python3 generate_voiceover.py` → `output/voiceover/scene-*.mp3` + `voiceover-full.mp3`. Atau rekam manual di CapCut/ElevenLabs.
3. **Music:** Epidemic Sound / CapCut library — "corporate inspiring", -18dB di bawah voice
4. **Transitions:** Cut keras untuk screen record; dissolve 0.5s untuk scene GPT
5. **Subtitles:** Aktifkan auto-caption, koreksi manual untuk istilah teknis (SOP, Buek Core)
6. **Color grade:** Slight contrast +5, saturation -5 untuk keseragaman scene GPT vs screen

---

## File Aset di Repo

| Aset | Path |
|------|------|
| Logo hero | `docs/images/buek-core-hero.svg` |
| Logo mark | `docs/images/logo-mark.svg` |
| Live demo | https://core.buekwebsite.com |
| Demo login | `abdul@epson.demo` / `BuekDemo2026!` |

---

## Tips GPT Image Generation

1. Generate **4 variasi** per scene, pilih yang paling konsisten karakternya
2. Gunakan **same seed / same chat thread** jika GPT mendukung
3. Scene 1–3: generate Engineer dulu sebagai reference, lalu "use same engineer from previous image" di Scene 2–3
4. Aspect ratio selalu **16:9** (1792×1024 atau 1536×1024)
5. Hindari teks di gambar — GPT sering salah eja

---

## Urutan Kerja Disarankan

1. ✅ Scene 1 gambar (sudah ada)
2. Generate Scene 2 & 3 dengan reference Scene 1
3. Screen record Scene 5, 7, 8, 9, 10, 12 sekaligus (satu sesi login)
4. Buat Canva Scene 6, 11, 13, 14
5. Rekam voiceover
6. Assembly di CapCut
7. Export 1080p, upload ke YouTube (unlisted) untuk link di README
