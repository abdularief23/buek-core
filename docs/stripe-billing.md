# Stripe Billing Setup

Buek Core uses **Stripe Checkout** for subscription billing with server-side webhook activation.

## 1. Create Stripe test keys

1. Open [Stripe Dashboard (Test mode)](https://dashboard.stripe.com/test/apikeys)
2. Copy **Secret key** → `STRIPE_SECRET_KEY`
3. No publishable key required for Checkout redirect flow

## 2. Configure environment

Add to `.env` on the API server:

```bash
APP_PUBLIC_URL=https://core.buekwebsite.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 3. Webhook endpoint

Register a webhook in Stripe Dashboard → Developers → Webhooks:

| Field | Value |
|-------|-------|
| URL | `https://core.buekwebsite.com/api/billing/webhook` |
| Events | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |

Copy the **Signing secret** to `STRIPE_WEBHOOK_SECRET`.

### Local development with Stripe CLI

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

Use the CLI webhook secret in `.env` while testing locally.

## 4. Verify

1. `GET /health` → `features.stripeBilling: true`
2. Login → **View Pricing & Plans** → checkout redirects to Stripe
3. Use test card `4242 4242 4242 4242`
4. After payment, webhook upgrades subscription in PostgreSQL
5. Profile → **Plan & Billing** shows updated plan

## Security notes

- Plan tier and price are set **server-side** in `createStripeCheckoutSession` — clients cannot manipulate amounts
- `POST /api/billing/subscribe` (direct upgrade) was removed — upgrades only via Stripe webhook
- Webhook signatures are verified with `STRIPE_WEBHOOK_SECRET`
- Events are idempotent via `StripeWebhookEvent` table

## Fallback

If Stripe keys are not configured, checkout falls back to **mock trial** mode for local demos.
