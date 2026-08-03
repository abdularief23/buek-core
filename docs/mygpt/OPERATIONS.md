# Buek Copilot — Operations Map

> Target: Buek Copilot = partner kedua (architect/reviewer/fallback), **bukan** GPT yang mengarang isi repo.  
> Akses repo = **GitHub Action API**, bukan web search / Knowledge statis.

---

## Prioritas sumber (kontrak perilaku)

| Prioritas | Sumber | Dipakai untuk |
|-----------|--------|---------------|
| 1 | **GitHub Action (live)** | Dokumen & status repo yang berubah |
| 2 | **Knowledge** | Prinsip, domain, glossary (stabil) |
| 3 | **Web** | Fallback jika diperlukan — bukan pengganti Action untuk isi repo |
| 4 | **Jawaban internal** | Hanya jika 1–3 tidak ada — wajib label **asumsi** |

## Prinsip kejujuran (wajib)

| Situasi | Yang harus dikatakan |
|---------|----------------------|
| Action berhasil | “Saya baca `path` via GitHub API (ref=…).” |
| Action gagal | “Pembacaan repository gagal (operation …). Saya **belum** membaca isi live.” |
| Mau pakai Knowledge setelah gagal | Minta izin / nyatakan: “ini dari Knowledge — mungkin bukan kondisi repo terbaru.” |
| Web browse gagal / tidak relevan | Jangan klaim sudah baca repo. Arahkan ke Action. |
| Knowledge vs Action | **Action menang** untuk isi yang berubah. |

**Jangan** silent fallback Knowledge → kesan palsu “sudah baca repo”.  
**Jangan** bilang “sudah membaca X” jika isi belum benar-benar diambil.

---

## Pemilihan operation (paling spesifik menang)

| Kemampuan | Operation | Digunakan untuk |
|-----------|-----------|-----------------|
| Read file | `getContents` | Membaca dokumen (path diketahui) |
| List folder | `getContents` | Enumerasi direktori |
| Search code | `searchCode` | Mencari simbol/teks (path **tidak** diketahui) |
| Read PR | `getPullRequest` | Review PR |
| PR files | `listPullRequestFiles` | Melihat perubahan file di PR |
| Compare | `compareCommits` | Review perubahan antar branch (`base...head`) |
| Commit | `getCommit` | Audit commit |

Aturan: jika lokasi file sudah diketahui → **`getContents`**, bukan `searchCode`.

---

## Alur yang benar

```text
Anda: "Baca docs/architecture.md"
        │
        ▼
Buek Copilot → Action getContents(path, ref=main)
        │
        ▼
Decode base64 → analisis isi terbaru → jawab
```

Bukan: mengandalkan pencarian web GitHub atau Knowledge yang di-upload minggu lalu.

---

## Friendly operations → OpenAPI `operationId`

Ini “API mental” yang Anda inginkan. Map ke Action yang sudah ada di [`openapi-buek-copilot-github.yaml`](./openapi-buek-copilot-github.yaml).

| Friendly op | Action `operationId` | Argumen utama | Catatan |
|-------------|----------------------|---------------|---------|
| `read_file(path)` | `getContents` | `path`, `ref` (default `main`) | File → decode `content` base64 |
| `list_directory(path)` | `getContents` | `path` = folder | Response = array entries |
| `list_tree(ref?)` | `getGitTree` | `tree_sha=main`, `recursive=1` | Peta file penuh |
| `search_code(query)` | `searchCode` | `q=repo:abdularief23/buek-core …` | Bisa rate-limit |
| `get_pull_request(number)` | `getPullRequest` | `pull_number` | Detail PR |
| `list_pr_files(number)` | `listPullRequestFiles` | `pull_number` | File berubah + patch |
| `list_pr_comments(number)` | `listPullRequestReviewComments` | `pull_number` | Review comments |
| `list_pull_requests(state?)` | `listPullRequests` | `state=open\|closed\|all` | |
| `compare_branches(base, head)` | `compareCommits` | `basehead=base...head` | **Tiga titik** `...` |
| `get_commit(sha)` | `getCommit` | `ref` = sha | Termasuk files[] |
| `list_commits(path?, sha?)` | `listCommits` | `path=docs/`, `sha=main` | |
| `list_branches()` | `listBranches` | | |
| `get_issue(number)` | `getIssue` | `issue_number` | Opsional |

Default: `owner=abdularief23`, `repo=buek-core`.

---

## Contoh pemanggilan (untuk Instructions / tes)

### read_file
```text
User: Baca docs/architecture.md
→ getContents(owner, repo, path=docs/architecture.md, ref=main)
→ decode content → ringkas
```

### list_directory
```text
User: Apa isi docs/mygpt/?
→ getContents(path=docs/mygpt, ref=main)
```

### get_pull_request + files
```text
User: Review PR #56
→ getPullRequest(56)
→ listPullRequestFiles(56)
→ getContents untuk file docs yang berubah (jika perlu)
```

### compare_branches
```text
User: Bandingkan main dengan cursor/foo-e866
→ compareCommits(basehead=main...cursor/foo-e866)
```

### search_code
```text
User: Cari HANDOFF di docs
→ searchCode(q=repo:abdularief23/buek-core path:docs HANDOFF)
```

---

## Pembagian dengan Cursor

| | Buek Copilot | Cursor |
|--|--------------|--------|
| Baca repo terbaru | ✅ Action | ✅ workspace |
| Arsitektur, review, audit, keputusan desain | ✅ | Dukung via docs |
| Implementasi & coding | ❌ | ✅ |
| Fallback saat Cursor offline | ✅ baca GitHub + HANDOFF | — |

---

## Checklist penerimaan (setelah Action aktif)

Kelima skenario harus **sukses via Action**, tanpa mengandalkan web:

| # | Skenario | Prompt uji | Operation |
|---|----------|------------|-----------|
| 1 | Read file | Baca `docs/architecture.md` via Action. | `getContents` |
| 2 | List directory | Tampilkan isi folder `docs/mygpt`. | `getContents` |
| 3 | Compare | Bandingkan `main...` *(branch fitur)*. | `compareCommits` |
| 4 | PR review | Ringkas PR #57. | `getPullRequest` + `listPullRequestFiles` |
| 5 | Code search | Cari semua referensi `HANDOFF_TEMPLATE`. | `searchCode` |

Tambahan perilaku:

- [ ] Saat Action sengaja digagalkan / error: GPT **menjelaskan gagal**, tidak diam-diam pakai Knowledge  
- [ ] Instructions di GPT Builder = versi terbaru dari repo  

Setup: [`GITHUB_ACTION_SETUP.md`](./GITHUB_ACTION_SETUP.md)
