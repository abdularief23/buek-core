# Handoff Templates — Cursor ↔ MyGPT

Salin blok yang relevan. Jangan ubah nama header `=== ... ===` agar mudah diparse.

---

## 1) MyGPT → Cursor (minta eksekusi)

```text
=== HANDOFF → CURSOR ===
Goal:
(satu kalimat hasil yang diinginkan)

Context:
(keputusan domain / arsitektur yang sudah disetujui Abdul)

Files / docs to touch:
- path/1
- path/2

Acceptance criteria:
- [ ] ...
- [ ] ...

Out of scope:
- ...

Priority: P0 | P1 | P2
Related docs:
- docs/...
=== END HANDOFF ===
```

**Cara pakai di Cursor:**  
> “Kerjakan HANDOFF berikut. Commit & push. Balas dengan STATUS.”

---

## 2) Cursor → MyGPT (laporan selesai / progress)

```text
=== STATUS ← CURSOR ===
Done:
- ...

Changed files:
- path (added|modified|deleted)

Docs updated:
- docs/...

Open questions:
- ...

Blocked by:
- (none | butuh keputusan domain | butuh source AMP | ...)

Next suggested step:
- ...

PR / branch:
- branch: cursor/...
- PR: https://github.com/...
=== END STATUS ===
```

**Cara pakai di MyGPT:**  
> “Review STATUS dari Cursor. Apakah selaras dengan arsitektur? Buat HANDOFF berikutnya jika perlu.”

---

## 3) Abdul → keduanya (keputusan produk)

```text
=== DECISION ===
Topic:
Decision:
Effective: immediately | after PR merge | after AMP import
Impacts:
- MyGPT: update framing / Knowledge
- Cursor: update docs/code
Owner follow-up: Abdul
=== END DECISION ===
```

---

## 4) Knowledge sync notice

```text
=== KNOWLEDGE SYNC ===
Uploaded / replaced:
- file1.md
- file2.md
Date: YYYY-MM-DD
Please acknowledge and list any contradictions with prior chat memory.
=== END KNOWLEDGE SYNC ===
```

---

## Contoh singkat

### Handoff contoh

```text
=== HANDOFF → CURSOR ===
Goal: Merge dokumentasi AMP architecture + AI copilot ke main, lalu siapkan knowledge pack list untuk MyGPT.
Context: Abdul setuju AI adalah copilot; Sprint AI-1 diblokir sampai Worker Audit P0.
Files / docs to touch:
- docs/analisis-masalah-pabrik-*
- docs/amp-codebase/*
Acceptance criteria:
- [ ] PR siap merge atau sudah di-update
- [ ] KNOWLEDGE_MANIFEST mencerminkan file yang ada
Out of scope: implementasi AI di worker
Priority: P1
=== END HANDOFF ===
```
