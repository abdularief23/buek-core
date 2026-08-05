# Buek Agent Roster — Nama Panggilan

Panggil agent dengan **nama** di bawah saat Anda butuh peran spesifik.

| Nama panggilan | Peran | Status koneksi ke sesi ini | Dipakai untuk |
|----------------|-------|----------------------------|---------------|
| **Cursor** | Executor / coding | ✅ Terhubung (sesi ini) | Kode, PR, deploy, implementasi UI |
| **Arsitek** (Buek Copilot) | Architect / reviewer | ⚠️ Custom GPT terpisah (ChatGPT + GitHub Action) | Arsitektur, audit docs, HANDOFF |
| **Vortex** | Design / visual craft | ❌ **Belum terhubung** di Cloud Agent ini | Polish UI, layout, motion, brand surface |
| **Penilai** | GPT website scorer | 🟡 Dirancang (belum live) | Nilai kualitas website bisnis setelah publish |
| **Tukang Cloud** | Infra Tencent / Sumopod | 🟡 Manual + docs (belum agent otomatis) | CVM Jakarta, VPS, DNS, security group |

## Apakah semuanya ter-connect?

**Belum.** Saat ini hanya **Cursor** yang aktif di percakapan Cloud Agent ini.

```text
Anda
 ├── Cursor          ✅  (repo buek-core)
 ├── Arsitek         ⚠️  (buka Custom GPT Buek Copilot di ChatGPT)
├── Vortex          ❌  (tidak ada di MCP / environment ini)
├── Penilai         🟡  (produk berikutnya)
└── Tukang Cloud    🟡  (akun Tencent customer sudah aktif; belum otomasi)
```

### Cara panggil

| Anda bilang | Artinya |
|-------------|---------|
| “**Cursor**, kerjakan …” | Implementasi di repo |
| “**Arsitek**, review …” | Paste ke Buek Copilot + minta HANDOFF |
| “**Vortex**, rapikan UI …” | Butuh hubungkan Vortex dulu (MCP/tool) — belum tersedia di sini |
| “**Penilai**, skor website ini …” | Setelah fitur scoring live |
| “**Tukang Cloud**, setup CVM …” | Cursor bantu checklist; eksekusi di console Tencent/Sumopod |

## Target alur bisnis (Website + VPS)

```text
Pembeli di buekwebsite.com
    → pilih paket VPS (Tencent Jakarta via Sumopod)
    → isi alamat website / domain yang diinginkan
    → bayar (Sumopod Pay / metode IDR)
    → Cursor/otomasi provision VPS + deploy template website
    → Penilai skor kualitas website (GPT)
    → Arsitek review jika ada perubahan produk
```

Prototype tampilan: `apps/web/public/buek-website-vps.html`  
(setelah deploy: `https://core.buekwebsite.com/buek-website-vps.html`)

## Menghubungkan Vortex

Vortex **tidak** terdaftar sebagai MCP server di environment Cloud Agent saat ini (hanya `cursor-cloud`).

Agar Vortex bisa dipanggil:
1. Aktifkan / pasang Vortex di Cursor Desktop (MCP / extension sesuai produk Vortex Anda)
2. Atau beri tahu URL/tool Vortex yang dipakai
3. Setelah terlihat di MCP catalog, Cursor bisa kerja sama dengan Vortex untuk polish UI

Sampai itu ada, **Cursor** yang membuat prototype UI; Vortex bisa dipanggil nanti untuk penyempurnaan visual.
