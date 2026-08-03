# AMP — `src/routes/` & UI flow

> **Status:** ⏳ Menunggu source  
> **Parent:** [`CODEBASE_GUIDE.md`](../analisis-masalah-pabrik-CODEBASE_GUIDE.md)

---

## Alur engineer (end-to-end)

```text
Login / Landing
    ↓
Dashboard
    ↓
Buat Problem baru
    ↓
Detail Problem — investigasi
    ↓
Tambah Root Cause
    ↓
Tambah Corrective Action
    ↓
Update Kaizen / follow-up
    ↓
Verification
    ↓
Close Problem
```

_Isi route aktual per langkah setelah baca `src/routes/`._

---

## Route index

| Path (UI) | File | Actor | Backend API | AI UI |
|-----------|------|-------|-------------|-------|
| `/` | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| `/problems` | _TBD_ | Engineer | GET /api/problems | _TBD_ |
| `/problems/new` | _TBD_ | Engineer | POST /api/problems | _TBD_ |
| `/problems/:id` | _TBD_ | Engineer | GET/PUT … | _TBD_ |
| _TBD_ | | | | |

---

## Per halaman (template)

### `/problems/new` — Buat Problem

**Actor:** Engineer (atau Operator)

**Goal:** Mencatat masalah produksi baru dengan konteks area/line/machine

**Form fields:** _TBD — map ke schema_

**Backend calls:**
- `POST /api/problems` → `createProblem()`

**State setelah sukses:** redirect ke `/problems/:id`

**AI surface:**
- _TBD — banner similar case setelah create? panel kosong?_

**Mengapa UX seperti ini:** _TBD_

**Kaitan WORKER_AUDIT:** Audit 8 event `problem.created`, Audit 15 HITL

---

### `/problems/:id` — Detail & investigasi

**Actor:** Engineer

**Goal:** _TBD_

**Tabs / sections:** Root Cause, Actions, Kaizen, Activity, _AI panel?_

**Backend calls:** _TBD_

**Status transitions di UI:** open → in_progress → closed

**AI surface:** _TBD_

---

## Dashboard & analitik

### `/dashboard` (atau setara)

**Goal:** _TBD_

**Backend:** _TBD_

**Data sources:** problems, daily_production, downtime

---

## Komponen AI di UI (inventory)

| Komponen | File | Halaman | Stage AI | HITL? |
|----------|------|---------|----------|-------|
| _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

---

## Engineer journey vs AI_COPILOT stages

| Tahap user | Route | AI Stage aktif | Trigger |
|------------|-------|----------------|---------|
| Create problem | _TBD_ | 1–2 | on mount / on create response |
| Start investigation | _TBD_ | 3 | status → in_progress |
| Pick root cause | _TBD_ | 4, 6 | _TBD_ |
| Close | _TBD_ | 8–9 | _TBD_ |
