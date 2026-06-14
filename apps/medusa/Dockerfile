# Singapore Home Cooks — Medusa API (Railway / production)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/medusa ./apps/medusa
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @shc/types build
RUN pnpm --filter @shc/business-rules build
ENV MEDUSA_DISABLE_ADMIN=true
RUN pnpm --filter medusa build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV MEDUSA_DISABLE_ADMIN=true

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/medusa ./apps/medusa
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/medusa
EXPOSE 9000
CMD ["pnpm", "exec", "medusa", "start"]