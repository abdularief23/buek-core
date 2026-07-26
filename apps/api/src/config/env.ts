export interface ApiEnv {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  appPublicUrl: string;
  openAiApiKey?: string;
  openAiModel: string;
  domainModules?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
}

function readRequired(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadEnv(): ApiEnv {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const domainModules = process.env.BUEK_DOMAIN_MODULES;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.API_PORT ?? 4000),
    corsOrigin,
    appPublicUrl: process.env.APP_PUBLIC_URL ?? corsOrigin,
    databaseUrl: readRequired("DATABASE_URL"),
    ...(openAiApiKey ? { openAiApiKey } : {}),
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.6",
    ...(domainModules ? { domainModules } : {}),
    ...(stripeSecretKey ? { stripeSecretKey } : {}),
    ...(stripeWebhookSecret ? { stripeWebhookSecret } : {})
  };
}

export function isStripeConfigured(env: ApiEnv): boolean {
  return Boolean(env.stripeSecretKey && env.stripeWebhookSecret);
}
