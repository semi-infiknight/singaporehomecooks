'use client';

import React, { useMemo } from 'react';
import * as Localization from 'expo-localization';
import { ShcI18nProvider, normalizeLocale, type ShcLocale } from '@shc/i18n';

export function MobileI18nProvider({ children }: { children: React.ReactNode }) {
  const initialLocale = useMemo<ShcLocale>(() => {
    const device = Localization.getLocales?.()[0]?.languageTag;
    return normalizeLocale(device);
  }, []);

  return <ShcI18nProvider initialLocale={initialLocale}>{children}</ShcI18nProvider>;
}
