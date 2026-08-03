# Cursor ↔ Buek Copilot Bridge — Setup & Pembagian Tugas

> **Status:** Siap dipakai (Phase 2 GitHub Action = jalur utama)  
> **Pemilik:** Abdul Arief  
> **Tujuan:** Cursor (executor) dan Buek Copilot (architect/reviewer) membaca **sumber yang sama** di GitHub

---

## Realita teknis

| Bisa | Tidak bisa |
|------|------------|
| Custom GPT Action → GitHub REST API | Custom GPT `git clone` / SSH |
| PAT read-only sebagai secret di GPT Builder | Cursor/Chat menyimpan PAT Anda secara permanen |
| Baca docs, PR, commit, compare branch setiap pertanyaan | Write/merge dari dalam ChatGPT Action (kita sengaja tidak expose) |

```text
GitHub Repository (Source of Truth)
            │
            ▼
      GitHub REST API
            │
    PAT Read-only (secret di GPT Builder — milik Anda)
            │
     ┌──────┴──────┐
     ▼             ▼
 Cursor         Buek Copilot
 (ubah kode)    (Action baca repo)
     │             │
     └──────┬──────┘
            ▼
         Anda (Abdul)
      keputusan + HANDOFF
```

---

## Pembagian tugas

| Area | **Buek Copilot** | **Cursor** | **Anda** |
|------|------------------|------------|----------|
| Baca docs/PR terbaru dari GitHub | ✅ Action | ✅ native | — |
| Visi / domain / AI architecture | ✅ Utama | Update docs sesuai HANDOFF | Approve |
| Ubah kode, migration, PR | ❌ | ✅ Utama | Review |
| HANDOFF spec | ✅ hasilkan | Eksekusi | Paste antar tool |
| STATUS implementasi | Review | ✅ hasilkan | Paste ke Copilot |
| PAT / secrets | Hanya di GPT Builder | Env lokal/VPS | Kelola & rotate |
| Upload Knowledge manual | Opsional fallback | — | Jarang (Action utama) |

### Satu kalimat

- **Buek Copilot** = architect/reviewer yang selalu bisa tarik repo terbaru  
- **Cursor** = executor kode  
- **GitHub** = source of truth  
- **Anda** = keputusan & jembatan HANDOFF/STATUS  

---

## Setup yang perlu Anda siapkan

### A) Fine-grained PAT (wajib untuk Action)

| Setting | Nilai |
|---------|--------|
| Repository | `buek-core` saja |
| Contents | Read |
| Pull requests | Read |
| Metadata | Read |
| Issues | Read (opsional) |

**Jangan kirim PAT ke Cursor atau ke chat ini.**  
Panduan lengkap: [`mygpt/GITHUB_ACTION_SETUP.md`](./mygpt/GITHUB_ACTION_SETUP.md)

### B) Custom GPT “Buek Copilot”

1. Paste Instructions: [`mygpt/INSTRUCTIONS.md`](./mygpt/INSTRUCTIONS.md)  
2. Actions → Import: [`mygpt/openapi-buek-copilot-github.yaml`](./mygpt/openapi-buek-copilot-github.yaml)  
3. Auth = Bearer + PAT (secret)  
4. (Opsional) Knowledge Tier A sebagai fallback — [`mygpt/KNOWLEDGE_MANIFEST.md`](./mygpt/KNOWLEDGE_MANIFEST.md)  
5. Tes dengan prompt di GITHUB_ACTION_SETUP.md  

### C) Alur kerja

```text
Cursor mengubah kode / docs → push GitHub
        │
        ▼
Anda tanya Buek Copilot → Action baca GitHub terbaru
        │
        ▼
Copilot: review / HANDOFF
        │
        ▼
Anda paste HANDOFF → Cursor
```

Knowledge **tidak perlu** di-upload ulang setiap perubahan docs jika Action sudah jalan.

---

## Kemampuan Buek Copilot (via Action)

Contoh pertanyaan yang didukung:

- "Baca `docs/architecture.md` dan jelaskan alur AI."
- "Bandingkan PR #55 dengan architecture."
- "Apakah HANDOFF ini sesuai template di repo?"
- "Apa perubahan sejak commit terakhir di `docs/`?"
- "Ringkas semua perubahan di `docs/mygpt/`."
- "Compare `main...cursor/cursor-mygpt-bridge-e866`."

Endpoint: lihat OpenAPI (`getContents`, `listPullRequests`, `compareCommits`, dll.).

---

## File di repo

| File | Fungsi |
|------|--------|
| [`cursor-mygpt-bridge.md`](./cursor-mygpt-bridge.md) | Dokumen ini |
| [`mygpt/GITHUB_ACTION_SETUP.md`](./mygpt/GITHUB_ACTION_SETUP.md) | Setup PAT + Action + tes |
| [`mygpt/OPERATIONS.md`](./mygpt/OPERATIONS.md) | Map `read_file` → Action + aturan kejujuran |
| [`mygpt/openapi-buek-copilot-github.yaml`](./mygpt/openapi-buek-copilot-github.yaml) | OpenAPI Action (utama) |
| [`mygpt/INSTRUCTIONS.md`](./mygpt/INSTRUCTIONS.md) | Instructions GPT |
| [`mygpt/HANDOFF_TEMPLATE.md`](./mygpt/HANDOFF_TEMPLATE.md) | Template tukar info |
| [`mygpt/KNOWLEDGE_MANIFEST.md`](./mygpt/KNOWLEDGE_MANIFEST.md) | Knowledge opsional |
| [`mygpt/FIRST_MESSAGE.md`](./mygpt/FIRST_MESSAGE.md) | Pesan pertama setelah setup |
| [`mygpt/SYNC_CHECKLIST.md`](./mygpt/SYNC_CHECKLIST.md) | Health check (lebih ringan jika Action aktif) |

---

## Batasan yang perlu diingat

1. Action hanya aktif di **Custom GPT** yang Anda konfigurasi — bukan di ChatGPT umum.  
2. Buek Copilot **tidak otomatis ingat** repo di semua percakapan lain.  
3. Cursor/Chat di sini **tidak menyimpan** kredensial GitHub Anda.  
4. Jangan beri permission Write pada PAT.  

---

*Bridge ini membuat Cursor dan Buek Copilot bekerja dari GitHub yang sama tanpa upload dokumen berulang.*
