# Buek Copilot — Operations Map

> Target: Buek Copilot = partner kedua (architect/reviewer/fallback), **bukan** GPT yang mengarang isi repo.  
> Akses repo = **GitHub Action API**, bukan web search / Knowledge statis.

---

## Prinsip kejujuran (wajib)

| Situasi | Yang harus dikatakan |
|---------|----------------------|
| Action berhasil | “Saya baca `path` via GitHub API (ref=…).” |
| Action gagal | “Belum berhasil mengambil file — error … . Tidak akan mengarang isi.” |
| Web browse gagal / tidak relevan | Jangan klaim sudah baca repo. Arahkan ke Action. |
| Knowledge usang vs Action | **Action menang.** |

Jangan pernah bilang “sudah membaca X” jika isi file belum benar-benar diambil.

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

## Checklist “Action aktif”

Buek Copilot baru dianggap siap fallback Cursor jika:

- [ ] OpenAPI ter-import  
- [ ] PAT Bearer secret terpasang (read-only)  
- [ ] `read_file("docs/architecture.md")` berhasil (via Action, bukan web)  
- [ ] `list_directory("docs/mygpt")` berhasil  
- [ ] `get_pull_request(N)` berhasil untuk satu PR  
- [ ] Instructions memuat map operasi ini + aturan kejujuran  

Setup: [`GITHUB_ACTION_SETUP.md`](./GITHUB_ACTION_SETUP.md)
