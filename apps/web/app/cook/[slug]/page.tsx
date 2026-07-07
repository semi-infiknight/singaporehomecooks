'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Shield } from 'lucide-react';
import { useCook, useProducts } from '../../../lib/useProducts';
import { useAuth } from '../../../lib/useAuth';
import { useShcI18n, getCookProfileCopy } from '@shc/i18n';
import { SHCCard, SHCButton, SHCBadge, SHCSectionTitle, SHCLoading, SHCPageHeader } from '../../components/SHCWebComponents';
import { getHeritageArchive } from '../../../lib/api-client';

export default function CookProfile() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const { locale } = useShcI18n();
  const copy = getCookProfileCopy(locale);
  const { data: cook, isLoading } = useCook(slug);
  const { data: products = [] } = useProducts('');
  const { user } = useAuth();
  const [heritage, setHeritage] = React.useState<Array<{ title?: string; story?: string; created_at?: string }>>([]);

  React.useEffect(() => {
    if (cook?.id) getHeritageArchive(cook.id).then(setHeritage).catch(() => {});
  }, [cook?.id]);

  if (isLoading || !cook) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <SHCLoading label={copy.loading} />
      </div>
    );
  }

  const cookProducts = (products as Array<{ cook_id?: string; cook_name?: string }>).filter(
    (p) => p.cook_id === cook.id || p.cook_name?.includes(cook.display_name?.split('(')[0] || '')
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <SHCPageHeader title={cook.display_name} backHref="/" backLabel={copy.backLabel} />

      <div className="flex flex-wrap gap-2 mb-6">
        <SHCBadge variant="heritage">
          <MapPin className="w-3 h-3 inline mr-1" aria-hidden />
          {cook.area}
        </SHCBadge>
        {cook.status === 'active' && <SHCBadge variant="success">{copy.verified}</SHCBadge>}
        {cook.sfa_reg_number && (
          <SHCBadge>
            <Shield className="w-3 h-3 inline mr-1" aria-hidden />
            {copy.sfaRegistered}
          </SHCBadge>
        )}
      </div>

      <SHCCard className="mb-8">
        <p className="text-foreground leading-relaxed italic">{cook.story}</p>
        <div className="mt-4 pt-4 border-t border-border/60 text-sm text-muted-foreground space-y-1">
          <p>
            <span className="font-medium text-foreground">{copy.collectionArea}</span> {cook.collection_address}
          </p>
          <p>
            <span className="font-medium text-foreground">{copy.instructions}</span> {cook.collection_instructions}
          </p>
        </div>
      </SHCCard>

      <SHCSectionTitle subtitle={copy.heritageSubtitle}>{copy.heritageTitle}</SHCSectionTitle>
      <div className="grid gap-4 mb-10">
        {heritage.length > 0 ? (
          heritage.map((h, i) => (
            <SHCCard key={i}>
              <div className="font-medium text-foreground">{h.title}</div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{h.story}</p>
              {h.created_at && (
                <p className="text-xs text-primary mt-3">
                  {copy.published} {h.created_at.slice(0, 10)}
                </p>
              )}
            </SHCCard>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4">{copy.heritageEmpty}</p>
        )}
      </div>

      <SHCSectionTitle subtitle={copy.menuSubtitle(cookProducts.length)}>{copy.menuTitle}</SHCSectionTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        {(cookProducts as Array<Record<string, unknown>>).map((p) => (
          <Link key={String(p.id)} href={`/product/${p.id}`}>
            <SHCCard hover>
              <div className="font-semibold text-foreground">{String(p.name)}</div>
              <div className="text-sm text-primary mt-1">
                S${String(p.price)} {copy.perPortion}
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{String(p.heritage_note)}</p>
              <div className="mt-3">
                <SHCBadge variant="heritage">{String(p.cuisine)}</SHCBadge>
              </div>
            </SHCCard>
          </Link>
        ))}
      </div>

      {false && (
        <div className="mt-10 text-center">
          <Link href="/cook-portal">
            <SHCButton variant="outline">Manage your kitchen</SHCButton>
          </Link>
        </div>
      )}
    </div>
  );
}
