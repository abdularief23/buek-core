# MyGPT Knowledge Manifest

Upload file-file ini ke **Configure → Knowledge** pada Custom GPT.  
Prioritaskan yang **sudah ada di `main`**, lalu tambahkan dari PR #54 setelah merge.

**Batas ChatGPT:** biasanya ~20 file knowledge; pilih yang paling penting dulu.

---

## Tier A — Upload dulu (wajib)

| # | File di repo | Catatan |
|---|--------------|---------|
| 1 | `docs/analisis-masalah-pabrik-PROJECT_CONTEXT.md` | Otak produk AMP (ada di `main`) |
| 2 | `docs/architecture.md` | Arsitektur Buek Core |
| 3 | `docs/cursor-mygpt-bridge.md` | Cara kerja Cursor ↔ MyGPT |
| 4 | `docs/mygpt/HANDOFF_TEMPLATE.md` | Format tukar info |
| 5 | `README.md` | Overview repo |

---

## Tier B — Setelah PR #54 merge (sangat direkomendasikan)

| # | File | Catatan |
|---|------|---------|
| 6 | `docs/analisis-masalah-pabrik-ARCHITECTURE_REVIEW.md` | Scorecard + gap |
| 7 | `docs/analisis-masalah-pabrik-AI_COPILOT.md` | 10-stage AI |
| 8 | `docs/analisis-masalah-pabrik-WORKER_AUDIT.md` | 22 audit gate |
| 9 | `docs/analisis-masalah-pabrik-CODEBASE_GUIDE.md` | Semantic layer |
| 10 | `docs/amp-codebase/02-worker.md` | Template worker (setelah diisi, lebih berharga) |

Opsional jika masih ada slot:

| # | File |
|---|------|
| 11 | `docs/amp-codebase/01-schema.md` |
| 12 | `docs/amp-codebase/05-ai.md` |
| 13 | `docs/galuxium-executive-summary.md` |
| 14 | `docs/deployment.md` |

---

## Cara download dari GitHub

### Dari `main` (browser)

```text
https://github.com/abdularief23/buek-core/blob/main/docs/<nama-file>
→ Raw → Save As
```

### Dari branch PR #54 (sebelum merge)

```text
https://github.com/abdularief23/buek-core/blob/cursor/amp-architecture-review-e866/docs/<nama-file>
```

### CLI

```bash
git clone https://github.com/abdularief23/buek-core.git
cd buek-core
# Tier A
# Setelah merge PR #54, atau:
git checkout cursor/amp-architecture-review-e866
```

Lalu upload file `.md` ke Knowledge GPT.

---

## Jangan di-upload

| File / jenis | Alasan |
|--------------|--------|
| `.env`, API keys | Secret |
| `pnpm-lock.yaml`, `node_modules` | Tidak relevan / terlalu besar |
| Database dumps | Privasi / ukuran |
| Kode penuh `worker/index.ts` (sampai Codebase Guide terisi) | Lebih baik ringkasan semantic di `amp-codebase/` |
| Screenshot berisi credential | Secret |

---

## Sync rule

Setelah merge PR yang mengubah `docs/` penting:

1. Download versi terbaru  
2. Hapus file lama di Knowledge GPT (atau replace)  
3. Upload ulang  
4. Chat ke MyGPT: “Knowledge baru di-upload — ringkas perubahan utama”

Lihat juga [`SYNC_CHECKLIST.md`](./SYNC_CHECKLIST.md).
