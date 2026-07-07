'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Video, Receipt, BadgeCheck, MapPin } from 'lucide-react';
import { useShcI18n, getTrustPageLayers } from '@shc/i18n';
import { SHCCard, SHCSectionTitle, SHCPageHeader } from '../../components/SHCWebComponents';

const LAYER_ICONS = {
  kitchen: Video,
  tasting: BadgeCheck,
  receipts: Receipt,
  guarantee: Shield,
  collection: MapPin,
} as const;

export function TrustPageContent() {
  const { t, locale } = useShcI18n();
  const layers = getTrustPageLayers(locale);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <SHCPageHeader title={t('nav.trust_safety')} subtitle={t('trust.page.subtitle')} />

      <div className="space-y-4 mb-10">
        {layers.map((layer) => {
          const Icon = LAYER_ICONS[layer.key];
          return (
            <SHCCard key={layer.key} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{layer.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{layer.desc}</p>
              </div>
            </SHCCard>
          );
        })}
      </div>

      <SHCCard>
        <SHCSectionTitle>{t('trust.section.allergen.title')}</SHCSectionTitle>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('trust.section.allergen.body')}</p>
      </SHCCard>

      <SHCCard className="mt-4">
        <SHCSectionTitle>{t('trust.section.cancellation.title')}</SHCSectionTitle>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>· {t('trust.section.cancellation.line1')}</li>
          <li>· {t('trust.section.cancellation.line2')}</li>
          <li>· {t('trust.section.cancellation.line3')}</li>
        </ul>
      </SHCCard>

      <SHCCard className="mt-4">
        <SHCSectionTitle>{t('trust.section.pdpa.title')}</SHCSectionTitle>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('trust.section.pdpa.body')}</p>
      </SHCCard>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-primary font-medium hover:underline">
          {t('trust.page.back')}
        </Link>
      </div>
    </div>
  );
}
