# Analisis Masalah Pabrik — Codebase Guide (Semantic Layer)

> **Status:** ⏳ **MENUNGGU SOURCE** — diisi setelah `apps/amp/` di-import  
> **Tanggal kerangka:** 2026-07-27  
> **Tujuan:** Cursor memahami **mengapa** kode ada, bukan hanya **sintaksnya**

**Konteks terkait:**

- [`PROJECT_CONTEXT.md`](./analisis-masalah-pabrik-PROJECT_CONTEXT.md) — visi produk
- [`WORKER_AUDIT.md`](./analisis-masalah-pabrik-WORKER_AUDIT.md) — 22 audit (evaluasi)
- [`AI_COPILOT.md`](./analisis-masalah-pabrik-AI_COPILOT.md) — spesifikasi AI 10 stage

---

## Mengapa dokumen ini ada

`WORKER_AUDIT.md` menjawab: *"apakah sistem siap & benar?"*

**Codebase Guide** menjawab: *"bagaimana sistem ini bekerja, dan mengapa didesain begitu?"*

Tanpa lapisan semantik ini, Cursor hanya membaca AST — berisiko:
- Menambah fitur yang bentrok dengan business rule existing
- Menduplikasi helper yang seharusnya di-reuse
- Salah menempatkan AI di flow yang sudah punya hook

```
Source code  →  Codebase Guide (semantic)  →  WORKER_AUDIT (evaluation)  →  Sprint AI-1
```

---

## Scope dokumentasi

| Area | File source | Dokumen hasil | Isi utama |
|------|-------------|---------------|-----------|
| Database | `src/db/schema.ts` | [`amp-codebase/01-schema.md`](./amp-codebase/01-schema.md) | Tabel, relasi, field rationale, potensi growth |
| API / logic | `worker/index.ts` | [`amp-codebase/02-worker.md`](./amp-codebase/02-worker.md) | Fungsi per fungsi, endpoint, flow, AI, refactor |
| Evolusi DB | `migrations/` | [`amp-codebase/03-migrations.md`](./amp-codebase/03-migrations.md) | Timeline, requirement change, dampak sistem |
| UI flow | `src/routes/` | [`amp-codebase/04-routes.md`](./amp-codebase/04-routes.md) | Alur engineer, kaitan backend |
| AI | prompts, AI handlers | [`amp-codebase/05-ai.md`](./amp-codebase/05-ai.md) | Prompt, context, I/O, desain |

---

## Format standar (wajib untuk setiap entri)

Setiap fungsi, tabel, route, atau prompt **harus** memakai template di bawah. Ini format kanonik — jangan ringkas menjadi bullet kosong.

### Template: Function / Handler

```markdown
### `namaFungsi()` atau `METHOD /path`

**Purpose:** Satu kalimat — apa yang dilakukan untuk engineer/pabrik.

**Flow:**
```
Step 1
    ↓
Step 2
    ↓
...
```

**Input:** field request / parameter  
**Output:** shape response JSON  
**Tables touched:** problems, problem_activities, …  
**Business rules enforced:** (atau "none — gap")  
**AI involved:** Ya/Tidak — stage berapa, trigger apa  
**Activity logged:** Ya/Tidak — event type  

**Mengapa dibuat seperti ini:**  
…

**Trade-off:**  
…

**Saran jika dipisah menjadi service:**  
`services/...` — alasan
```

### Template: Table (schema)

```markdown
### `nama_tabel`

**Purpose:** Mengapa tabel ini ada dalam domain manufacturing.

**Parent / children:** relasi FK  
**Key fields:**

| Field | Tipe | Mengapa ada | Validasi |
|-------|------|-------------|----------|

**Business invariants:** aturan yang harus selalu benar  
**Used by (worker):** fungsi mana yang read/write  
**AI context:** apakah dikirim ke model  
**Potensi pengembangan:** master data, index, soft delete, …
```

### Template: Migration

```markdown
### `000N_nama.sql`

**When / why:** requirement apa yang memicu migration ini  
**Changes:** tabel/kolom/index/CHECK baru  
**Breaking:** ya/tidak — dampak ke worker & UI  
**Rollback risk:** …
```

### Template: Route (UI)

```markdown
### `/path` — Nama halaman

**Actor:** Engineer / Operator / …  
**Goal:** apa yang user capai di layar ini  
**Backend calls:** GET/POST …  
**State transitions:** problem status berubah?  
**AI surface:** panel/banner/chat di halaman ini?
```

### Template: AI artifact

```markdown
### `prompt-id` / handler name

**Stage AI:** 1–10 (AI_COPILOT)  
**Trigger:** event / endpoint  
**Context injected:** tabel/field apa  
**Input shape:** …  
**Output shape:** …  
**Prompt (ringkas atau path file):** …  

**Mengapa didesain seperti ini:** …  
**Risiko hallucination:** …  
**Decision boundary:** suggestion vs auto-write
```

---

## Contoh kanonik (format target)

Dari `worker/index.ts` — **isi aktual setelah source di-import**:

### `createProblem()`

**Purpose:**  
Membuat Problem baru dan memulai lifecycle investigasi (termasuk Kaizen default dan pemicu AI similar case jika ada).

**Flow:**
```text
Validate Request
    ↓
Insert Problem
    ↓
Insert Activity
    ↓
Generate Default Kaizen
    ↓
Trigger AI Similar Case        ← isi Ya/Tidak setelah audit
    ↓
Return Response
```

**Mengapa dibuat seperti ini:**  
_TBD — isi setelah baca kode_

**Trade-off:**  
_TBD_

**Saran jika dipisah menjadi service:**  
`services/problem.service.ts` — _TBD_

---

(Lihat [`amp-codebase/02-worker.md`](./amp-codebase/02-worker.md) untuk daftar lengkap fungsi — diisi per entry.)

---

## Urutan penulisan (disarankan)

1. **`01-schema.md`** — peta data dulu (Cursor butuh mental model entitas)
2. **`03-migrations.md`** — evolusi schema (konteks historis)
3. **`02-worker.md`** — endpoint & fungsi (referensi schema)
4. **`04-routes.md`** — alur engineer end-to-end
5. **`05-ai.md`** — cross-ref ke worker + AI_COPILOT stages
6. Jalankan **`WORKER_AUDIT.md`** — isi temuan dengan merujuk Codebase Guide
7. Update **`AI_COPILOT.md`** status matrix

---

## Checklist penyelesaian

### Prasyarat

- [ ] Source di `apps/amp/` (atau path disepakati)

### Per dokumen

- [ ] `01-schema.md` — semua tabel + relasi
- [ ] `02-worker.md` — semua endpoint + fungsi bisnis utama
- [ ] `03-migrations.md` — semua file migration berurutan
- [ ] `04-routes.md` — semua route engineer-critical
- [ ] `05-ai.md` — semua prompt/handler AI (atau "belum ada")

### Integrasi

- [ ] Cross-link: worker function ↔ schema table ↔ route page
- [ ] Cross-link: AI handler ↔ AI_COPILOT stage ↔ WORKER_AUDIT audit
- [ ] `WORKER_AUDIT.md` Deliverable D → link ke guide ini
- [ ] `PROJECT_CONTEXT.md` §12 — guide masuk "files to read first"

---

## Rules for Cursor

1. **Baca Codebase Guide sebelum mengubah** file yang didokumentasikan
2. **Update guide** jika mengubah flow, schema, atau prompt — dalam PR yang sama
3. **Jangan tebak business rule** — jika tidak terdokumentasi, tambahkan ke guide + flag di WORKER_AUDIT Audit 11
4. **Format kanonik wajib** — Purpose, Flow, Mengapa, Trade-off, Saran service

---

*Semantic layer untuk AMP — melengkapi audit & spesifikasi AI.*
