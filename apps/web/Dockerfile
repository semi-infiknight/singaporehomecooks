# Singapore Home Cooks — Next.js web (Railway)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG NEXT_PUBLIC_SHC_API_BASE=http://localhost:9000
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_build_placeholder
ENV NEXT_PUBLIC_SHC_API_BASE=$NEXT_PUBLIC_SHC_API_BASE
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
RUN pnpm --filter @shc/types build
RUN pnpm --filter @shc/business-rules build
RUN pnpm --filter @shc/utils build
RUN pnpm --filter @shc/ui build
RUN pnpm --filter @shc/api-client build
RUN pnpm --filter web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Standalone server + static assets + public PWA files (manifest, sw.js, icons)
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

WORKDIR /app/apps/web
EXPOSE 3001
CMD ["node", "server.js"]