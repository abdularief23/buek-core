# Sync Checklist — Cursor ↔ Buek Copilot

Dengan **GitHub Action** aktif, sync Knowledge jarang diperlukan. Fokus pada health check Action + alur HANDOFF.

---

## Setelah setup Action (sekali)

- [ ] PAT fine-grained: Contents/PR/Metadata read-only, hanya `buek-core`
- [ ] OpenAPI `openapi-buek-copilot-github.yaml` ter-import
- [ ] Auth Bearer secret terpasang (bukan di chat)
- [ ] Instructions versi terbaru (termasuk aturan Actions)
- [ ] Uji prompt #1–4 di [`GITHUB_ACTION_SETUP.md`](./GITHUB_ACTION_SETUP.md)

---

## Setiap sesi kerja (2 menit)

- [ ] Cursor selesai → minta **STATUS** block  
- [ ] Paste STATUS ke **Buek Copilot** (Custom GPT dengan Action)  
- [ ] Jika Copilot usulkan kerja baru → ambil **HANDOFF** → paste ke Cursor  
- [ ] Tidak perlu re-upload Knowledge

---

## Mingguan (opsional)

- [ ] Di Buek Copilot: “List open PR terkait docs/AMP”  
- [ ] Cek token expiration (GitHub settings)  
- [ ] Jika Instructions di repo berubah → re-paste ke GPT Builder  

---

## Bulanan

- [ ] Rotate / perpanjang PAT jika perlu  
- [ ] Bandingkan Instructions di GPT vs `docs/mygpt/INSTRUCTIONS.md`  
- [ ] Pastikan tidak ada Write permission pada token  

---

## Indikator sehat

| Gejala | Perbaikan |
|--------|-----------|
| Copilot mengarang isi file | Paksa: “panggil getContents dulu” |
| 401/403 dari Action | Cek PAT + Bearer auth |
| Jawaban usang meski Action ada | Instructions belum update — re-paste |
| ChatGPT biasa “tidak bisa baca repo” | Buka **Buek Copilot** (Custom GPT), bukan chat umum |
