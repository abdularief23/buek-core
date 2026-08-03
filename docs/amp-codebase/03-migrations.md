# AMP — `migrations/`

> **Status:** ⏳ Menunggu source  
> **Parent:** [`CODEBASE_GUIDE.md`](../analisis-masalah-pabrik-CODEBASE_GUIDE.md)

---

## Timeline evolusi

```text
0001_initial
    ↓
0002_factory_problem_schema
    ↓
0003_quality_production_kaizen
    ↓
(future) 0004_...
```

---

## Migration index

| File | Tanggal (jika ada) | Requirement yang dipenuhi | Breaking |
|------|-------------------|---------------------------|----------|
| `0001_*.sql` | _TBD_ | _TBD_ | _TBD_ |
| `0002_*.sql` | _TBD_ | _TBD_ | _TBD_ |
| `0003_*.sql` | _TBD_ | _TBD_ | _TBD_ |

---

## Per migration (template)

### `0001_initial.sql`

**When / why:**  
_TBD — setup awal Vantis template?_

**Changes:**
- Tabel dibuat: _TBD_
- Index: _TBD_
- CHECK: _TBD_

**Dampak terhadap sistem:**
- Worker: _TBD_
- UI: _TBD_
- AI: _TBD_

**Rollback risk:** _TBD_

---

### `0002_factory_problem_schema.sql`

**When / why:**  
_TBD — pivot ke domain manufacturing?_

**Changes:** _TBD_

**Perubahan requirement dari 0001:** _TBD_

**Dampak terhadap sistem:** _TBD_

---

### `0003_quality_production_kaizen.sql`

**When / why:**  
_TBD_

**Changes:** _TBD_

**Dampak terhadap sistem:** _TBD_

---

## CHECK constraints catalog

| Table | Constraint | Values | Business meaning |
|-------|------------|--------|------------------|
| _TBD_ | _TBD_ | _TBD_ | _TBD_ |

_AI harus menghormati constraint ini (Audit 11)._

---

## Index catalog

| Index | Table | Columns | Alasan | Cukup untuk FTS? |
|-------|-------|---------|--------|------------------|
| _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

_Cross-ref WORKER_AUDIT Audit 13_

---

## Migration yang direncanakan (belum ada)

| ID | Nama | Trigger | Ref |
|----|------|---------|-----|
| 0004 | indexes | ARCHITECTURE_REVIEW | performance |
| 0004 | master_data | Sprint B | areas, lines |
| 0005 | ai_insights | Sprint AI-1 | similar cases |
