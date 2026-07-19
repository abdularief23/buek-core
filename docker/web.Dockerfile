FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_APP_BUILD=dev
ENV VITE_APP_BUILD=$VITE_APP_BUILD
RUN pnpm --filter @buek/web... build
RUN printf '{"build":"%s","featureSet":"engineering-copilot-v2","deployedAt":"%s"}\n' \
  "$VITE_APP_BUILD" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  > /app/apps/web/dist/version.json

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
