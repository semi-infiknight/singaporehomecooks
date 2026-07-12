import Medusa from "@medusajs/js-sdk"

/**
 * Admin JS SDK — session cookies match Medusa Admin login.
 * Used by SHC custom UI routes under /app/shc-ops/*
 */
export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})
