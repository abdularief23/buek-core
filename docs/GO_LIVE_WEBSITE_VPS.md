# Go-Live — Website Bisnis + VPS Storefront

## Fase yang disarankan

| Fase | Isi | Butuh dari Anda |
|------|-----|-----------------|
| **A — Live sekarang** | Halaman pilih paket VPS + domain di `core.buekwebsite.com` | Merge PR #60 + SSH VPS |
| **B — Toko di buekwebsite.com** | Integrasi ke site Next.js publik | Repo URL / akses GitHub site |
| **C — Bayar** | Sumopod Pay (QRIS/IDR) | `SUMOPOD_API_KEY` (+ webhook secret) |
| **D — Provision otomatis** | Buat CVM Tencent setelah bayar | API credentials Tencent/Sumopod + aturan produk |
| **E — Penilai** | GPT skor website setelah online | `OPENAI_API_KEY` |

## Checklist Fase A (Cursor kerjakan setelah secret + merge)

- [ ] PR #60 merged ke `main`
- [ ] Secret `VPS_SSH_*` tersedia di environment
- [ ] SSH ke VPS berhasil
- [ ] `git pull` + `./scripts/deploy.sh` (atau sync `public/buek-website-vps.html`)
- [ ] URL hidup: https://core.buekwebsite.com/buek-website-vps.html
- [ ] Link dari `buekwebsite.com` (opsional Fase B)

## Secret — jangan paste di chat

| Nama | Wajib Fase A? |
|------|----------------|
| `VPS_SSH_HOST` | Ya |
| `VPS_SSH_USER` | Ya |
| `VPS_SSH_PRIVATE_KEY` | Ya |
| `SUMOPOD_API_KEY` | Fase C |
| `SUMOPOD_BASE_URL` | Fase C |
| `SUMOPOD_WEBHOOK_SECRET` | Fase C |
| `OPENAI_API_KEY` | Fase E |

## Agent yang terlibat

| Nama | Tugas go-live |
|------|----------------|
| **Cursor** | Merge/deploy/kode |
| **Arsitek** | Review alur produk (opsional) |
| **Vortex** | Polish UI (belum connect) |
| **Tukang Cloud** | CVM Tencent (Fase D) |
| **Penilai** | Skor GPT (Fase E) |
