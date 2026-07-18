FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY domains/manufacturing/package.json domains/manufacturing/package.json
COPY packages/agents/package.json packages/agents/package.json
COPY packages/ai-core/package.json packages/ai-core/package.json
COPY packages/guardrails/package.json packages/guardrails/package.json
COPY packages/knowledge/package.json packages/knowledge/package.json
COPY packages/memory/package.json packages/memory/package.json
COPY packages/prompts/package.json packages/prompts/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/tools/package.json packages/tools/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/workflows/package.json packages/workflows/package.json
RUN pnpm install --frozen-lockfile

COPY . .
ARG DATABASE_URL="postgresql://buek:buek@postgres:5432/buek_core?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm --filter @buek/api prisma:generate
RUN pnpm --filter @buek/api... build

FROM node:22-alpine AS runtime

WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 4000
CMD ["sh", "apps/api/scripts/start.sh"]
