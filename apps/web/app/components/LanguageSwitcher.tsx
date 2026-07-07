'use client';

import { SHCButton } from './SHCWebComponents';
import { useShcI18n } from '@shc/i18n';
import type { ShcLocale } from '@shc/i18n';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useShcI18n();

  const options: { value: ShcLocale; label: string }[] = [
    { value: 'en', label: t('language.en') },
    { value: 'zh-Hans', label: t('language.zh') },
  ];

  return (
    <label className={`inline-flex items-center gap-2 text-xs font-bold ${className}`}>
      <span className="text-muted-foreground">{t('language.label')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as ShcLocale)}
        className="shc-input py-1 px-2 text-xs font-bold"
        data-testid="language-switcher-web"
        aria-label={t('language.label')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
