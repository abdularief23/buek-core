# Setup GitHub Action untuk Buek Copilot

> Custom GPT **tidak bisa** git clone / SSH.  
> Yang dipakai: **GitHub REST API** + **Fine-grained PAT (read-only)** yang Anda simpan sebagai secret di GPT Builder.

```text
GitHub Repository (Source of Truth)
            │
            ▼
      GitHub REST API
            │
    PAT Read-only (milik Anda — secret di GPT)
            │
            ▼
      Buek Copilot (Actions)
            │
            ├── baca docs/*
            ├── baca PR / files / review comments
            ├── baca commit / compare branch
            ├── list tree / search code
            └── jawab berdasarkan isi repo terbaru
```

**Cursor** tetap mengubah kode.  
**Buek Copilot** selalu membaca dokumen/PR terbaru lewat Action.  
Anda **tidak perlu** upload ulang Knowledge setiap kali `docs/` berubah.

---

## 1) Buat Fine-grained Personal Access Token

1. Buka: https://github.com/settings/personal-access-tokens  
2. **Generate new token** → Fine-grained  
3. Settings yang disarankan:

| Field | Nilai |
|-------|--------|
| Token name | `buek-copilot-readonly` |
| Expiration | 30–90 hari (lalu rotate) |
| Resource owner | akun Anda (`abdularief23`) |
| Repository access | **Only select repositories** → `buek-core` |
| Permissions → Repository | |
| Contents | **Read-only** |
| Pull requests | **Read-only** |
| Metadata | **Read-only** (otomatis) |
| Issues | **Read-only** (opsional) |

4. Generate → **salin token sekali** → simpan di password manager  
5. **Jangan** kirim token ke Cursor, ke chat publik, atau commit ke repo

---

## 2) Pasang Action di GPT Builder

1. ChatGPT → **My GPTs** → Edit **Buek Copilot**  
2. **Actions** → Create  
3. **Import from OpenAPI schema** → paste isi:

   [`openapi-buek-copilot-github.yaml`](./openapi-buek-copilot-github.yaml)

4. **Authentication**
   - Authentication Type: **API Key**
   - API Key → **Bearer**
   - Masukkan PAT sebagai secret (field yang disediakan GPT Builder)
5. Setujui bahwa Action memanggil `api.github.com`  
6. **Update** / Save GPT

---

## 3) Update Instructions (wajib agar GPT memakai Action)

Pastikan Instructions memuat aturan:

- Default repo: `abdularief23/buek-core`
- Default branch: `main` (kecuali user sebut branch/PR)
- Untuk pertanyaan arsitektur: **panggil Action** `getContents` / `getGitTree` dulu
- File content dari API = **base64** → decode sebelum menjawab
- Jangan mengarang isi file jika Action gagal — laporkan error

Cuplikan siap pakai ada di [`INSTRUCTIONS.md`](./INSTRUCTIONS.md) (bagian GitHub Actions).

---

## 4) Tes kemampuan (prompt uji)

Map operasi lengkap: [`OPERATIONS.md`](./OPERATIONS.md) (`read_file`, `list_directory`, `get_pull_request`, …).

Jalankan satu per satu di chat **Buek Copilot** (bukan ChatGPT biasa):

| # | Prompt uji | Friendly op | Action |
|---|------------|-------------|--------|
| 1 | Baca `docs/architecture.md` di `main` dan jelaskan alur AI. | `read_file` | `getContents` |
| 2 | List file di `docs/mygpt/` | `list_directory` | `getContents` |
| 3 | List open PR di `buek-core` | — | `listPullRequests` |
| 4 | Review PR #56 (detail + files) | `get_pull_request` | `getPullRequest` + `listPullRequestFiles` |
| 5 | Apa 5 commit terakhir yang menyentuh `docs/`? | `list_commits` | `listCommits` |
| 6 | Bandingkan `main...cursor/cursor-mygpt-bridge-e866` | `compare_branches` | `compareCommits` |
| 7 | Ambil `docs/mygpt/HANDOFF_TEMPLATE.md` lalu cek HANDOFF yang saya paste | `read_file` | `getContents` |
| 8 | Cari di docs teks `WORKER_AUDIT` | `search_code` | `searchCode` |

**Lulus:** GPT menyebut bahwa isi diambil via Action/API, dan kutipan cocok dengan file.  
**Gagal:** GPT mengarang atau bilang “sudah baca” tanpa Action — perbaiki Instructions / auth.

Jika #1 gagal: cek PAT permission + Authentication Bearer + repo name.  
Jangan mengandalkan web browsing ke `raw.githubusercontent.com` sebagai pengganti Action.

---

## 5) Knowledge vs Action

| Mode | Kapan dipakai |
|------|----------------|
| **Action (utama)** | Jawaban harus up-to-date dari GitHub |
| **Knowledge (opsional)** | Fallback offline / ringkas prinsip jika Action rate-limit |

Upload Knowledge Tier A masih berguna sebagai cache konsep, tapi **Action menang** jika bertentangan dengan isi repo.

---

## 6) Keamanan

| Lakukan | Jangan |
|---------|--------|
| PAT fine-grained, satu repo | Classic PAT dengan `repo` penuh tanpa perlu |
| Contents/PR/Metadata read-only | Write / admin permissions |
| Expire & rotate token | Paste PAT ke Cursor / PR / Slack |
| Revoke token jika bocor | Commit token ke git |

---

## 7) Batasan yang perlu diketahui

1. Action **hanya** hidup di dalam Custom GPT yang Anda konfigurasi — bukan di semua chat ChatGPT.  
2. GPT **tidak** punya akses SSH / `git clone`.  
3. Response file besar bisa ter-truncate — minta path spesifik (`docs/...`).  
4. Code search kadang delay indexing / rate limit.  
5. Cursor tetap diperlukan untuk mengubah kode; Buek Copilot = architect/reviewer + pembaca repo.

---

## Endpoint yang tersedia (ringkas)

| operationId | Kegunaan |
|-------------|----------|
| `getContents` | Baca file / list folder |
| `getGitTree` | Peta file repo |
| `listBranches` | Daftar branch |
| `listCommits` / `getCommit` | Histori perubahan |
| `compareCommits` | Diff dua branch (`base...head`) |
| `listPullRequests` / `getPullRequest` | Baca PR |
| `listPullRequestFiles` | File berubah di PR |
| `listPullRequestReviewComments` | Komentar review |
| `listIssues` / `getIssue` | Issue |
| `searchCode` | Cari teks di repo |

Schema lengkap: [`openapi-buek-copilot-github.yaml`](./openapi-buek-copilot-github.yaml)
