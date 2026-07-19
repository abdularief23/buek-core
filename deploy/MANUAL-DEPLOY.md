# Manual Deploy (VPS belum ter-update)

Jika halaman login masih menampilkan **"Enterprise AI Operating System"** atau **"Demo Workspace"**, VPS masih menjalankan build lama.

## Penyebab

GitHub Actions deploy **gagal** (SSH secrets belum dikonfigurasi). Merge PR saja **tidak** mengupdate VPS.

Cek: https://github.com/abdularief23/buek-core/actions/workflows/deploy.yml

## Deploy manual via SumoPod Web Console

1. Buka **Web Console** VPS SumoPod (43.157.226.203)
2. Paste dan jalankan perintah ini:

```bash
cd ~/buek-core 2>/dev/null || cd /root/buek-core 2>/dev/null || (cd ~ && git clone https://github.com/abdularief23/buek-core.git && cd buek-core)
git fetch origin main && git checkout main && git reset --hard origin/main
chmod +x scripts/*.sh
./scripts/console-recover.sh
```

3. Hard refresh browser: **Ctrl+Shift+R**

## Verifikasi berhasil

Buka https://core.buekwebsite.com/version.json — harus menampilkan:

```json
{"build":"0787467","featureSet":"engineering-copilot-v2",...}
```

Buka https://core.buekwebsite.com/health — harus ada:

```json
"features":{"engineeringAnalysis":true,"loginPreferences":true}
```

Halaman login harus menampilkan panel **Tampilan** dan **Bahasa**.

## Setup auto-deploy (opsional)

Di GitHub repo → Settings → Secrets → Actions, tambahkan:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `43.157.226.203` |
| `VPS_USER` | `root` (atau user VPS) |
| `VPS_PORT` | `22` |
| `SSH_PRIVATE_KEY` | Private key yang match `deploy/authorized_key.pub` |

Setelah itu, setiap push ke `main` akan auto-deploy.
