# Buek Core — Executive Summary

**Galuxium Nexus V2 Submission**  
**Abdul Arief** · abdul.arief@mail.ugm.ac.id  
**July 2026**

---

## Problem

Manufacturing teams lose **hours every day** investigating production defects. Before an engineer can start solving a problem, they search through SOPs, historical reports, and scattered company knowledge — while the **production line waits**.

Most factory software is either a rigid ERP add-on or a throwaway prototype. Neither is a real SaaS product that teams would pay for.

---

## Solution

**Buek Core** is a production-grade, multi-tenant **B2B SaaS platform** for manufacturing operations. Four roles collaborate on one system:

| Role | Workspace |
|------|-----------|
| **Operator** | Report defects, track production, monitor line status |
| **Engineer** | AI-guided 5-step investigation, root-cause analysis, countermeasures |
| **Supervisor** | Review findings, approve corrective actions |
| **Plant Manager** | Executive KPIs — OEE, defect PPM, critical issues |

**AI Copilot** lets engineers ask in plain language — search similar cases, summarize investigations, draft reports. Every closed case feeds the **Company Brain**, making the platform smarter over time.

---

## Live Deployment

| Resource | URL |
|----------|-----|
| **Live Demo** | https://core.buekwebsite.com |
| **GitHub** | https://github.com/abdularief23/buek-core |
| **Demo Video** | https://youtu.be/zEnBickDrFI |

**Demo flow:** Epson Indonesia → Engineer → Launch Demo → White Streak investigation → 5-step wizard → Supervisor approve → PDF report

---

## Business Model — Usage-Based SaaS

| Tier | Price | Includes |
|------|-------|----------|
| **Starter** | $49/month | 1 plant, 50 investigations/month, 5 users |
| **Pro** | $199/month | 3 plants, unlimited investigations, AI Copilot, 25 users |
| **Enterprise** | Custom | Multi-tenant, SSO, audit logs, SLA, dedicated support |

**Revenue streams:**
- Monthly subscription per plant
- Usage-based metering for AI Copilot queries and investigation runs
- Enterprise onboarding and custom domain modules

---

## Technical Architecture

```
Users (Operator · Engineer · Supervisor · Manager)
        ↓
Buek Core Platform (React 19 + Express API)
        ↓
   ┌────┴────┐
AI Core     Domain Modules
(GPT-5.6)   (Manufacturing → future verticals)
   └────┬────┘
Company Knowledge + PostgreSQL
```

**Stack:** React 19 · TypeScript · Vite · Node.js · Express · Prisma · PostgreSQL · Docker Compose

**AI:** OpenAI GPT-5.6 via Responses API — root-cause ranking, SOP retrieval, copilot chat, report drafting

**Infrastructure:** Docker Compose on VPS, Nginx reverse proxy, GitHub Actions CI/CD

---

## Traction & Validation

- **Production deployment** live at core.buekwebsite.com (not localhost)
- **3 demo tenants:** Epson Indonesia, Toyota Indonesia, Nestlé
- **End-to-end workflow** operational: defect report → investigation → approval → PDF export
- **Multi-tenant architecture** with role-based access control
- **Open-source** repository with professional README and deployment documentation

---

## Competitive Advantage

1. **One AI Core, unlimited industries** — manufacturing first, pluggable domain modules for healthcare, construction, retail
2. **Role-native UX** — not one generic dashboard forced on every user
3. **Human-in-the-loop AI** — GPT ranks causes; engineers always make the final call
4. **Company Brain** — organizational memory that compounds with every investigation
5. **Already live** — judges can test immediately without setup

---

## Roadmap

| Phase | Timeline | Deliverable |
|-------|----------|-------------|
| **Now** | July 2026 | Live MVP, 3 demo tenants, AI Copilot |
| **Q3 2026** | Aug–Sep | Stripe billing, usage metering, pricing page |
| **Q4 2026** | Oct–Dec | YouCam visual defect API, enterprise SSO |
| **2027** | H1 | Healthcare & construction domain modules |

---

## Team

**Abdul Arief** — Solo founder & full-stack engineer  
Built with Cursor AI agents, OpenAI Codex, and GPT-5.6

---

## Partner Integrations

| Partner | Integration |
|---------|-------------|
| **OpenAI GPT-5.6** | AI reasoning, copilot, investigation analysis |
| **Perfect Corp YouCam API** | Visual defect analysis from operator photos (NEXUS2026 grant — 500 units) |
| **Backboard R-CLI** | Architecture scaffolding accelerator |

---

*Buek Core — Build AI Workers for Any Industry.*  
*One AI Core. Unlimited Industry Knowledge.*
