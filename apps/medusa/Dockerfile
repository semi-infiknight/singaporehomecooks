# Singapore Home Cooks — Medusa API (Railway / production)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/medusa ./apps/medusa
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN rm -f apps/medusa/medusa-config.js
RUN pnpm --filter @shc/types build
RUN pnpm --filter @shc/business-rules build
ENV MEDUSA_DISABLE_ADMIN=false
RUN pnpm --filter medusa build:admin

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV MEDUSA_DISABLE_ADMIN=false

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/medusa ./apps/medusa
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/medusa
RUN chmod +x docker-entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["./docker-entrypoint.sh"]