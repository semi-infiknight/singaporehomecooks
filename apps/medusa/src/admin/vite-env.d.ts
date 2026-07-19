/** Minimal Vite env types for Medusa Admin (no vite package in medusa deps). */
interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
