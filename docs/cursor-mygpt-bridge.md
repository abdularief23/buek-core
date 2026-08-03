# Cursor ↔ MyGPT Bridge — Setup & Pembagian Tugas

> **Status:** Siap dipakai  
> **Pemilik:** Abdul Arief  
> **Tujuan:** Berbagi konteks Buek Core / AMP antara **Cursor** (kode) dan **Custom GPT ChatGPT** (strategi & domain) tanpa duplikasi atau konflik

---

## Realita teknis (penting)

ChatGPT Custom GPT dan Cursor **tidak terhubung otomatis**. Tidak ada sync real-time bawaan.

Yang **bisa** kita bangun:

```text
                    ┌─────────────────┐
                    │  Source of Truth │
                    │  GitHub repo     │
                    │  docs/ + code    │
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           ▼                                   ▼
    ┌─────────────┐                     ┌─────────────┐
    │   Cursor    │                     │   MyGPT     │
    │  baca repo  │                     │ Knowledge + │
    │  tulis kode │                     │ Instructions│
    └──────┬──────┘                     └──────┬──────┘
           │                                   │
           └──────────► Anda (Abdul) ◄─────────┘
                    Handoff Template
```

**Anda** adalah jembatan. Bridge ini membuat handoff itu **terstruktur** supaya Cursor dan MyGPT tidak saling bertolak belakang.

---

## Pembagian tugas

| Area | **MyGPT** | **Cursor** | **Anda (Abdul)** |
|------|-----------|------------|------------------|
| Visi produk & positioning | ✅ Utama | Baca dari docs | Putuskan |
| Domain manufaktur (RCA, Kaizen, CAPA) | ✅ Utama | Implement sesuai docs | Validasi |
| Arsitektur AI (10 stage, audit 1–22) | Desain & review | Tulis/isi docs + kode | Approve |
| Membaca / mengubah kode | ❌ Tidak | ✅ Utama | Review PR |
| Schema, migration, worker | Spesifikasi | Implement & audit | Review |
| Sprint AI-1 / refactor | Usulkan scope | Eksekusi di repo | Prioritas |
| Pricing, pitch, narasi bisnis | ✅ Utama | Update UI/docs jika diminta | Final |
| Secret / API key | ❌ Jangan simpan di GPT | Env lokal / VPS | Kelola |
| Knowledge update MyGPT | Minta daftar file | Generate/update docs | Upload ke GPT |

### Satu kalimat

- **MyGPT** = otak strategi & domain (berpikir bersama Anda)
- **Cursor** = tangan teknik (kode, PR, audit terhadap source)
- **Repo `docs/`** = memori bersama (source of truth)
- **Anda** = sinkronisasi & keputusan akhir

---

## Kebutuhan dari Anda (checklist setup)

### Wajib (Phase 1 — Knowledge Sync)

- [ ] **Custom GPT ID** (dari URL: `g-...`) — catat di bawah / private note, jangan commit secret
- [ ] Nama GPT (contoh: `Buek Core Architect`)
- [ ] Akses edit ke Custom GPT tersebut
- [ ] Repo GitHub: `abdularief23/buek-core` (sudah ada)
- [ ] Salin isi [`docs/mygpt/INSTRUCTIONS.md`](./mygpt/INSTRUCTIONS.md) → **Configure → Instructions** di ChatGPT
- [ ] Upload file Knowledge sesuai [`docs/mygpt/KNOWLEDGE_MANIFEST.md`](./mygpt/KNOWLEDGE_MANIFEST.md)
- [ ] Set **Conversation starters** (disarankan di Instructions)
- [ ] Matikan / jangan aktifkan Actions dulu (Phase 2 opsional)

### Opsional (Phase 2 — GPT Actions baca GitHub)

- [ ] GitHub Personal Access Token (read-only, scope `contents:read`) — **jangan** taruh di chat publik; simpan di GPT Action auth
- [ ] Aktifkan Action dengan schema di [`docs/mygpt/openapi-github-docs.yaml`](./mygpt/openapi-github-docs.yaml)
- [ ] Tes: tanya MyGPT “Ambil PROJECT_CONTEXT dari repo”

### Opsional (Phase 3 — sync otomatis)

- [ ] Script / GitHub Action yang meng-export `docs/` ke zip knowledge pack
- [ ] Reminder mingguan: sync Knowledge MyGPT

---

## Alur kerja harian yang disarankan

### A) Ide / arsitektur (mulai di MyGPT)

```text
Anda → MyGPT: diskusi desain / domain
    ↓
MyGPT: hasilkan HANDOFF block (template)
    ↓
Anda → Cursor: paste HANDOFF + “implement / update docs”
    ↓
Cursor: commit ke docs/ atau kode + PR
    ↓
Anda: merge → re-upload Knowledge ke MyGPT (jika docs berubah)
```

### B) Kode / bug / audit (mulai di Cursor)

```text
Anda → Cursor: kerjakan di repo
    ↓
Cursor: hasil + ringkasan STATUS block
    ↓
Anda → MyGPT: paste STATUS + minta review domain/strategi
    ↓
MyGPT: feedback → jika perlu, HANDOFF balik ke Cursor
```

Template siap pakai: [`docs/mygpt/HANDOFF_TEMPLATE.md`](./mygpt/HANDOFF_TEMPLATE.md)

---

## Aturan anti-konflik

1. **Source of truth = GitHub `docs/`**, bukan chat MyGPT dan bukan memory chat Cursor
2. MyGPT **tidak boleh** mengklaim “sudah diimplementasi di kode” tanpa STATUS dari Cursor
3. Cursor **tidak boleh** mengubah visi domain tanpa HANDOFF / docs yang Anda approve
4. Secret (`OPENAI_API_KEY`, token, password) **tidak pernah** di-upload ke Knowledge MyGPT
5. Setelah PR docs merge → sync Knowledge MyGPT (lihat checklist)

---

## File di repo ini

| File | Fungsi |
|------|--------|
| [`cursor-mygpt-bridge.md`](./cursor-mygpt-bridge.md) | Dokumen ini |
| [`mygpt/INSTRUCTIONS.md`](./mygpt/INSTRUCTIONS.md) | Paste ke Custom GPT Instructions |
| [`mygpt/KNOWLEDGE_MANIFEST.md`](./mygpt/KNOWLEDGE_MANIFEST.md) | Daftar file yang di-upload |
| [`mygpt/HANDOFF_TEMPLATE.md`](./mygpt/HANDOFF_TEMPLATE.md) | Template tukar info Cursor ↔ MyGPT |
| [`mygpt/SYNC_CHECKLIST.md`](./mygpt/SYNC_CHECKLIST.md) | Checklist sync berkala |
| [`mygpt/openapi-github-docs.yaml`](./mygpt/openapi-github-docs.yaml) | Phase 2: Action baca docs dari GitHub |

---

## Langkah setup 15 menit (Phase 1)

1. Buka ChatGPT → **My GPTs** → Create / Edit GPT  
2. **Name:** `Buek Core — Manufacturing Architect` (atau nama Anda)  
3. **Instructions:** paste seluruh isi `docs/mygpt/INSTRUCTIONS.md`  
4. **Knowledge:** upload file dari manifest (yang sudah ada di `main` dulu; tambah dari PR #54 setelah merge)  
5. **Capabilities:** Web Browsing ON jika ingin riset; Code Interpreter opsional; **Actions OFF** dulu  
6. Simpan → salin URL → catat Custom GPT ID (`g-...`) di note pribadi  
7. Tes conversation starter:  
   > “Ringkas posisi AMP sebagai Vertical #1 Buek Core dan apa yang boleh/tidak boleh diubah.”  
8. Dari Cursor, minta generate STATUS; paste ke MyGPT dengan template HANDOFF

---

## Info yang perlu Anda berikan ke MyGPT (setelah setup)

Setelah Instructions + Knowledge terpasang, berikan ke MyGPT (boleh sekali di chat pertama):

```text
Saya Abdul Arief, founder Buek Core.
Repo: https://github.com/abdularief23/buek-core
Live: https://core.buekwebsite.com
Cursor adalah eksekutor kode; kamu adalah arsitek domain.
Gunakan HANDOFF_TEMPLATE saat ada keputusan yang harus dieksekusi di repo.
Custom GPT ID saya: g-________ (isi sendiri)
```

Jangan berikan API key ke MyGPT.

---

## Status docs AMP (penting untuk Knowledge)

| Dokumen | Status di `main` (cek sebelum upload) |
|---------|----------------------------------------|
| `analisis-masalah-pabrik-PROJECT_CONTEXT.md` | Ada (PR #53) |
| `ARCHITECTURE_REVIEW`, `AI_COPILOT`, `WORKER_AUDIT`, `CODEBASE_GUIDE`, `amp-codebase/*` | Di branch `cursor/amp-architecture-review-e866` (PR #54) — upload setelah merge, atau download dari branch |

---

*Bridge ini membuat MyGPT dan Cursor bekerja sebagai satu tim dengan memori bersama di GitHub.*
