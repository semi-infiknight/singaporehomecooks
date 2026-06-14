import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { modules } from "./src/modules";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const DATABASE_URL = process.env.DATABASE_URL || "postgres://shc:shc_dev@localhost:5432/shc_medusa";

export default defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8081,http://localhost:3000,http://127.0.0.1:*,https://*.trycloudflare.com",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000,http://localhost:3000,http://127.0.0.1:*,https://*.trycloudflare.com",
      authCors: process.env.AUTH_CORS || "http://localhost:9000,http://localhost:8081,http://127.0.0.1:*,https://*.trycloudflare.com",
      jwtSecret: process.env.JWT_SECRET || "supersecret_jwt_for_shc_local_only_change_in_prod",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret_cookie_for_shc_local_only_change_in_prod",
    },
  },
  admin: {
    // Admin UI bundle is optional for SHC API/mobile integration; enable when ops needs dashboard.
    disable: process.env.MEDUSA_DISABLE_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    ...modules,
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY || "sk_test_placeholder",
            },
          },
        ],
      },
    },
  ],
  // logger config handled via env / Medusa defaults (pino in prod); removed invalid key for TS during build
});
