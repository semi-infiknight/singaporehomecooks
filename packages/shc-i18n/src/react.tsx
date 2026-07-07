'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, normalizeLocale, t, type MessageKey, type ShcLocale } from './messages';

type I18nContextValue = {
  locale: ShcLocale;
  setLocale: (locale: ShcLocale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'shc-locale';

function readStoredLocale(): ShcLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeLocale(stored);
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function ShcI18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: ShcLocale;
}) {
  const [locale, setLocaleState] = useState<ShcLocale>(initialLocale ?? readStoredLocale);

  const setLocale = useCallback((next: ShcLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next === 'zh-Hans' ? 'zh-Hans' : 'en';
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey) => t(locale, key),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useShcI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE as ShcLocale,
      setLocale: () => {},
      t: (key: MessageKey) => t(DEFAULT_LOCALE, key),
    };
  }
  return ctx;
}
