<p align="center">
  <img src="docs/images/buek-core-hero.svg" alt="BUEK CORE — Build AI Workers for Any Industry" width="640" />
</p>

<p align="center">
  <a href="https://core.buekwebsite.com"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/architecture.md"><strong>Architecture</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/deployment.md"><strong>Deployment</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenAI-GPT--5.6-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI GPT-5.6" />
  <img src="docs/images/badges/codex-dev-assist.svg" alt="Codex Dev Assist" height="28" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

**Buek Core** is a multi-tenant platform for **AI Workers** — role-based digital teammates that combine reasoning, company knowledge, and structured workflows. Manufacturing is the first vertical; the AI Core stays reusable across industries.

**Live:** [core.buekwebsite.com](https://core.buekwebsite.com) · Demo tenants: Epson, Toyota, Nestlé

---

## What it does

| Capability | Description |
|------------|-------------|
| **Role workspaces** | Operator, Engineer, Supervisor, Plant Manager — each with tailored UI |
| **Investigation wizard** | Evidence → root cause → countermeasure → plan → approval → report |
| **AI Copilot** | GPT 5.6 assistant with factory context (Codex used in development) |
| **Company Brain** | Every completed investigation strengthens organizational memory |

We don't replace engineers — we give every role an AI Worker that knows their factory.

---

## Quick demo

1. Open [core.buekwebsite.com](https://core.buekwebsite.com)
2. Pick a tenant → choose **Engineer** → launch demo
3. Walk the 5-step investigation (e.g. Epson *White Streak*)
4. Switch to **Supervisor** → approve → export PDF report

---

## Tech stack

React 19 · TypeScript · Vite · Node.js · Express · Prisma · PostgreSQL · OpenAI API (`gpt-5.6`) · Docker Compose

Default model is configurable via `OPENAI_MODEL` in `.env`.

---

## Local development

```bash
git clone https://github.com/abdularief23/buek-core.git
cd buek-core
pnpm install && cp .env.example .env
# Set OPENAI_API_KEY and OPENAI_MODEL=gpt-5.6 in .env

pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:5173 |
| API | http://localhost:4000 |

**Project layout:** `apps/web` (UI) · `apps/api` (API) · `packages/ai-core` (reusable AI) · `domains/manufacturing` (first domain module)

---

## Docs

| Topic | Link |
|-------|------|
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Deployment | [docs/deployment.md](docs/deployment.md) |
| Manual deploy | [deploy/MANUAL-DEPLOY.md](deploy/MANUAL-DEPLOY.md) |
| Video production | [docs/video-production-guide.md](docs/video-production-guide.md) |

---

## License

Private — © Buek Core. Contact maintainer for access.
