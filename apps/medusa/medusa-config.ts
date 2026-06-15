import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { modules } from "./src/modules";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const DATABASE_URL = process.env.DATABASE_URL || "postgres://shc:shc_dev@localhost:5432/shc_medusa";

const LOCAL_CORS =
  "http://localhost:8081,http://localhost:8082,http://localhost:3000,http://localhost:3001,http://127.0.0.1:9000,http://127.0.0.1:3001,https://*.trycloudflare.com";
const railwayOrigin = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `,https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : "";
const webOrigin = process.env.WEB_PUBLIC_URL ? `,${process.env.WEB_PUBLIC_URL}` : "";

export default defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || `${LOCAL_CORS}${railwayOrigin}${webOrigin}`,
      adminCors: process.env.ADMIN_CORS || `${LOCAL_CORS}${railwayOrigin}${webOrigin}`,
      authCors: process.env.AUTH_CORS || `${LOCAL_CORS}${railwayOrigin}${webOrigin}`,
      jwtSecret: process.env.JWT_SECRET || "supersecret_jwt_for_shc_local_only_change_in_prod",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret_cookie_for_shc_local_only_change_in_prod",
    },
  },
  admin: {
    // Admin UI bundle is optional for SHC API/mobile integration; enable when ops needs dashboard.
    disable: process.env.MEDUSA_DISABLE_ADMIN === "true",
    // Use same-origin in dev so login works whether you open localhost or 127.0.0.1.
    // Set MEDUSA_BACKEND_URL in production (e.g. Railway).
    backendUrl: process.env.MEDUSA_BACKEND_URL || "/",
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
