# Buek Core

**Build AI Workers for Any Industry**

Buek Core adalah platform AI modular yang memisahkan **AI reasoning** dari **domain knowledge**. Developer membangun sekali, lalu menambah vertikal industri lewat domain module — tanpa mengubah AI Core.

> **Live Demo:** [https://core.buekwebsite.com](https://core.buekwebsite.com)

---

## Visi

**One AI Core. Unlimited Industry Knowledge.**

| Lapisan | Fungsi |
|---------|--------|
| **AI Core** | Reasoning, agents, memory, tools — reusable di semua industri |
| **Domain Modules** | Knowledge, SOP, workflow, prompts khusus vertikal (Manufacturing, dll.) |
| **Apps** | Web shell role-based + API runtime |

Vertikal pertama: **Manufacturing** (Epson, Toyota, Nestlé demo tenants).

---

## Fitur Utama

### Role-Based Workspace

Setiap role punya home, navigasi, dan AI persona berbeda:

| Role | Fokus |
|------|-------|
| **Operator** | Checklist produksi, laporan masalah, konteks shift/line/mesin |
| **Engineer** | Investigasi 5 langkah, analisa root cause, draft laporan |
| **Supervisor** | Approval analisa, work order, SOP revision, laporan engineering |
| **Plant Manager** | KPI, executive summary, read-only oversight |

### Engineering Analysis Wizard (5 Langkah)

1. **Evidence** — checklist + upload foto evidence  
2. **Possible Root Cause** — AI suggestion, engineer memilih  
3. **Countermeasure** — rekomendasi historis + foto analisa  
4. **Execution Plan** — PIC, tanggal, verifikasi  
5. **Preview & Submit** — preview dokumen + kirim ke supervisor  

Setelah submit: **dokumen analisa terformat**, export PDF/HTML, menunggu supervisor review.

### AI Copilot

- Briefing proaktif per role  
- Mode: Ringkas, Analisis, Cari, Buat Draft  
- **Desktop:** panel floating  
- **Mobile:** tombol ✨ kecil → fullscreen (tidak menutupi konten)

### Company Brain

Hierarki **Machine → Issue → Technical Report** dengan metadata (tanggal issue, pembuat, lessons learned).

### Mobile-First Field App

Mobile dirancang sebagai **alat kerja lapangan**, bukan desktop yang diperkecil:

- ☰ Hamburger menu + bottom navigation (Home · AI · Workflow · Inbox · Me)  
- Investigation **vertical stepper** dengan progress %  
- Kartu besar, font 17px+, touch-friendly  
- Laporan mobile: ringkasan draft + buka PDF (bukan dokumen penuh di layar kecil)

### Multi-Tenant Demo

| Tenant | Industri | Contoh Issue |
|--------|----------|--------------|
| Epson Indonesia | Printer Manufacturing | White Streak defect |
| Toyota Indonesia | Automotive | Torque drift EA-04 |
| Nestlé Indonesia | Food & Beverage | Metal detector alarm |

Login demo: pilih tenant + role (Operator / Engineer / Supervisor / Plant Manager).

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| AI | OpenAI API, modular agents & knowledge packages |
| Deploy | Docker Compose, Nginx, GitHub Actions |

---

## Struktur Proyek

```text
apps/
  web/          # React UI — role homes, wizard, copilot, workspaces
  api/          # Express API — data engine, workflows, engineering analysis
domains/
  manufacturing/  # Domain module vertikal pertama
packages/
  ai-core/      # Registry, OpenAI client — tanpa domain knowledge
  agents/       # Agent system & module discovery
  knowledge/    # RAG-ready knowledge index
  memory/       # Conversation / worker state
  prompts/      # Prompt templates
  tools/        # Tool registry
  workflows/    # Workflow registry
  ui/           # Shared UI (AppNav, AiPromptInput, dll.)
  shared-types/
docker/         # Dockerfile web & api
scripts/        # deploy.sh, console-recover.sh, verify-deploy.sh
deploy/         # SSH keys, manual deploy docs
docs/           # architecture.md, deployment.md
```

Detail arsitektur: [docs/architecture.md](docs/architecture.md)

---

## Getting Started

### Prasyarat

- Node.js 22+
- pnpm 10+
- PostgreSQL 16+ (atau via Docker)

### Instalasi Lokal

```bash
git clone https://github.com/abdularief23/buek-core.git
cd buek-core
pnpm install
cp .env.example .env
# Isi OPENAI_API_KEY di .env

pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:5173 |
| API | http://localhost:4000 |
| Health | http://localhost:4000/health |

### Docker (Production-like)

```bash
docker compose up -d --build
```

---

## Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | Kunci OpenAI untuk chat & AI features |
| `OPENAI_MODEL` | Model default (mis. `gpt-4.1-mini`) |
| `VITE_API_URL` | Kosongkan untuk same-origin di production |
| `CORS_ORIGIN` | Origin frontend untuk development |
| `BUEK_DOMAIN_MODULES` | Domain modules yang di-load (`@buek/domain-manufacturing`) |

Lihat [.env.example](.env.example) untuk daftar lengkap.

---

## Scripts

```bash
pnpm dev          # Jalankan web + api parallel
pnpm build        # Build semua packages
pnpm lint         # ESLint semua packages
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Jalankan migrasi dev
pnpm db:seed      # Seed data demo
pnpm db:deploy    # Migrasi production
```

---

## Deployment

**Production:** [https://core.buekwebsite.com](https://core.buekwebsite.com)

```text
core.buekwebsite.com/        → React web (Nginx)
core.buekwebsite.com/api/*   → Express API
core.buekwebsite.com/health  → Health check + build info
```

### Auto-Deploy (GitHub Actions)

Set secrets di repo → Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | IP VPS |
| `VPS_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | Isi private key deploy |

Setiap push ke `main` menjalankan [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

### Manual Deploy

Jika CI gagal, lihat [deploy/MANUAL-DEPLOY.md](deploy/MANUAL-DEPLOY.md) atau:

```bash
ssh ubuntu@<VPS_HOST>
cd ~/buek-core
git fetch origin main && git reset --hard origin/main
docker compose build --no-cache web api
docker compose up -d --force-recreate
```

Verifikasi:

```bash
curl https://core.buekwebsite.com/health
# Harus return: "engineeringAnalysis": true
```

Panduan lengkap: [docs/deployment.md](docs/deployment.md)

---

## API Highlights

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /api/auth/demo-options` | Daftar tenant & role demo |
| `POST /api/auth/demo-launch` | Launch demo workspace |
| `GET /api/data/:slug/issues/:key/analysis` | Engineering analysis + copilot |
| `PUT /api/data/:slug/issues/:key/analysis` | Simpan draft analisa |
| `POST /api/data/:slug/issues/:key/analysis/submit` | Submit ke supervisor |
| `GET /api/data/:slug/issues/:key/analysis/document` | Export HTML/PDF dokumen analisa |
| `GET /api/data/:slug/operator/options` | Line, shift, mesin untuk operator |
| `GET /api/data/:slug/company-brain` | Hierarki machine → issue → report |
| `GET /api/knowledge/search` | Pencarian knowledge base |

---

## Filosofi Desktop vs Mobile

| Desktop (kantor) | Mobile (lapangan) |
|------------------|-------------------|
| Dashboard & KPI | Tugas hari ini |
| Approval queue lengkap | Approve cepat 1-tap |
| Laporan PDF/DOCX penuh | Ringkasan + buka PDF |
| Planning & analytics | Foto defect & evidence |
| Company Brain browse | Chat AI & notifikasi |

Buek Core tidak memaksa tampilan desktop diperkecil ke HP — setiap platform punya UX yang sesuai konteks kerja.

---

## Roadmap (Singkat)

- [ ] Scan QR Machine → konteks mesin otomatis  
- [ ] Kamera defect langsung dari operator  
- [ ] Push notification supervisor  
- [ ] Vertikal domain baru (website builder, HR, dll.)  
- [ ] Connector MES/ERP production (bukan demo database)

---

## Lisensi

Private — © Buek Core. Hubungi maintainer untuk akses.
