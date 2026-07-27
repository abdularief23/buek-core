# Analisis Masalah Pabrik — AI Manufacturing Copilot

> **Status:** Spesifikasi produk & arsitektur AI — wajib dibaca sebelum menambah fitur AI  
> **Tanggal:** 2026-07-27  
> **Konteks:** [`PROJECT_CONTEXT.md`](./analisis-masalah-pabrik-PROJECT_CONTEXT.md) · [`ARCHITECTURE_REVIEW.md`](./analisis-masalah-pabrik-ARCHITECTURE_REVIEW.md)

---

## ⚠️ Aturan Utama untuk Cursor

**AI bukan fitur tambahan. AI adalah copilot engineer.**

Jangan mengimplementasikan AMP sebagai CRUD + tombol "Ask AI" di pojok kanan. Setiap tahap investigasi harus mempertimbangkan **kapan AI aktif**, **data apa yang dibaca**, dan **keputusan apa yang tetap di tangan engineer**.

| Prinsip | Artinya |
|---------|---------|
| Engineer memutuskan | AI memberi saran, ranking, pertanyaan — tidak auto-close problem |
| AI mempercepat analisis | Bukan menggantikan judgment engineer |
| Setiap Problem closed = knowledge baru | Loop pembelajaran organisasi |
| Audit trail wajib | Setiap saran AI tercatat (model, input, output, diterima/ditolak) |

---

## Philosophy

Aplikasi ini **bukan sekadar sistem pencatatan problem**.

Tujuan akhirnya adalah **AI Manufacturing Copilot** yang membantu engineer **berpikir**, bukan menggantikan engineer.

```
Engineer tetap mengambil keputusan.
AI membantu mempercepat proses analisis.
```

---

## Manufacturing Investigation Flow with AI Assistant

### Trigger utama

Begitu **Problem dibuat**, AI mulai bekerja — tidak menunggu engineer membuka chat.

```
Problem Created
        │
        ▼
AI Understanding (Stage 1)
        │
        ▼
Similar Problem Search (Stage 2)     ← fitur AI paling penting
        │
        ▼
Investigation Assistant (Stage 3)
        │
        ▼
Root Cause Suggestion (Stage 4)
        │
        ▼
Knowledge Search (Stage 5)
        │
        ▼
Corrective Action Recommendation (Stage 6)
        │
        ▼
Risk Analysis (Stage 7)
        │
        ▼
Verification Assistant (Stage 8)
        │
        ▼
Knowledge Generation (Stage 9)
        │
        ▼
Next Time — Similarity Loop (Stage 10)
```

---

## Stage-by-Stage Specification

### Step 0 — Problem Detection (human input)

Engineer membuat Problem.

| Field | Contoh |
|-------|--------|
| Problem Description | Printer menghasilkan garis hitam vertikal setiap 10 lembar |
| Area | Assembly |
| Line | Line 2 |
| Machine | Printer M-312 |
| Shift | Shift 1 |
| Priority | High |
| Reporter | Budi Santoso |

**Event sistem:** `problem.created` → antrian AI Stage 1–2 (async, non-blocking UI).

---

### AI Stage 1 — Problem Understanding

AI membaca seluruh deskripsi + metadata Problem.

**Output yang diharapkan:**

| Task | Contoh output |
|------|---------------|
| Intent Analysis | `quality_issue` \| `mechanical_failure` \| `electrical` \| `material` |
| Keyword Extraction | `printer`, `vertical line`, `10 sheets`, `black` |
| Entity Recognition | Machine: Printer M-312 · Symptom: garis hitam vertikal · Frequency: setiap 10 lembar |

**Simpan ke:** `problem_ai_insights` (atau JSON column `ai_understanding` pada Problem — migration baru).

**UI:** Panel "AI memahami masalah ini sebagai…" di halaman Problem detail.

---

### AI Stage 2 — Similar Problem Search ⭐

**Fitur AI paling penting** — menghemat waktu investigasi.

AI mencari Problem sebelumnya yang mirip (deskripsi, area, machine, symptom, root cause historis).

**Contoh hasil:**

```
Kasus serupa ditemukan — Similarity 92%
INV-2024-0412 · Printer garis hitam · Root Cause: Encoder kotor
```

Engineer bisa membuka kasus lama tanpa search manual.

**Teknis:**

- Embedding deskripsi + metadata → vector search (D1 FTS dulu, R2/Vectorize nanti, atau Buek Core Memory Engine)
- Threshold tampil UI: ≥ 70% similarity
- Sertakan link ke Root Cause & Corrective Action yang pernah sukses

**Simpan ke:** `problem_similar_cases` (problem_id, similar_problem_id, score, reason).

---

### AI Stage 3 — Investigation Assistant

Saat engineer mulai investigasi (`status → in_progress`), AI mengajukan **pertanyaan checklist** yang sering terlupakan.

**Contoh pertanyaan:**

- Apakah masalah terjadi pada semua shift?
- Apakah material berubah?
- Apakah maintenance terakhir sudah dilakukan?
- Apakah terjadi downtime sebelumnya?

**UX:** Wizard / sidebar — engineer jawab Ya/Tidak/Unknown + catatan. Jawaban masuk `problem_activities` atau tabel `investigation_answers`.

**AI tidak mengisi jawaban** — hanya memandu.

---

### AI Stage 4 — Root Cause Suggestion

Setelah fakta cukup (deskripsi + jawaban investigasi + production + downtime + history), AI memberi **kemungkinan** Root Cause dengan confidence score.

**Contoh:**

| Root Cause | Confidence |
|------------|------------|
| Bearing Wear | 82% |
| Motor Failure | 51% |
| Sensor Dirty | 37% |

**Aturan kritis:** AI **tidak memilih**. Engineer yang memilih dan menyimpan ke `root_causes`.

**Input data:**

```
Problem + Investigation answers + Daily Production + Downtime + Similar cases
```

**Output:** ranked list + evidence bullets per cause (mirip `PossibleCauseDto` di Buek Core).

---

### AI Stage 5 — Knowledge Retrieval

AI mencari knowledge perusahaan:

- Manual / SOP
- Work Instruction
- Maintenance record
- Previous Problem + Kaizen
- Lesson learned

**Output:** daftar referensi dengan `referenceId` (SOP-014, WI-QC-022, dll.) — engineer tidak perlu cari manual sendiri.

**Integrasi Buek Core:** `packages/knowledge` + RAG index per `Company`/`Workspace`.

---

### AI Stage 6 — Corrective Action Recommendation

Setelah engineer **memilih** Root Cause, AI merekomendasikan rantai tindakan:

```
Replace Bearing
    → Lubrication Schedule
    → Operator Training
    → Inspection Checklist
```

Engineer boleh **menerima**, **mengubah**, atau **menolak** — setiap keputusan tercatat.

**Simpan:** pre-fill `corrective_actions` — status `suggested` sampai engineer confirm.

---

### AI Stage 7 — Risk Analysis

AI memperkirakan dampak jika action tidak dilakukan:

- Downtime meningkat
- Quality turun
- Reject naik

Plus **Priority Recommendation** (bukan override priority manual).

**Input:** severity historis, downtime trend, production defect rate, similar case outcomes.

---

### AI Stage 8 — Verification Assistant

Setelah Corrective Action selesai, AI mengevaluasi apakah ada improvement nyata.

**Bandingkan:**

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Downtime | baseline | current | -43% |
| Defect rate | baseline | current | -18% |

Engineer + Supervisor tetap approve sebelum `status = closed`.

**Gate:** Problem tidak boleh closed tanpa verification evidence (metric atau attachment) — selaras dengan ARCHITECTURE_REVIEW Sprint D.

---

### AI Stage 9 — Knowledge Generation

Ketika Problem **closed**, AI otomatis membuat:

- Summary investigasi
- Root Cause final
- Lesson Learned
- Best Practice

Tidak perlu ditulis manual — engineer review & edit sebelum publish ke knowledge base.

**Simpan ke:** `kaizen` steps terakhir + `lesson_learned` / Company Brain entry.

---

### AI Stage 10 — Next Time (closed loop)

Problem serupa muncul lagi → AI sudah punya:

```
Knowledge → Similarity → Recommendation → History → Evidence
```

Engineer baru pun dapat menyelesaikan lebih cepat — ini adalah **compound value** platform.

---

## Implementation Status Matrix

> Berdasarkan review ZIP AMP + kode Buek Core saat ini. **Perlu audit baris-per-baris `worker/index.ts`** setelah source di-import untuk mengisi kolom AMP dengan akurat.

| Stage | Nama | AMP (expected) | Buek Core (existing) | Prioritas |
|-------|------|----------------|----------------------|-----------|
| 0 | Problem Detection | ✅ CRUD Problem | ✅ Issue creation | Done |
| 1 | Problem Understanding | ❓ fondasi data ada, AI belum | ⚠️ partial (keyword di copilot) | P1 |
| 2 | Similar Problem Search | ❓ | ⚠️ demo (`similarCases` di copilot) | **P0** |
| 3 | Investigation Assistant | ❌ | ⚠️ stepper questions (manual) | P1 |
| 4 | Root Cause Suggestion | ❓ | ✅ `possibleCauses` + confidence | P0 |
| 5 | Knowledge Retrieval | ❌ | ✅ `sopReferences` | P1 |
| 6 | Corrective Action Rec. | ❓ | ✅ `countermeasureOptions` | P0 |
| 7 | Risk Analysis | ❌ | ❌ | P2 |
| 8 | Verification Assistant | ❌ | ⚠️ partial (metrics context) | P1 |
| 9 | Knowledge Generation | ❌ | ⚠️ LessonLearned manual | P1 |
| 10 | Next Time loop | ❌ | ⚠️ Company Brain concept | P2 |

**Legenda:** ✅ implemented · ⚠️ partial/demo · ❌ belum · ❓ perlu verifikasi di `worker/index.ts`

---

## AI Architecture (target)

### Event-driven pipeline

```text
worker/routes/problems.ts
    │ POST /api/problems
    ▼
services/problem.service.ts
    │ create problem + ensureKaizen()
    │ emit problem.created
    ▼
services/ai/
    ├── understanding.service.ts      # Stage 1
    ├── similar-case.service.ts       # Stage 2
    ├── investigation-assistant.ts    # Stage 3
    ├── root-cause-suggest.service.ts # Stage 4
    ├── knowledge-retrieval.service.ts# Stage 5
    ├── action-recommend.service.ts   # Stage 6
    ├── risk-analysis.service.ts      # Stage 7
    ├── verification.service.ts       # Stage 8
    └── knowledge-generate.service.ts # Stage 9–10
    ▼
repositories/ + Drizzle (read Problem, Production, Downtime, History)
    ▼
AI provider (OpenAI via Buek Core) OR edge-compatible model di Worker
```

### Data yang sudah siap sebagai bahan AI (dari schema AMP)

| Tabel | Dipakai AI untuk |
|-------|------------------|
| `problems` | Deskripsi, area, priority, status |
| `root_causes` | Histori RCA, training similar case |
| `corrective_actions` | Pola tindakan sukses |
| `problem_activities` | Timeline investigasi |
| `daily_production` | Konteks quality trend |
| `downtime` | Korelasi mesin stop |
| `kaizen` | Lesson learned steps |

**Kesimpulan:** Fondasi data **sangat baik** untuk AI — yang kurang adalah **orchestration layer** dan **trigger otomatis**, bukan tabel baru untuk MVP AI.

---

## Mapping ke Buek Core

Jangan duplikasi logic AI kompleks di Cloudflare Worker jika Buek Core sudah punya building blocks.

| AMP Stage | Buek Core file / package |
|-----------|--------------------------|
| 2, 4, 5, 6 | `apps/api/src/services/investigation-copilot.ts` |
| Chat bebas | `apps/api/src/chat.ts` |
| Audit AI | `apps/api/src/services/audit-log.ts` + `AgentAction` |
| Memory / similar | `packages/memory` |
| Knowledge RAG | `packages/knowledge` |
| Goal alignment | `apps/api/src/services/goal-alignment.ts` |
| Usage limits | `apps/api/src/billing/usage.ts` |

**Strategi integrasi:**

1. **Fase pendek (AMP standalone):** stub AI di Worker + panggil Buek Core API `/api/investigations/copilot` jika online
2. **Fase merge:** AI sepenuhnya di Buek Core API; AMP UI hanya render `InvestigationCopilotDto`
3. **Offline edge:** Stage 1–2 ringan (FTS/keyword) di D1; Stage 4–6 via API call

---

## API Surface (target)

| Endpoint | Stage | Trigger |
|----------|-------|---------|
| `POST /api/problems` | 0 | Engineer create |
| `POST /api/problems/:id/ai/analyze` | 1–2 | Auto after create |
| `GET /api/problems/:id/ai/similar` | 2 | On demand + cached |
| `GET /api/problems/:id/ai/investigation-questions` | 3 | status → in_progress |
| `POST /api/problems/:id/ai/suggest-root-causes` | 4 | After investigation answers |
| `GET /api/problems/:id/ai/knowledge` | 5 | On demand |
| `POST /api/problems/:id/ai/suggest-actions` | 6 | After root cause selected |
| `GET /api/problems/:id/ai/risk` | 7 | Before prioritize |
| `POST /api/problems/:id/ai/verify` | 8 | Action completed |
| `POST /api/problems/:id/ai/generate-lesson` | 9 | Before close |
| — | 10 | Automatic on Stage 2 for new problems |

---

## UI Patterns (jangan salah desain)

| ❌ Salah | ✅ Benar |
|---------|---------|
| Satu chatbot generik tanpa konteks Problem | Copilot panel terikat ke Problem aktif |
| AI auto-set root cause | Ranking + engineer pick |
| Tombol "Ask AI" tanpa data produksi | Auto-load context (NG rate, downtime, maintenance) |
| Saran AI tanpa audit | Log ke `problem_activities` + `AgentAction` |
| Similar case hanya di chat | Banner "Kasus serupa 92%" saat Problem dibuat |

**Referensi UI Buek Core:** `apps/web/src/components/InvestigationCopilotWorkspace.tsx`

---

## Prompt & Quality Guidelines

Saat implementasi prompt (Worker atau Buek Core):

1. **Selalu ranked causes** — jangan satu jawaban final (`chat.ts` rule sudah ada di Buek Core)
2. **Evidence bullets** — setiap cause wajib punya alasan dari data
3. **Bahasa Indonesia** untuk UI engineer; prompt bisa bilingual
4. **Confidence 0–100** — tampilkan transparan, bukan "AI yakin"
5. **Human override** — simpan `engineer_selected_cause_id` terpisah dari `ai_suggested_cause_id`

---

## Backlog AI (untuk Cursor)

### Sprint AI-1 — Foundation (setelah **Worker Audit** selesai)

> **Gate:** [`WORKER_AUDIT.md`](./analisis-masalah-pabrik-WORKER_AUDIT.md) wajib selesai (Audit 1–10) sebelum Sprint AI-1 dimulai.

- [ ] Event `problem.created` → trigger Stage 1–2 (hook dari §11 Integration Points)
- [ ] Tabel/kolom `ai_understanding` + `problem_similar_cases`
- [ ] UI banner similar case
- [ ] Audit log untuk setiap AI call

### Sprint AI-2 — Investigation copilot

- [ ] Stage 3 investigation questions
- [ ] Stage 4 root cause ranking (bridge ke `investigation-copilot.ts`)
- [ ] Stage 5 knowledge retrieval

### Sprint AI-3 — Action & verify

- [ ] Stage 6 corrective action pre-fill
- [ ] Stage 8 verification compare before/after metrics
- [ ] Gate: cannot close without verification

### Sprint AI-4 — Knowledge loop

- [ ] Stage 9 auto lesson learned on close
- [ ] Stage 10 embedding index untuk similar search production-grade
- [ ] Sync ke Buek Core Company Brain

---

## Audit Checklist: `worker/index.ts` (wajib sebelum Sprint AI-1)

**Jangan audit ad-hoc** — gunakan metodologi lengkap 10 audit di [`WORKER_AUDIT.md`](./analisis-masalah-pabrik-WORKER_AUDIT.md):

1. Entry Point (endpoint map)
2. Business Flow (trace per operasi)
3. AI Entry (semua pemanggilan model)
4. Prompt Analysis
5. Knowledge Flow
6. Memory strategy
7. Decision Boundary
8. Event Flow
9. Dependency Graph
10. Refactor Opportunity

**Hasil audit** → isi Implementation Status Matrix di atas + §11 AI Integration Points + §12 Sprint Recommendation.

**Status saat ini:** ⏳ menunggu import source AMP ke repo.

---

## Rules for Cursor When Adding AI

1. **Baca dokumen ini** sebelum menambah endpoint atau komponen AI
2. **Identifikasi stage** — fitur baru harus masuk Stage 1–10, bukan "misc AI"
3. **Engineer decides** — tidak ada auto-write ke `root_causes` tanpa confirm
4. **Problem-scoped** — semua AI context terikat `problemId`
5. **Reuse Buek Core** — cek `investigation-copilot.ts` sebelum menulis prompt baru
6. **Catat di activity log** — setiap saran AI yang diterima/ditolak
7. **Respect usage limits** — jika terhubung Buek Core billing

---

*Dokumen ini melengkapi PROJECT_CONTEXT dan ARCHITECTURE_REVIEW — ketiga dokumen wajib dibaca bersama saat mengembangkan AMP.*
