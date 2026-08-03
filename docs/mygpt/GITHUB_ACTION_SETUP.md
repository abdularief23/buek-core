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
5. **Privacy policy** (field di bawah Action) — isi salah satu URL di bawah
6. Setujui bahwa Action memanggil `api.github.com`  
7. **Update** / Save GPT

### Privacy Policy URL (untuk field konfigurasi)

| Kapan | URL yang dimasukkan |
|-------|---------------------|
| **Direkomendasikan (setelah deploy web)** | `https://core.buekwebsite.com/privacy-buek-copilot.html` |
| **Sementara / selalu valid (GitHub API)** | `https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement` |
| **Fallback dari repo (HTML di GitHub)** | `https://github.com/abdularief23/buek-core/blob/main/apps/web/public/privacy-buek-copilot.html` |

OpenAI mewajibkan URL privacy policy publik untuk Action. Karena Action hanya memanggil GitHub API, URL kebijakan GitHub selalu diterima. Setelah `privacy-buek-copilot.html` ter-deploy ke `core.buekwebsite.com`, gunakan URL Buek itu agar kebijakan spesifik Buek Copilot.

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

## 4) Tes penerimaan (wajib — 5 skenario)

Map operasi: [`OPERATIONS.md`](./OPERATIONS.md).  
Jalankan di **Buek Copilot** (Custom GPT + Action), bukan ChatGPT biasa.

| # | Skenario | Prompt | Operation |
|---|----------|--------|-----------|
| 1 | Read file | Baca `docs/architecture.md` via Action. | `getContents` |
| 2 | List directory | Tampilkan isi folder `docs/mygpt`. | `getContents` |
| 3 | Compare | Bandingkan `main...cursor/buek-copilot-operations-map-e866` (atau branch lain). | `compareCommits` |
| 4 | PR review | Ringkas PR #57. | `getPullRequest` + `listPullRequestFiles` |
| 5 | Code search | Cari semua referensi `HANDOFF_TEMPLATE`. | `searchCode` |

**Lulus (semua 5):** jawaban via Action/API; kutipan cocok; tidak mengandalkan web.  
**Gagal:** mengarang / “sudah baca” tanpa Action → perbaiki Instructions / auth.

### Tes transparansi fallback

| # | Prompt / kondisi | Perilaku yang diharapkan |
|---|------------------|--------------------------|
| 6 | Matikan sementara Action / pakai token invalid, lalu minta baca `docs/architecture.md` | GPT bilang **pembacaan repo gagal**; **tidak** diam-diam pakai Knowledge; minta izin atau pakai Knowledge dengan disclaimer usang |

Jika #1 gagal: cek PAT + Bearer + repo name.  
Jangan andalkan web browse `raw.githubusercontent.com` sebagai pengganti Action.

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
