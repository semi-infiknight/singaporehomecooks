/** Dev-only UI (role switcher, localhost links). Hidden in production unless explicitly enabled. */
export const showDevTools =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_DEV_TOOLS === '1';