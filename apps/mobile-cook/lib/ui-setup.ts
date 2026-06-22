import { createTamagui } from '@tamagui/core';
import { config as tamaguiDefaultConfig } from '@tamagui/config/v3';
import { shcColors, shcNativeWindTheme, shcRadii, shcSpacing } from '@shc/ui';

export { shcNativeWindTheme };

/** Lightweight Tamagui config — no provider wired yet; ready for future screens. */
export const shcTamaguiConfig = createTamagui({
  ...tamaguiDefaultConfig,
  tokens: {
    ...tamaguiDefaultConfig.tokens,
    color: {
      ...tamaguiDefaultConfig.tokens.color,
      shcPrimary: shcColors.primary,
      shcPrimaryDark: shcColors.primaryDark,
      shcAccent: shcColors.accent,
      shcBackground: shcColors.background,
      shcSurface: shcColors.surface,
      shcText: shcColors.text,
      shcBorder: shcColors.border,
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