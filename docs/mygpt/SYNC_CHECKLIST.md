# Sync Checklist — Cursor ↔ MyGPT

Jalankan setelah kerja docs/kode penting, atau **mingguan** (mis. setiap Senin).

---

## Mingguan (5–10 menit)

- [ ] `git pull` di `main` (atau cek GitHub)
- [ ] Ada PR docs baru yang sudah merge? → download file Knowledge terbaru
- [ ] Replace file di Custom GPT Knowledge (Tier A + Tier B)
- [ ] Kirim ke MyGPT blok `KNOWLEDGE SYNC` dari [`HANDOFF_TEMPLATE.md`](./HANDOFF_TEMPLATE.md)
- [ ] Tanya MyGPT: “Apa 3 perubahan paling penting sejak sync terakhir?”
- [ ] Jika MyGPT mengusulkan fitur baru → buat HANDOFF → Cursor (jangan implement di chat saja)

---

## Setelah sesi Cursor selesai

- [ ] Cursor kasih STATUS block
- [ ] Paste STATUS ke MyGPT
- [ ] MyGPT review → HANDOFF berikutnya atau “tidak ada aksi”
- [ ] Jika docs berubah di PR → tandai untuk sync Knowledge

---

## Setelah sesi MyGPT selesai (desain besar)

- [ ] Ada HANDOFF → Cursor?
- [ ] Paste HANDOFF ke Cursor Cloud / Cursor IDE
- [ ] Jangan biarkan keputusan besar hanya di chat MyGPT tanpa update `docs/`

---

## Health check (bulanan)

- [ ] Instructions MyGPT masih selaras dengan `docs/mygpt/INSTRUCTIONS.md` di repo
- [ ] Tidak ada secret di Knowledge
- [ ] Custom GPT ID tercatat di note pribadi
- [ ] Phase 2 Actions (jika aktif): token GitHub masih valid & read-only

---

## Indikator bridge sehat

| Gejala | Artinya | Perbaikan |
|--------|---------|-----------|
| MyGPT bilang fitur “sudah ada” tapi Cursor bilang belum | Knowledge usang | Sync Knowledge + STATUS |
| Cursor mengubah visi domain sendiri | Bridge dilanggar | MyGPT + DECISION dulu |
| Dua versi arsitektur berbeda | Docs tidak jadi SoT | Update `docs/`, re-upload |
| Chat MyGPT penuh detail kode | Salah peran | Pindah ke Cursor + Codebase Guide |
