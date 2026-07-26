# Auto-Deploy Setup (stop email "deploy failed")

Setiap push ke `main` menjalankan workflow **Deploy to VPS**.  
Email gagal muncul karena **3 GitHub Secrets belum diisi** — bukan karena kode rusak.

## Yang dibutuhkan (sekali saja)

GitHub Actions perlu SSH masuk ke VPS. Kamu **tidak perlu kirim password ke siapa pun** — cukup tambah 4 secrets di GitHub.

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `43.157.226.203` |
| `VPS_USER` | `ubuntu` atau `root` (user yang dipakai login VPS) |
| `VPS_PORT` | `22` |
| `SSH_PRIVATE_KEY` | private key (lihat langkah di bawah) |

**Bukan** halaman Deploy keys — pakai:  
https://github.com/abdularief23/buek-core/settings/secrets/actions

---

## Langkah 1 — Jalankan di VPS (Web Console SumoPod)

Paste perintah ini di **Web Console** VPS (bukan di PC):

```bash
cd ~/buek-core 2>/dev/null || (cd ~ && git clone https://github.com/abdularief23/buek-core.git && cd buek-core)
git pull origin main
chmod +x scripts/setup-github-actions-ssh.sh
./scripts/setup-github-actions-ssh.sh
```

Script akan:
1. Buat SSH key khusus GitHub Actions
2. Tambahkan public key ke `authorized_keys` VPS
3. **Print private key** — copy untuk GitHub Secret

---

## Langkah 2 — Tambah secrets di GitHub

1. Buka https://github.com/abdularief23/buek-core/settings/secrets/actions  
2. **New repository secret** untuk masing-masing:
   - `VPS_HOST` → `43.157.226.203`
   - `VPS_USER` → nilai yang dicetak script (biasanya `ubuntu` atau `root`)
   - `VPS_PORT` → `22`
   - `SSH_PRIVATE_KEY` → paste **seluruh** private key (dari `-----BEGIN` sampai `-----END`)

---

## Langkah 3 — Test deploy

1. Buka https://github.com/abdularief23/buek-core/actions/workflows/deploy.yml  
2. Klik **Run workflow** → **Run workflow**  
3. Harus hijau ✅ (deploy + verify)

Atau deploy manual sekali (tanpa secrets):

```bash
cd ~/buek-core && git pull origin main && ./scripts/console-recover.sh
```

---

## Verifikasi live site

| URL | Harus |
|-----|-------|
| https://core.buekwebsite.com | Link **"Lihat Harga & Paket"** di login |
| https://core.buekwebsite.com/api/billing/plans | JSON plans (bukan 404) |
| https://core.buekwebsite.com/health | `"stripeBilling": false` (OK tanpa Stripe) |

Hard refresh: **Ctrl+Shift+R**

---

## Matikan email gagal (opsional)

Kalau belum sempat setup secrets dan email mengganggu:

GitHub → **Settings** → **Notifications** → uncheck **Actions** failures  

Atau selesaikan setup secrets di atas — deploy akan sukses dan email berhenti gagal.

---

## Yang **tidak** perlu dikirim ke agent/Cursor

- Password VPS  
- Private key lewat chat  
- Akses panel SumoPod  

Agent hanya bisa push kode ke GitHub. **Kamu** yang isi secrets (one-time, ~5 menit).
