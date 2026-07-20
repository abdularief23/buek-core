<p align="center">
  <img src="docs/images/buek-core-hero.svg" alt="BUEK CORE — Build AI Workers for Any Industry" width="640" />
</p>

<p align="center">
  <a href="https://core.buekwebsite.com"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="#how-we-used-codex-and-gpt-56"><strong>Codex + GPT-5.6</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/architecture.md"><strong>Architecture</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenAI-GPT--5.6-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI GPT-5.6" />
  <img src="docs/images/badges/codex-dev-assist.svg" alt="Codex Dev Assist" height="28" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

**Buek Core** is a multi-tenant platform for **AI Workers** — role-based digital teammates for manufacturing operations. Operators report issues, engineers run guided investigations, supervisors approve, and plant managers track KPIs — all on one platform with a shared Company Brain.

**Try it now (no install):** [core.buekwebsite.com](https://core.buekwebsite.com)

---

## What we built

| Feature | What it does |
|---------|--------------|
| **Role workspaces** | Operator, Engineer, Supervisor, Plant Manager — each gets a tailored home screen |
| **5-step investigation wizard** | Evidence → root cause → countermeasure → execution plan → submit |
| **AI Copilot** | Streaming assistant powered by **GPT-5.6** with live factory data + SOP knowledge |
| **Company Brain** | Completed investigations become searchable organizational memory |
| **Multi-tenant demo** | Epson, Toyota, Nestlé — each with realistic sample issues |

---

## How we used Codex and GPT-5.6

<a id="how-we-used-codex-and-gpt-56"></a>

### Codex — how we built the project

We used **Codex** (Desktop / CLI) as our primary development partner throughout Build Week:

| Area | What Codex helped build |
|------|-------------------------|
| **Full-stack app** | React 19 UI, Express API, Prisma schema, PostgreSQL seed data |
| **Role-based UX** | Operator / Engineer / Supervisor / Manager homes, mobile field layout |
| **Investigation flow** | 5-step wizard, approval workflow, PDF/DOCX report export |
| **AI integration** | OpenAI Responses API wiring, SSE streaming, guardrails, knowledge retrieval |
| **Infrastructure** | Docker Compose, Nginx deploy, GitHub Actions, VPS recovery scripts |
| **Demo assets** | Video scene renderers (`tools/video-gen/`), production storyboard |

Codex handled scaffolding, refactors, bug fixes, and deployment — we steered product decisions and validated each flow on the live demo.

> **Codex Session ID:** run `/feedback` inside Codex on this repo and paste the Session ID into the Devpost form.

### GPT-5.6 — how it powers the product

GPT-5.6 runs inside the live app via the **OpenAI Responses API** (`apps/api/src/chat.ts`):

| Use case | How GPT-5.6 is used |
|----------|---------------------|
| **AI Copilot** | Role-aware chat assistant (summarize, analyze, search, draft) |
| **Root cause analysis** | Ranks possible causes — engineer always makes the final call |
| **Knowledge retrieval** | Answers grounded in seeded SOPs, work instructions, and issue history |
| **Report drafting** | Helps engineers draft investigation reports from workflow context |
| **Live data grounding** | Each request includes a database snapshot so answers stay factual |

Model config: `OPENAI_MODEL=gpt-5.6` (default in `apps/api/src/config/env.ts`).

**Where to see it in the app:** launch any tenant → open the ✨ copilot (bottom-right) → ask e.g. *"What are the possible causes for white streak?"* or *"Summarize today's open issues."*

---

## Quick demo (judges)

1. Go to [core.buekwebsite.com](https://core.buekwebsite.com)
2. Pick **Epson Indonesia** → role **Engineer** → **Launch Demo**
3. Open today's investigation (**White Streak on Print**)
4. Walk through the 5-step wizard; try the AI Copilot on any step
5. Switch to **Supervisor** → approve → download the engineering report

No API key needed to explore the UI. Copilot requires `OPENAI_API_KEY` on the server (already configured on the live demo).

---

## Setup (local)

**Requirements:** Node.js 22+, pnpm 10+, PostgreSQL 16+, `OPENAI_API_KEY`

```bash
git clone https://github.com/abdularief23/buek-core.git
cd buek-core
pnpm install
cp .env.example .env
```

Edit `.env`:

```bash
DATABASE_URL=postgresql://buek:buek@localhost:5432/buek_core?schema=public
OPENAI_API_KEY=sk-...          # required for AI Copilot
OPENAI_MODEL=gpt-5.6
```

Start database, migrate, seed sample data, run:

```bash
docker compose up -d postgres    # or use your own Postgres
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:5173 |
| API | http://localhost:4000 |

### Sample data (seed)

`pnpm db:seed` loads three demo tenants with realistic manufacturing data:

| Tenant | Sample issue |
|--------|--------------|
| Epson Indonesia | White Streak defect on printer line |
| Toyota Indonesia | Torque drift on assembly station EA-04 |
| Nestlé Indonesia | Metal detector alarm on packaging line |

Each tenant includes SOPs, work instructions, KPIs, notifications, and investigation history.

---

## Repo access (judges)

If this repo is **private**, it is shared with:

- `testing@devpost.com`
- `build-week-event@openai.com`

---

## Project layout

```text
apps/web/              React UI — role homes, wizard, AI copilot
apps/api/              Express API — chat, workflows, reports
packages/ai-core/      Reusable AI platform (OpenAI client, registry)
domains/manufacturing/ First domain module (SOPs, tools, prompts)
tools/video-gen/       Demo video render pipeline
```

More detail: [docs/architecture.md](docs/architecture.md) · [docs/deployment.md](docs/deployment.md) · [docs/voiceover-script.md](docs/voiceover-script.md) (demo video voiceover + MP3)

---

## Tech stack

React 19 · TypeScript · Vite · Tailwind v4 · Node.js · Express · Prisma · PostgreSQL · OpenAI API (GPT-5.6) · Docker Compose

---

## License

Private — © Buek Core. Contact maintainer for access.
