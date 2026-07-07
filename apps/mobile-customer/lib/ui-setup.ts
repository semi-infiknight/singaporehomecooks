import { createTamagui } from '@tamagui/core';
import { config as tamaguiDefaultConfig } from '@tamagui/config/v3';
import { gourmeatColors, shcNativeWindTheme, shcRadii, shcSpacing } from '@shc/ui';

export { shcNativeWindTheme };

/** Lightweight Tamagui config — customer Gourmeat tokens for future screens. */
export const shcTamaguiConfig = createTamagui({
  ...tamaguiDefaultConfig,
  tokens: {
    ...tamaguiDefaultConfig.tokens,
    color: {
      ...tamaguiDefaultConfig.tokens.color,
      shcPrimary: gourmeatColors.primary,
      shcPrimaryDark: gourmeatColors.primaryDark,
      shcAccent: gourmeatColors.accent,
      shcBackground: gourmeatColors.background,
      shcSurface: gourmeatColors.surface,
      shcText: gourmeatColors.text,
      shcBorder: gourmeatColors.border,
    },
    space: {
      ...tamaguiDefaultConfig.tokens.space,
      shcXs: shcSpacing.xs,
      shcSm: shcSpacing.sm,
      shcMd: shcSpacing.md,
      shcLg: shcSpacing.lg,
      shcXl: shcSpacing.xl,
    },
    radius: {
      ...tamaguiDefaultConfig.tokens.radius,
      shcSm: shcRadii.sm,
      shcMd: shcRadii.md,
      shcLg: shcRadii.lg,
      shcXl: shcRadii.xl,
    },
  },
});

export type SHCTamaguiConfig = typeof shcTamaguiConfig;
