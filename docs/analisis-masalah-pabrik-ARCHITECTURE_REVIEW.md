# Analisis Masalah Pabrik — Architecture Review

> **Status:** Review kode berdasarkan `src/db/schema.ts`, `migrations/`, dan `worker/index.ts`  
> **Tanggal:** 2026-07-27  
> **Konteks:** Lihat [`analisis-masalah-pabrik-PROJECT_CONTEXT.md`](./analisis-masalah-pabrik-PROJECT_CONTEXT.md) · [`analisis-masalah-pabrik-AI_COPILOT.md`](./analisis-masalah-pabrik-AI_COPILOT.md)

Dokumen ini mencatat temuan review arsitektur agar Cursor **tidak mengulang kesalahan** dan **tahu prioritas refactor** sebelum menambah fitur baru.

---

## Executive Summary

Proyek ini **bukan CRUD biasa** — sudah memodelkan incident management manufaktur dengan domain yang relatif bersih. Fondasi cukup baik untuk MVP.

**Fokus berikutnya bukan CRUD baru**, melainkan:

1. Normalisasi master data
2. Refactor worker ke layer terpisah
3. Migrasi SQL manual → Drizzle ORM
4. Fitur enterprise (RCA tree, CAPA, approval, attachment)
5. Persiapan multi-factory
6. **AI Copilot 10-stage** — [`AI_COPILOT.md`](./analisis-masalah-pabrik-AI_COPILOT.md) (bukan chatbot add-on)

---

## AI Copilot (bukan fitur tambahan)

AMP dirancang sebagai **AI Manufacturing Copilot**. Data schema (Problem, RCA, Production, Downtime, Kaizen) sudah siap sebagai bahan AI; yang kurang adalah orchestration layer dan trigger otomatis saat Problem dibuat.

| Prioritas AI | Stage | Catatan |
|--------------|-------|---------|
| **P0** | 2 Similar Problem Search | Fitur AI paling penting — trigger on `problem.created` |
| **P0** | 4 Root Cause Suggestion | Ranked causes, engineer picks |
| **P0** | 6 Corrective Action Rec. | Pre-fill actions, engineer confirms |
| P1 | 1, 3, 5, 8 | Understanding, investigation Q, knowledge, verification |
| P2 | 7, 9, 10 | Risk analysis, lesson learned, closed loop |

**Jangan** implementasi chatbot generik — ikuti spesifikasi lengkap di [`analisis-masalah-pabrik-AI_COPILOT.md`](./analisis-masalah-pabrik-AI_COPILOT.md).

**Buek Core partial:** `apps/api/src/services/investigation-copilot.ts` sudah punya similar cases, possible causes, countermeasures, SOP refs — reuse saat bridge.

---

## Architecture Scorecard

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| Database Design | **8.5/10** | Domain bersih, FK cascade benar |
| Naming Convention | **9/10** | `snake_case` konsisten (`occurred_at`, `target_date`) |
| Domain Modeling | **8.5/10** | 6 domain utama, tidak satu tabel raksasa |
| Worker Architecture | **7.5/10** | Helper bagus, tapi monolith |
| Maintainability | **7/10** | `worker/index.ts` akan gemuk |
| Scalability | **7/10** | Belum ada index strategis |
| Manufacturing Domain | **9/10** | Kaizen auto 8-step, workflow jelas |

---

## Yang Sudah Bagus (jangan rusak)

### 1. Domain model bersih

```
Problem
├── Root Cause
├── Corrective Action
├── Activity
├── Kaizen
├── Downtime
└── Daily Production (analitik terpisah)
```

Enam domain utama — mengikuti **manufacturing incident management**, bukan satu tabel `tickets`.

### 2. Foreign keys & cascade

- `problemId.references(() => problems.id)` di hampir semua child table
- Hapus Problem → Root Cause, Action, Activity, Kaizen ikut terhapus (cascade)
- **Keputusan benar** untuk integritas data

### 3. Naming konsisten

| Pola yang dipakai | Hindari |
|-------------------|---------|
| `occurred_at` | `tgl`, `tanggal` |
| `target_date` | `finishDate` |
| `completed_at` | campur camelCase/snake_case |
| `created_at`, `updated_at` | inkonsisten |

### 4. Migration bertahap

```
0001_initial
    ↓
0002_factory_problem_schema
    ↓
0003_quality_production_kaizen
```

- Tidak edit migration lama ✅
- Ada `CHECK` constraint di DB (`priority`, `status`, `category`) — validasi bukan hanya frontend ✅

### 5. Worker patterns yang baik

| Pattern | Fungsi |
|---------|--------|
| `json()`, `error()`, `body()`, `first()`, `all()` | DRY response helpers |
| `mapProblem()`, `mapAction()`, `mapProduction()`, `mapDowntime()` | Mapping layer — DB tidak langsung ke frontend |
| `ensureKaizen()` | Auto-create 8 Step Kaizen saat Problem dibuat |

### 6. Business flow sudah jelas

```
Problem → Investigation → Root Cause → Corrective Action → Kaizen → Close
```

Sudah dekat dengan workflow engineer nyata.

---

## Gap Analysis (prioritas perbaikan)

### P0 — Sebelum multi-factory / Buek Core merge

| # | Gap | Masalah | Solusi yang disarankan |
|---|-----|---------|------------------------|
| 1 | **Master data string** | `area`, `line_machine`, `category` sebagai `text()` — "Assembly" ≠ "ASSEMBLY" | Tabel `areas`, `lines`, `machines`, `problem_categories` + FK |
| 2 | **User sebagai string** | `reporter`, `assignee`, `pic` = text | Tabel `users`, `departments`, `roles` (auth nanti) |
| 3 | **Worker monolith** | Semua di `worker/index.ts` | Pecah ke `routes/`, `services/`, `repositories/`, `validators/` |
| 4 | **SQL manual vs Drizzle** | `SELECT/INSERT/UPDATE` raw padahal Drizzle ada | `db.select()`, `db.insert()`, `db.update()` — type-safe |

### P1 — Sebelum enterprise / 100k+ records

| # | Gap | Solusi |
|---|-----|--------|
| 5 | **Index kurang** | Index pada `problem_id`, `status`, `target_date` di semua tabel child |
| 6 | **Severity / FMEA** | Tambah `severity`, `occurrence`, `detection`, `rpn` (opsional per root cause) |
| 7 | **Root cause flat** | Recursive tree: `parent_id` di `root_causes` untuk Why-Why / fishbone |

### P2 — Enterprise features

| Fitur | Status | Prioritas Buek Core |
|-------|--------|---------------------|
| Why-Why Analysis | ❌ belum | Map ke `InvestigationStepper` step 1 |
| Fishbone (Ishikawa) | ❌ belum | UI + `root_causes` tree |
| CAPA formal | ⚠️ partial (corrective actions) | Link ke approval workflow |
| Approval workflow | ❌ belum | Ada di Buek Core (`Supervisor`) |
| Escalation | ❌ belum | Business rules engine |
| Verification | ⚠️ partial | Perlu evidence gate sebelum `closed` |
| Evidence / Photo | ❌ belum | `attachments` table + R2 storage |
| History / Version | ⚠️ partial (`activities`) | Richer audit trail |
| Attachment | ❌ belum | Cloudflare R2 |

### P3 — Platform scale

| # | Gap | Solusi |
|---|-----|--------|
| 8 | **Multi-factory** | Tabel `factories` / `plants` / `sites` — tambah sejak awal jika target platform |
| 9 | **Dashboard** | Pareto, trend, KPI — `daily_production` sudah siap sebagai sumber |

---

## Root Cause: Flat vs Tree

**Sekarang:**

```
Problem → Root Cause (flat list)
```

**Kenyaataan di pabrik:**

```
Problem
  └── Machine
        └── Bearing
              └── Lubrication
                    └── Operator error
```

**Rekomendasi schema (future migration):**

```typescript
export const rootCauses = sqliteTable("root_causes", {
  id: integer("id").primaryKey(),
  problemId: integer("problem_id").references(() => problems.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // self-reference untuk tree
  label: text("label").notNull(),
  category: text("category"), // man, machine, material, method, environment
  depth: integer("depth").default(0),
  // FMEA (optional)
  severity: integer("severity"),
  occurrence: integer("occurrence"),
  detection: integer("detection"),
  rpn: integer("rpn"),
  ...
});
```

---

## Worker Refactor Plan

**Sekarang:** satu file `worker/index.ts` berisi helper + endpoint + validation + mapping + business logic.

**Target struktur:**

```text
worker/
├── index.ts              # Entry — route dispatch only
├── lib/
│   ├── response.ts       # json(), error(), body()
│   └── db.ts             # Drizzle client init
├── validators/
│   ├── problem.ts
│   └── production.ts
├── repositories/
│   ├── problem.repo.ts   # Drizzle queries only
│   ├── root-cause.repo.ts
│   └── production.repo.ts
├── services/
│   ├── problem.service.ts    # Business logic + ensureKaizen()
│   ├── investigation.service.ts
│   └── dashboard.service.ts
├── mappers/
│   ├── problem.mapper.ts     # mapProblem(), mapAction()
│   └── production.mapper.ts
└── routes/
    ├── problems.ts
    ├── production.ts
    ├── downtime.ts
    └── dashboard.ts
```

**Aturan refactor:**

1. Jangan refactor besar sekaligus — pecah per domain (problems dulu)
2. Setiap PR: routes → service → repository untuk satu resource
3. Test manual setelah setiap pecahan
4. SQL manual diganti Drizzle per-repository, bukan sekaligus

---

## Master Data Normalization Plan

**Migration baru (jangan edit 0001–0003):**

```text
0004_master_data.sql
  - areas (id, name, factory_id)
  - lines (id, name, area_id)
  - machines (id, name, line_id, code)
  - problem_categories (id, name, code)

0005_problem_fk_master.sql
  - problems.area_id → areas.id
  - problems.line_id → lines.id
  - problems.machine_id → machines.id
  - problems.category_id → problem_categories.id
  - (keep old text columns nullable during migration, drop later)
```

**Multi-factory (jika target platform):**

```text
0006_factories.sql
  - factories (id, name, code, timezone)
  - areas.factory_id → factories.id
```

---

## Index Recommendations

Tambahkan di migration baru (contoh):

```sql
CREATE INDEX idx_root_causes_problem_id ON root_causes(problem_id);
CREATE INDEX idx_corrective_actions_problem_id ON corrective_actions(problem_id);
CREATE INDEX idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX idx_corrective_actions_target_date ON corrective_actions(target_date);
CREATE INDEX idx_problem_activities_problem_id ON problem_activities(problem_id);
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problems_occurred_at ON problems(occurred_at);
CREATE INDEX idx_daily_production_date ON daily_production(production_date);
```

---

## Drizzle Migration: SQL → ORM

**Anti-pattern (hindari):**

```typescript
await env.DB.prepare("SELECT * FROM problems WHERE id = ?").bind(id).first();
```

**Pattern yang diharapkan:**

```typescript
import { eq } from "drizzle-orm";
import { problems } from "#/db/schema";

const row = await db.select().from(problems).where(eq(problems.id, id)).get();
```

**Manfaat:** autocomplete, refactor-safe, schema drift terdeteksi di compile time.

---

## Integration dengan Buek Core (berdasarkan gap)

| Gap AMP | Sudah ada di Buek Core | Aksi integrasi |
|---------|------------------------|----------------|
| User/roles string | `User`, `Employee`, role homes | Port auth ke Buek Core API |
| Approval | `Supervisor` approval workflow | Reuse `handleApproveEngineeringAnalysis` |
| RCA tree | `InvestigationStepper` 5-step | Align AMP root cause tree |
| Activity log | `AgentAction` + `ActivityEvent` | Unified audit |
| AI suggestion | `investigation-copilot.ts` | Connect AMP problems ke copilot |
| Multi-tenant | `Company` + `Workspace` | `factories` → `Workspace` |
| Attachment | `knowledge-upload.ts` | Reuse upload pipeline |

**Strategi:** Jangan duplikasi fitur enterprise di AMP Cloudflare — **naikkan ke Buek Core** untuk auth, AI, approval, multi-tenant. AMP tetap fokus CRUD + workflow lokal sampai merge.

---

## Prioritized Backlog (untuk Cursor)

### Sprint A — Foundation hardening

- [ ] Pecah `worker/index.ts` → `routes/` + `services/` + `repositories/`
- [ ] Ganti SQL manual ke Drizzle di `problems` module dulu
- [ ] Tambah index migration `0004_indexes.sql`

### Sprint B — Master data

- [ ] Migration `areas`, `lines`, `machines`, `problem_categories`
- [ ] FK di `problems` + data migration dari text lama
- [ ] UI dropdown menggantikan free-text

### Sprint C — RCA depth

- [ ] `parent_id` di `root_causes` untuk tree
- [ ] Why-Why UI (5 whys)
- [ ] Optional FMEA fields (S/O/D/RPN)

### Sprint D — Enterprise

- [ ] `attachments` table + R2
- [ ] Verification gate sebelum `status = closed`
- [ ] Approval workflow (atau bridge ke Buek Core)

### Sprint E — Buek Core bridge

- [ ] API sync Problem ↔ Buek `Issue`
- [ ] Shared auth
- [ ] AI copilot Stages 1–10 via `investigation-copilot.ts` + Memory/Knowledge packages

### Sprint AI (parallel track — **setelah WORKER_AUDIT**)

Lihat [`analisis-masalah-pabrik-WORKER_AUDIT.md`](./analisis-masalah-pabrik-WORKER_AUDIT.md) (gate) lalu [`analisis-masalah-pabrik-AI_COPILOT.md`](./analisis-masalah-pabrik-AI_COPILOT.md) Sprint AI-1 s/d AI-4.

---

## Rules for Cursor When Editing AMP Code

1. **Jangan tambah CRUD baru** sebelum P0 backlog selesai
2. **Jangan edit migration 0001–0003** — buat migration baru
3. **Pertahankan naming `snake_case`** di DB, `camelCase` di TS mapper
4. **Setiap perubahan Problem** → catat di `problem_activities`
5. **Refactor incremental** — satu domain per PR
6. **Cek mapping layer** — jangan expose raw DB row ke frontend
7. **Baca PROJECT_CONTEXT.md** untuk visi Buek Core sebelum fitur besar
8. **Baca AI_COPILOT.md** sebelum menambah fitur AI — AI adalah copilot, bukan add-on
9. **Jangan mulai Sprint AI-1** sebelum Audit P0 di `WORKER_AUDIT.md` selesai (termasuk Knowledge Quality & Retrieval Readiness)

---

*Review ini melengkapi PROJECT_CONTEXT.md — gunakan keduanya bersama saat mengembangkan AMP.*
