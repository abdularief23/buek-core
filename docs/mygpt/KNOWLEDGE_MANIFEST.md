# MyGPT Knowledge Manifest (opsional)

> **Utama:** GitHub Action — lihat [`GITHUB_ACTION_SETUP.md`](./GITHUB_ACTION_SETUP.md)  
> **Knowledge:** fallback / bootstrap jika Action rate-limit atau sedang di-setup

Dengan Action aktif, Anda **tidak wajib** upload ulang setiap kali `docs/` berubah.

---

## Kapan masih berguna upload Knowledge

- Setup awal sebelum PAT siap  
- Cadangan jika `searchCode` / API error  
- Prinsip singkat yang jarang berubah (boleh 3–5 file saja)

---

## Tier A — Bootstrap minimal (jika ingin Knowledge)

| # | File |
|---|------|
| 1 | `docs/cursor-mygpt-bridge.md` |
| 2 | `docs/mygpt/HANDOFF_TEMPLATE.md` |
| 3 | `docs/analisis-masalah-pabrik-PROJECT_CONTEXT.md` |
| 4 | `docs/architecture.md` |

Jangan upload secret. Jangan upload seluruh codebase.

---

## Prioritas sumber

```text
GitHub Action (terbaru)  >  STATUS Cursor  >  Knowledge upload
```

---

## Sync

Jika Action sudah jalan: sync Knowledge **bulanan** atau saat Instructions berubah saja.  
Lihat [`SYNC_CHECKLIST.md`](./SYNC_CHECKLIST.md).
