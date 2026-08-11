import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Unit/integration tests must not inherit host NODE_ENV=production (blocks @shc.local, strict passwords).
    env: {
      NODE_ENV: "test",
      SHC_ALLOW_DEMO_EMAILS: "1",
      SHC_STRICT_PASSWORD: "0",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/api/store/shc/listings/route.ts",
        "src/api/store/shc/compliance/route.ts",
        "src/api/store/shc/cook-expenses/route.ts",
        "src/api/store/shc/products/route.ts",
        "src/api/store/shc/products/\\[id\\]/route.ts",
        "src/api/store/shc/cooks/route.ts",
        "src/api/store/shc/requests/route.ts",
        "src/api/store/shc/push-token/route.ts",
        "src/api/store/shc/feature-flags/route.ts",
        "src/api/store/shc/bids/\\[id\\]/accept/route.ts",
        "src/api/store/shc/orders/\\[id\\]/corporate/route.ts",
        "src/api/store/shc/orders/\\[id\\]/dispute/route.ts",
        "src/api/admin/shc/feature-flags/route.ts",
        "src/api/admin/shc/disputes/route.ts",
        "src/api/admin/shc/disputes/\\[id\\]/route.ts",
        "src/api/admin/shc/commission-rules/route.ts",
        "src/api/admin/shc/cook-expenses/route.ts",
        "src/api/admin/shc/search-synonyms/route.ts",
        "src/api/admin/shc/platform-stats/route.ts",
        "src/api/admin/shc/internal/order-escalation/route.ts",
        "src/api/admin/shc/internal/notification-retry/route.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 25,
        statements: 80,
      },
    },
  },
});
