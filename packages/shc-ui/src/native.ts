// Mobile UI stack helpers — NativeWind theme tokens.
// Keep in sync with theme.ts, nativewind-theme.cjs, and apps/web/app/globals.css.

import { shcBorders, shcColors, shcRadii, shcSpacing } from './theme';

/** NativeWind/Tailwind `theme.extend` values (also mirrored in nativewind-theme.cjs). */
export const shcNativeWindTheme = {
  colors: shcColors,
  spacing: shcSpacing,
  borderRadius: shcRadii,
  borderWidth: shcBorders,
} as const;