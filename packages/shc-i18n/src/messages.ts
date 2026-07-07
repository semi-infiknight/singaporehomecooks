import { en, type MessageKey } from './locales/en';
import { zhHans } from './locales/zh-Hans';

export type ShcLocale = 'en' | 'zh-Hans';

export const DEFAULT_LOCALE: ShcLocale = 'en';
export const SUPPORTED_LOCALES: ShcLocale[] = ['en', 'zh-Hans'];

const catalogs: Record<ShcLocale, Record<MessageKey, string>> = {
  en,
  'zh-Hans': zhHans,
};

export function normalizeLocale(input?: string | null): ShcLocale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  if (lower.startsWith('zh')) return 'zh-Hans';
  return 'en';
}

export function t(locale: ShcLocale, key: MessageKey): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? key;
}

export { en, zhHans, type MessageKey };
