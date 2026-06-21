# SHC Worker — cron jobs (payouts, escalation, notification retry)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/medusa/package.json ./apps/medusa/package.json
COPY apps/medusa/scripts ./apps/medusa/scripts
COPY apps/worker ./apps/worker
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @shc/types build
RUN pnpm --filter @shc/business-rules build
RUN pnpm --filter worker build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/medusa/scripts ./apps/medusa/scripts
COPY --from=build /app/apps/medusa/package.json ./apps/medusa/package.json
COPY --from=build /app/apps/worker ./apps/worker
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/worker
EXPOSE 3000
CMD ["node", "dist/index.js"]