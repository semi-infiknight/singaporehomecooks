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
# Never use runtime wrapper during image build (dist/ does not exist yet)
RUN rm -f apps/medusa/medusa-config.js
RUN pnpm --filter @shc/types build
RUN pnpm --filter @shc/business-rules build
ENV MEDUSA_DISABLE_ADMIN=true
RUN pnpm --filter medusa build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV MEDUSA_DISABLE_ADMIN=true

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/medusa ./apps/medusa
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/medusa
RUN chmod +x docker-entrypoint.sh && \
  test -d dist/src || (echo "FATAL: dist/src missing — medusa build did not compile backend" && ls -la dist 2>/dev/null; exit 1) && \
  echo "[shc-medusa] Baking compiled sources from dist/ into src/..." && \
  for dir in api lib links modules subscribers utils workflows; do \
    if [ -d "dist/src/$dir" ]; then rm -rf "src/$dir" && cp -a "dist/src/$dir" "src/$dir"; fi; \
  done && \
  cp dist/medusa-config.js medusa-config.js && \
  rm -f medusa-config.ts && \
  find src -type f \( -name '*.ts' -o -name '*.tsx' \) -delete

EXPOSE 9000
ENTRYPOINT ["./docker-entrypoint.sh"]