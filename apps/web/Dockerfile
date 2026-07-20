# Singapore Home Cooks — Next.js web (Railway)
FROM node:22-alpine3.20 AS base
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/web/.railway-build-id ./apps/web/.railway-build-id
# Root postinstall runs scripts/sync-railway-env.mjs (local client .env) — not in this image context.
# Match medusa Dockerfile: skip lifecycle scripts during install.
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
# Bust Railway Docker layer cache when redeploying PWA/asset fixes.
ARG RAILWAY_DEPLOY_REVISION=unset
RUN BUILD_ID="$(cat apps/web/.railway-build-id)" && echo "railway deploy revision: ${RAILWAY_DEPLOY_REVISION:-$BUILD_ID}" && echo "railway-build-id: $BUILD_ID"
# Railway service variables are injected as build-args when set on the service.
ARG NEXT_PUBLIC_SHC_API_BASE
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SHC_API_BASE=${NEXT_PUBLIC_SHC_API_BASE:-http://localhost:9000}
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:-pk_build_placeholder}
RUN pnpm --filter @shc/types build
RUN pnpm --filter @shc/business-rules build
RUN pnpm --filter @shc/utils build
# @shc/ui typecheck needs the full mobile peer graph (React 18 + Expo); this image only
# copies packages + web, so typecheck the shipped surface instead.
RUN pnpm --filter web typecheck
RUN pnpm --filter @shc/api-client build
RUN pnpm --filter web build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web ./apps/web
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/web
EXPOSE 3001
CMD ["pnpm", "start"]