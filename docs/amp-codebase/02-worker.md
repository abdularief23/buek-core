# AMP — `worker/index.ts`

> **Status:** ⏳ Menunggu source — template siap diisi  
> **Parent:** [`CODEBASE_GUIDE.md`](../analisis-masalah-pabrik-CODEBASE_GUIDE.md)

---

## Ringkasan file

| Metrik | Nilai |
|--------|-------|
| Total baris | _TBD_ |
| HTTP handlers | _TBD_ |
| Helper functions | _TBD_ |
| Raw SQL blocks | _TBD_ |
| AI calls | _TBD_ |
| Mapper functions | _TBD_ (`mapProblem`, …) |

---

## Endpoint index

| Method | Path | Handler | Auth | AI |
|--------|------|---------|------|-----|
| POST | `/api/problems` | `createProblem` | _TBD_ | _TBD_ |
| GET | `/api/problems/:id` | _TBD_ | _TBD_ | _TBD_ |
| _TBD_ | | | | |

---

## Helpers & utilities

### `json()` / `error()` / `body()` / `first()` / `all()`

**Purpose:** _TBD_

**Mengapa dibuat seperti ini:** _TBD_

**Saran service:** `lib/response.ts`

---

### `mapProblem()` / `mapAction()` / …

**Purpose:** _TBD_

**Field mapping (DB → API):** _TBD_

**Saran service:** `mappers/problem.mapper.ts`

---

### `ensureKaizen()`

**Purpose:** _TBD_

**Flow:** _TBD_

**Mengapa 8 step:** _TBD_

**Saran service:** `services/problem.service.ts`

---

## Business handlers (isi per fungsi)

---

### `createProblem()` — `POST /api/problems`

**Purpose:**  
Membuat Problem baru dan memulai lifecycle investigasi.

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
Trigger AI Similar Case
    ↓
Return Response
```

**Input:**  
_TBD — body JSON fields_

**Output:**  
_TBD — response shape_

**Tables touched:**  
`problems`, `problem_activities`, `kaizen_steps`, _TBD_

**Business rules enforced:**  
_TBD — atau list gap_

**AI involved:**  
_TBD — Stage 2? sync/async? endpoint terpisah?_

**Activity logged:**  
_TBD — event type string_

**Mengapa dibuat seperti ini:**  
_TBD_

**Trade-off:**  
_TBD — mis. Kaizen auto di create vs on-demand_

**Saran jika dipisah menjadi service:**  
```text
routes/problems.ts       → HTTP only
services/problem.service.ts → createProblem logic
repositories/problem.repo.ts → Drizzle insert
```

**WORKER_AUDIT cross-ref:** Audit 2, 8, 19, Deliverable A hook `problem.created`

---

### `updateProblem()` — _TBD_

**Purpose:** _TBD_

**Flow:** _TBD_

_(Salin blok `createProblem` untuk setiap handler — daftar di bawah)_

---

## Daftar handler yang wajib didokumentasikan

- [ ] `createProblem`
- [ ] `getProblem` / list problems
- [ ] `updateProblem` (status transitions!)
- [ ] `deleteProblem`
- [ ] `createRootCause`
- [ ] `updateRootCause` / delete
- [ ] `createCorrectiveAction`
- [ ] `updateCorrectiveAction`
- [ ] `ensureKaizen` / update kaizen step
- [ ] `logActivity` / activity helpers
- [ ] `getDashboard` / analytics
- [ ] `dailyProduction` CRUD
- [ ] `downtime` CRUD
- [ ] _AI handlers — jika ada_

---

## Bagian yang bisa dipisah menjadi service

| Blok kode (line range) | Target module | Prioritas | Alasan |
|------------------------|---------------|-----------|--------|
| _TBD_ | `services/problem.service.ts` | P0 | _TBD_ |
| _TBD_ | `services/dashboard.service.ts` | P1 | _TBD_ |
| _TBD_ | `services/ai/similar-case.service.ts` | P0 | Stage 2 |
| _TBD_ | `repositories/*.repo.ts` | P0 | Drizzle migration |

---

## Business rules (centralized view)

| Rule | Enforced di | Missing? |
|------|-------------|----------|
| Cannot close without verification | _TBD_ | _TBD_ |
| Multiple root causes allowed | _TBD_ | _TBD_ |
| Priority change authority | _TBD_ | _TBD_ |
| _TBD_ | | |

_Cross-ref WORKER_AUDIT Audit 11_

---

## AI entry points dalam worker

| Function | Stage | Pipeline stage (Audit 19) | Auto-write? |
|----------|-------|---------------------------|-------------|
| _TBD_ | _TBD_ | _TBD_ | _TBD_ |

_Lihat juga [`05-ai.md`](./05-ai.md)_
