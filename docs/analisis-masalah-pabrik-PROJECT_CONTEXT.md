# Analisis Masalah Pabrik — Project Context

> **Dokumen ini adalah "otak proyek" untuk Cursor dan kontributor.**
> Baca ini **sebelum** mengubah `src/`, `worker/`, atau `migrations/`.
> Jangan anggap repo ini sekadar CRUD — ini adalah **Vertical #1** pada visi **Buek Core**.

---

## 1. Positioning dalam Buek Core

| Aspek | Keputusan |
|-------|-----------|
| **Status** | Vertical manufacturing #1 — bukan aplikasi standalone jangka panjang |
| **Platform induk** | [Buek Core](https://core.buekwebsite.com) — AI platform + domain modules |
| **Origin** | Dibangun awal di [Vantis Pabrik](https://app.vantis.sh) (Cloudflare template) |
| **Target akhir** | **AI Manufacturing Copilot** — bukan fitur tambahan, melainkan inti workflow investigasi |
| **Spesifikasi AI** | [`analisis-masalah-pabrik-AI_COPILOT.md`](./analisis-masalah-pabrik-AI_COPILOT.md) — 10 stage AI, trigger, aturan "engineer decides" |

### Yang akan terhubung ke Buek Core (roadmap)

```
Analisis Masalah Pabrik (AMP)
    ├── Memory Engine      → kasus serupa, lessons learned
    ├── Knowledge Engine   → SOP, histori problem, RCA
    ├── Workflow Engine    → investigasi → verifikasi → closed
    ├── AI Agent           → saran root cause & corrective action
    ├── Dashboard          → KPI, Pareto, trend
    └── Audit / Governance → activity log, approval, trace AI
```

### Mapping domain ke Buek Core (referensi integrasi)

| Entitas AMP | Padanan di Buek Core (`domains/manufacturing`) |
|-------------|-----------------------------------------------|
| `Problem` | `Issue` + `Investigation` |
| `Root Cause` | `EngineeringAnalysis.selectedCause` |
| `Corrective Action` | `countermeasures` + `WorkOrder` |
| `Activity` | `ActivityEvent` + `AgentAction` (audit) |
| `Daily Production` | `production-metrics` / operator report |
| `Downtime` | `Machine` telemetry + timeline |
| `Kaizen` | `LessonLearned` + improvement steps |

---

## 2. Product Purpose

Aplikasi internal untuk tim manufacturing **mencatat, menganalisis, dan menyelesaikan masalah produksi secara terstruktur** — dengan **AI sebagai copilot engineer**, bukan pengganti engineer.

Bukan ticketing generik — ini **pusat continuous improvement** yang menghubungkan:

- Data masalah (defect, downtime, quality)
- Analisis akar masalah (RCA)
- Tindakan perbaikan (CAPA)
- Data produksi harian (konteks analitik)
- Knowledge untuk masalah berikutnya

### Fokus utama

1. Mencatat setiap masalah produksi
2. Menyimpan root cause analysis
3. Mengelola corrective action (PIC, due date, status)
4. Memantau progres penyelesaian
5. Menghubungkan produksi dengan kualitas
6. Menjadi dasar keputusan improvement

---

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, Vite 8, TypeScript (strict) |
| Routing | TanStack Router |
| Styling | Tailwind CSS v4 |
| API runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM + Drizzle Kit |
| Deploy | Wrangler (`wrangler.jsonc`) |
| Package manager | npm 10 (`packageManager` field) |

Template origin: `cloudflare-app-template` (Vantis/Pabrik).

---

## 4. Architecture

```
Browser
   │
   ▼
React + TanStack Router          ← src/
   │  (pages, components, hooks)
   ▼
Cloudflare Worker                ← worker/index.ts
   │  (CRUD, validation, business logic)
   ▼
Cloudflare D1                    ← migrations/ + src/db/schema.ts
   (Drizzle ORM, type-safe queries)
```

**Monorepo single-package:** frontend dan backend dalam satu repository; Worker menangani API, React di-bundle via Vite + `@cloudflare/vite-plugin`.

### Request flow (expected)

1. User action di React page (`src/pages/` atau route file)
2. Hook/fetch memanggil Worker API (`/api/...` atau route handler di `worker/`)
3. Worker memvalidasi input, menjalankan business logic
4. Drizzle query ke D1
5. Response JSON → UI update

---

## 5. Folder Structure & Responsibilities

```text
analisis-masalah-pabrik/
├── src/                    # Frontend React
│   ├── db/schema.ts        # Drizzle schema (source of truth types)
│   ├── pages/              # Route-level screens
│   ├── components/         # Reusable UI
│   ├── routes/             # TanStack Router config
│   ├── hooks/              # Data fetching, form state
│   └── lib/                # Utilities, API client
├── worker/
│   └── index.ts            # Worker entry — API handlers
├── migrations/             # D1 SQL migrations (jangan dihapus)
├── seeds/
│   └── local.sql           # Seed data (dev)
├── drizzle.config.ts       # Drizzle Kit config
├── wrangler.jsonc          # Cloudflare Worker + D1 binding
├── vite.config.ts          # Vite + Cloudflare plugin
├── tsconfig.json           # strict TS, path alias #/* → ./src/*
├── package.json
├── index.html
└── .jatevo/
    └── agent-memory.json   # Planning & requirements dari AI builder
```

### Path alias

```json
"imports": { "#/*": "./src/*" }
```

Gunakan `#/components/...` bukan relative path panjang.

### npm scripts (expected)

| Script | Fungsi |
|--------|--------|
| `npm run dev` | Vite dev server + Worker local |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate migration dari schema |
| `npm run db:migrate:local` | Apply migration ke D1 local |
| `npm run db:migrate:remote` | Apply migration ke D1 production |
| `npm run db:seed:local` | Seed data lokal |

---

## 6. Business Domain

### Entities (database)

| Entity | Deskripsi | Relasi utama |
|--------|-----------|--------------|
| **Problem** | Masalah produksi (defect, mesin stop, material abnormal, human error, quality) | Parent untuk RCA, action, activity, kaizen |
| **Root Cause** | Akar penyebab; satu Problem bisa punya banyak | `problemId` |
| **Corrective Action** | Tindakan perbaikan: PIC, target date, status, notes | `problemId`, optional `rootCauseId` |
| **Daily Production** | Output, defect, area, line, shift per hari | Analitik standalone |
| **Downtime** | Mesin berhenti: durasi, penyebab, lost output | Optional link ke Problem |
| **Kaizen Step** | Langkah improvement (saat ini list; future: workflow) | `problemId` |
| **Problem Activity** | Audit log perubahan pada problem | `problemId` |

### Relasi konseptual

```
Problem
├── Root Causes[]
├── Corrective Actions[]
├── Kaizen Steps[]
├── Activity Logs[]
└── Downtime (optional)

Daily Production  →  sumber analitik (dashboard, trend, Pareto)
```

### Terminologi manufacturing (jangan diubah sembarangan)

- **Problem** — bukan "ticket" atau "issue" di UI Indonesia
- **Root Cause** — bukan "reason" generik
- **Corrective Action** — bukan "task" generik
- **PIC** — Person In Charge
- **Kaizen** — continuous improvement step
- **Verification** — bukti masalah sudah teratasi sebelum **Closed**

---

## 7. Investigation Workflow (state machine)

```
Problem terjadi
      ↓
Problem dibuat          (status: open)
      ↓
Engineer investigasi    (status: in_progress)
      ↓
Root Cause dibuat
      ↓
Corrective Action dibuat
      ↓
Follow Up               (PIC updates status)
      ↓
Verification            (bukti: metric, foto, PPM, dll.)
      ↓
Closed                  (status: closed → knowledge)
      ↓
Knowledge Base          (similar case lookup, AI lesson learned)
```

**Begitu Problem dibuat, AI Stage 1–2 harus berjalan** (understanding + similar case search). Detail lengkap: [`AI_COPILOT.md`](./analisis-masalah-pabrik-AI_COPILOT.md).

**Setiap transisi status penting harus tercatat di `Problem Activity`.**

---

## 8. Database Rules

1. **Schema source of truth:** `src/db/schema.ts`
2. **Semua perubahan schema** → `drizzle-kit generate` → file baru di `migrations/`
3. **Jangan hapus migration lama** — D1 production bergantung pada urutan migration
4. **Jangan edit migration yang sudah di-apply** di remote — buat migration baru
5. **Gunakan Drizzle query builder** — hindari raw SQL kecuali migration/seed
6. **Foreign keys** — pertahankan relasi Problem sebagai parent
7. **Jangan duplikasi data** — simpan relasi, bukan copy field yang bisa di-join

---

## 9. Development Rules

### Wajib

- TypeScript `strict: true` — tidak ada `any` tanpa alasan
- Pisahkan **UI** (components) dari **business logic** (worker, hooks)
- Komponen reusable di `src/components/`
- Validasi input di Worker sebelum write ke D1
- Activity log untuk setiap perubahan penting pada Problem
- Penamaan field konsisten antara schema, API JSON, dan UI

### Dilarang tanpa diskusi

- Refactor besar struktur folder
- Hapus kolom/tabel yang sudah dipakai production
- Ubah terminologi domain manufacturing
- Query SQL mentah di Worker jika Drizzle cukup
- Hardcode secrets — gunakan Wrangler secrets / env bindings

### Saat menambah fitur baru

1. Baca business flow (§7) — fitur harus masuk alur investigasi atau analitik
2. Update schema + migration jika perlu data baru
3. Tambah handler di `worker/`
4. Tambah route/page di `src/`
5. Catat activity jika menyentuh Problem
6. Typecheck: `npm run typecheck`

---

## 10. Code Review Checklist (untuk Cursor)

Saat membaca atau mengubah kode:

- [ ] Apakah perubahan selaras dengan investigation flow?
- [ ] Apakah terminologi manufacturing tetap konsisten?
- [ ] Apakah ada migration untuk perubahan schema?
- [ ] Apakah activity log di-update untuk perubahan Problem?
- [ ] Apakah types Drizzle dipakai (bukan string bebas)?
- [ ] Apakah komponen UI tidak mengandung query DB langsung?
- [ ] Apakah perubahan mendukung visi integrasi Buek Core (§1)?
- [ ] Jika menyentuh AI: apakah masuk Stage 1–10 di AI_COPILOT.md dan engineer tetap yang memutuskan?
- [ ] Refactor minimal — jangan ubah file tidak terkait

---

## 11. Long-Term Roadmap

> **Prioritas teknis detail:** lihat [`analisis-masalah-pabrik-ARCHITECTURE_REVIEW.md`](./analisis-masalah-pabrik-ARCHITECTURE_REVIEW.md) — scorecard, gap P0–P3, worker refactor plan, index & master data migration.

### Fase saat ini — MVP AMP (Cloudflare)

- [x] CRUD Problem, Root Cause, Corrective Action
- [x] Daily Production, Downtime, Kaizen, Activity
- [ ] Dashboard KPI dasar
- [ ] Filter & search problem
- [ ] Export PDF/Excel

### Fase 2 — Analytics

- Pareto defect
- Trend defect & downtime
- Line/shift comparison
- KPI cards (OEE, NG rate, downtime %)

### Fase 3 — AI Manufacturing Copilot (inti produk, bukan add-on)

> Spesifikasi lengkap 10 stage: [`analisis-masalah-pabrik-AI_COPILOT.md`](./analisis-masalah-pabrik-AI_COPILOT.md)

- [ ] Stage 1–2: Problem understanding + similar case search (trigger on create)
- [ ] Stage 3: Investigation assistant (checklist questions)
- [ ] Stage 4–6: Root cause ranking, knowledge retrieval, corrective action rec.
- [ ] Stage 7–8: Risk analysis + verification assistant
- [ ] Stage 9–10: Auto lesson learned + closed-loop knowledge
- Bridge ke Buek Core `investigation-copilot.ts` + `packages/memory` + `packages/knowledge`

### Fase 4 — Enterprise

- Multi-factory / multi-plant
- User authentication & role management (Operator, Engineer, Supervisor)
- Approval workflow
- Notification system
- Integrasi API ke `core.buekwebsite.com`

---

## 12. Files to Read First (when code is available)

Urutan baca untuk memahami codebase:

1. `docs/analisis-masalah-pabrik-PROJECT_CONTEXT.md` (dokumen ini)
2. **`docs/analisis-masalah-pabrik-AI_COPILOT.md`** — AI sebagai copilot engineer (10 stage, wajib sebelum fitur AI)
3. **`docs/analisis-masalah-pabrik-ARCHITECTURE_REVIEW.md`** — temuan review schema/worker, gap analysis, backlog prioritas
4. `src/db/schema.ts` — entitas & relasi
5. `migrations/` — evolusi schema
6. `worker/index.ts` — API surface & business rules (+ audit AI calls, lihat AI_COPILOT.md)
7. `src/routes/` — routing & halaman utama
8. `.jatevo/agent-memory.json` — requirement asli dari AI builder
9. `wrangler.jsonc` — D1 binding & env

---

## 13. Integration Notes for Buek Core Maintainers

Ketika AMP di-merge atau di-sync ke Buek Core:

| AMP (Cloudflare) | Buek Core (VPS) |
|------------------|-----------------|
| D1 + Drizzle | PostgreSQL + Prisma |
| Cloudflare Worker | Express API (`apps/api/`) |
| TanStack Router | React SPA (`apps/web/`) |
| Standalone deploy | Docker + `core.buekwebsite.com` |

**Strategi migrasi yang disarankan:**

1. Port **domain logic** (workflow investigasi, entity relationships) — bukan copy-paste stack
2. Reuse **UI patterns** (stepper investigasi, activity log) di `apps/web/`
3. Map schema Drizzle → Prisma models di `apps/api/prisma/`
4. Sambungkan AI via `apps/api/src/chat.ts` + `domains/manufacturing/`
5. Billing & multi-tenant via existing `Company` / `Workspace` di Buek Core

---

## 14. What NOT to Change

- Investigation workflow state machine (§7) tanpa update dokumen ini
- Nama entitas domain (§6) tanpa migrasi UI + API + DB
- Folder `migrations/` history
- Posisi proyek sebagai vertical Buek Core (§1)
- File `.jatevo/agent-memory.json` — referensi requirement awal

---

## 15. Quick Reference Card

```
Product:  Analisis Masalah Pabrik (AMP)
Stack:    React 19 + Vite + CF Worker + D1 + Drizzle
Parent:   Buek Core — Vertical #1 Manufacturing
Flow:     Problem → RCA → CAPA → Verify → Closed → Knowledge
Schema:   src/db/schema.ts
API:      worker/index.ts
Rules:    migration-first, strict TS, activity log, manufacturing terms
Vision:   AI Manufacturing Copilot — engineer decides, AI accelerates
AI Spec:  docs/analisis-masalah-pabrik-AI_COPILOT.md (10 stages)
```

---

*Terakhir diperbarui: 2026-07-27 — untuk digunakan oleh Cursor Cloud Agent dan kontributor Buek Core.*
