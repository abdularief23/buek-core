# Buek Core — Product Requirements Document (PRD)

**Galuxium Nexus V2 · Commercial SaaS**  
**Author:** Abdul Arief · abdul.arief@mail.ugm.ac.id  
**Version:** 1.0 · July 2026

---

## 1. Executive Summary

Buek Core is a multi-tenant B2B SaaS platform that helps manufacturing teams investigate production defects faster using AI-guided workflows. This PRD defines how the product becomes **sellable** — with clear pricing, subscription management, usage metering, and upgrade paths that judges and early customers can evaluate immediately.

**Goal for Galuxium:** Demonstrate a credible, revenue-ready SaaS business — not just a hackathon prototype.

---

## 2. Problem Statement

| Pain Point | Impact |
|------------|--------|
| Engineers spend hours searching SOPs and past reports before fixing defects | Production line downtime, lost output |
| Factory software is either rigid ERP add-ons or throwaway demos | No product teams would pay for |
| Generic AI chatbots lack manufacturing context | Low trust, no workflow integration |
| No usage visibility for plant managers | Cannot justify AI spend |

---

## 3. Target Customers

### Primary Persona — Manufacturing Engineer
- Works at mid-size plant (electronics, automotive, F&B)
- Needs root-cause analysis, SOP retrieval, investigation tracking
- Budget influence: recommends tools to supervisor/plant manager

### Secondary Persona — Plant Manager / Operations Director
- Cares about OEE, defect PPM, team productivity
- Buys subscription; needs executive KPIs and cost control

### Ideal Customer Profile (ICP)
- 1–5 plants, 20–200 employees per site
- Indonesia, Southeast Asia, or global mid-market manufacturers
- Already digitizing operations; frustrated with ERP rigidity

---

## 4. Product Vision

> **One AI Core. Unlimited Industry Knowledge. Sold as SaaS.**

Buek Core separates AI reasoning (AI Core) from industry knowledge (Domain Modules). Manufacturing is the first vertical; healthcare, construction, and retail follow the same platform.

---

## 5. Monetization Model

### 5.1 Pricing Tiers

| Tier | Monthly Price | Plants | Users | Investigations/mo | AI Copilot |
|------|---------------|--------|-------|-------------------|------------|
| **Starter** | $49 | 1 | 5 | 50 | 200 queries/mo |
| **Pro** | $199 | 3 | 25 | Unlimited | Unlimited |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited | Unlimited + SLA |

### 5.2 Revenue Streams

1. **Monthly subscription** — per workspace/company, billed monthly or annually (20% discount)
2. **Usage overage** — $0.10 per extra copilot query, $2 per extra investigation (Starter tier)
3. **Enterprise onboarding** — custom domain modules, SSO, dedicated support
4. **Future:** API access, white-label, marketplace for domain modules

### 5.3 Free Trial

- 14-day Pro trial for new signups (no credit card for demo/hackathon)
- Demo workspaces remain free for evaluation

---

## 6. MVP Features for Revenue (This Release)

### 6.1 Public Pricing Page
- Visible from login screen ("View Plans")
- Three tiers with feature comparison
- CTA: "Get Started" → checkout flow

### 6.2 Subscription Management
- `Subscription` model linked to `Company`
- Plan tier: `starter` | `pro` | `enterprise`
- Status: `active` | `trial` | `cancelled` | `past_due`

### 6.3 Usage Metering
- Track per company per billing period:
  - `copilot_queries` — each `/api/chat` request
  - `investigations` — each investigation step advance
- Display usage vs. limits in Profile → Plan & Billing

### 6.4 Upgrade Flow
- `POST /api/billing/subscribe` — upgrade/downgrade plan (mock Stripe for demo)
- `GET /api/billing/plans` — public plan catalog
- `GET /api/billing/subscription` — current plan + usage for workspace

### 6.5 Plan Enforcement (Soft Limits)
- Starter: warn at 80% usage; block at 100% with upgrade CTA
- Pro/Enterprise: no hard limits in MVP

---

## 7. User Stories

| ID | As a… | I want to… | So that… |
|----|-------|------------|----------|
| US-01 | Visitor | See pricing before signing up | I can evaluate cost vs. value |
| US-02 | Plant Manager | See my current plan and usage | I can control AI spend |
| US-03 | Engineer | Use AI Copilot within my plan limits | I don't surprise my manager with overages |
| US-04 | New Customer | Start a trial from the pricing page | I can test Pro features before paying |
| US-05 | Sales (founder) | Show live billing UI to judges | Galuxium Business Viability score is credible |

---

## 8. Success Metrics

| Metric | Target (6 months post-launch) |
|--------|--------------------------------|
| MRR | $5,000 |
| Paying customers | 10 Starter + 3 Pro |
| Trial → Paid conversion | 15% |
| Monthly churn | < 5% |
| Avg. investigations/customer | 30/mo |

### Galuxium Judging Alignment

| Criterion | How Buek Core Addresses It |
|-----------|------------------------------|
| Business Viability (15%) | Live pricing page, subscription model, usage metering |
| Technical Execution (25%) | Prisma billing schema, REST API, React UI |
| Innovation (20%) | Usage-based AI SaaS for manufacturing |
| Market Fit (20%) | Role-native UX for 4 factory roles |
| Presentation (20%) | Demo at core.buekwebsite.com with billing visible |

---

## 9. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Web App (React)                                        │
│  LoginScreen → PricingPage → ProfileView (Plan & Billing)│
└────────────────────────┬────────────────────────────────┘
                         │ REST
┌────────────────────────▼────────────────────────────────┐
│  API (Express)                                          │
│  /api/billing/plans                                     │
│  /api/billing/subscription                              │
│  /api/billing/subscribe                                 │
│  /api/billing/checkout                                  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  PostgreSQL (Prisma)                                    │
│  Company → Subscription → UsageRecord                   │
└─────────────────────────────────────────────────────────┘
```

### Payment Integration Roadmap

| Phase | Integration | Status |
|-------|-------------|--------|
| MVP (Galuxium) | Stripe Checkout + webhooks + usage metering | **This release** |
| Phase 2 | Stripe Customer Portal + annual billing | Post-hackathon |
| Phase 3 | Midtrans (IDR) for Indonesia market | Q4 2026 |

See [docs/stripe-billing.md](./stripe-billing.md) for setup instructions.

---

## 10. Out of Scope (MVP)

- Real Stripe/Midtrans payment processing
- Invoice PDF generation
- Annual billing automation
- Multi-currency support
- Seat-based per-user billing
- Admin billing dashboard

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Judges see mock checkout | Label clearly as "Demo Checkout"; show real plan limits and usage |
| OpenAI API costs exceed subscription revenue | Usage metering + rate limits already in place |
| Low conversion from free demo | 14-day Pro trial with email capture |
| Enterprise sales cycle too long | Focus on Starter/Pro self-serve first |

---

## 12. Launch Checklist

- [x] PRD document (this file)
- [x] Pricing page on login flow
- [x] Billing API endpoints
- [x] Subscription + usage database models
- [x] Plan & Billing section in Profile
- [x] Usage tracking on chat and investigations
- [ ] Stripe integration (post-Galuxium)
- [ ] Landing page with pricing CTA
- [ ] Email onboarding sequence

---

## 13. Appendix

| Resource | URL |
|----------|-----|
| Live Demo | https://core.buekwebsite.com |
| GitHub | https://github.com/abdularief23/buek-core |
| Demo Video | https://youtu.be/zEnBickDrFI |
| Galuxium Devpost | https://galuxium-nexus-v2-29411.devpost.com/ |
| Executive Summary | [docs/galuxium-executive-summary.md](./galuxium-executive-summary.md) |
