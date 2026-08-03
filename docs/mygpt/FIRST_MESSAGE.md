# Pesan pertama ke Buek Copilot (setelah Action terpasang)

Kirim di chat **Custom GPT Buek Copilot** (bukan ChatGPT umum):

---

```text
Saya Abdul Arief, founder Buek Core.

Repo: abdularief23/buek-core
Live: https://core.buekwebsite.com

Peran:
- Kamu (Buek Copilot) = architect/reviewer — baca GitHub via Action
- Cursor = executor kode
- docs/ + kode di GitHub = source of truth
- Saya = keputusan akhir + HANDOFF/STATUS

Custom GPT ID: g-______________

Konfirmasi dengan Action (jangan mengarang):
1) Panggil getContents untuk docs/architecture.md (ref=main), decode base64, ringkas alur AI dalam 5 bullet
2) listPullRequests (state=open) — sebutkan PR terkait docs/bridge jika ada
3) Konfirmasi kamu siap format HANDOFF → CURSOR dan STATUS ← CURSOR

Jangan minta PAT di chat. Auth hanya di GPT Builder.
```

---

## Uji lanjutan

```text
Bandingkan PR #55 dengan docs/architecture.md — apakah bridge Cursor↔MyGPT sudah tercermin di architecture?
```

```text
Ambil docs/mygpt/HANDOFF_TEMPLATE.md lalu cek apakah HANDOFF berikut sesuai template:
=== HANDOFF → CURSOR ===
Goal: contoh
=== END HANDOFF ===
```
