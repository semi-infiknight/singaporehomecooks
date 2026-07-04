'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CUISINE_IMAGE, getDishImageUrl } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useCookListings, useCreateCookListing } from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  SHCSectionTitle,
} from '../../components/SHCWebComponents';

export default function CookListingsPage() {
  const { user } = useCookAuth();
  const { data: myListings = [] } = useCookListings();
  const createListing = useCreateCookListing();

  const [name, setName] = useState('New Nyonya Dish');
  const [price, setPrice] = useState(14);
  const [minQty, setMinQty] = useState(4);
  const [cuisine, setCuisine] = useState('Peranakan');
  const [heritage, setHeritage] = useState('Family recipe from our HDB kitchen since 1978.');
  const [published, setPublished] = useState<Record<string, unknown> | null>(null);

  const previewImage = getDishImageUrl({ name, cuisine });

  const publish = async () => {
    try {
      const prod = await createListing.mutateAsync({
        name,
        price,
        min_qty: minQty,
        cuisine,
        occasion_tags: ['Hari Raya'],
        ingredients: [{ name: 'Chicken', quantity: 300, unit: 'g' }],
        allergen_tiers: { tier1: ['Nuts'], tier2: [], tier3: [] },
        heritage_note: heritage,
        image_url: `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/400/300`,
      });
      setPublished(prod as Record<string, unknown>);
    } catch (e) {
      alert((e as Error).message || 'Publish failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-listings-screen">
      <GourmeatCookHeader
        title="My Listings"
        subtitle={user?.name}
        testID="listings-hero"
        badges={
          <div className="flex flex-wrap gap-2">
            <SHCBadge variant="warning">⏸ Paused = hidden</SHCBadge>
            <SHCBadge variant="heritage">{cuisine}</SHCBadge>
            <SHCBadge variant="default">S${price}</SHCBadge>
          </div>
        }
      />

      <SHCSectionTitle>Published</SHCSectionTitle>
      {myListings.length === 0 ? (
        <GourmeatCard className="mb-4 bg-[var(--shc-bento-mint)] text-center">
          <div className="relative h-20 rounded-xl overflow-hidden mb-2">
            <Image src={CUISINE_IMAGE.Peranakan} alt="" fill className="object-cover" sizes="100vw" />
          </div>
          <SHCBadge variant="default">No listings yet</SHCBadge>
        </GourmeatCard>
      ) : (
        myListings.map((p: Record<string, unknown>) => (
          <GourmeatCard key={String(p.id)} className="mb-3">
            <div className="flex gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={getDishImageUrl({ name: String(p.name), cuisine: String(p.cuisine || '') })}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div>
                <p className="font-extrabold text-sm">{String(p.name)}</p>
                <div className="flex gap-1.5 mt-1">
                  <SHCBadge variant="default">S${String(p.price)}</SHCBadge>
                  <SHCBadge variant="heritage">min {String(p.min_qty)}</SHCBadge>
                </div>
              </div>
            </div>
          </GourmeatCard>
        ))
      )}

      <SHCSectionTitle>Create listing</SHCSectionTitle>
      <GourmeatCard>
        <div className="relative h-36 rounded-xl overflow-hidden mb-4">
          <Image src={previewImage} alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-border px-3 py-2 text-sm font-medium"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dish name"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              className="rounded-xl border border-border px-3 py-2 text-sm"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="Price"
            />
            <input
              type="number"
              className="rounded-xl border border-border px-3 py-2 text-sm"
              value={minQty}
              onChange={(e) => setMinQty(Number(e.target.value))}
              placeholder="Min qty"
            />
          </div>
          <input
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="Cuisine"
          />
          <textarea
            className="w-full rounded-xl border border-border px-3 py-2 text-sm min-h-[80px]"
            value={heritage}
            onChange={(e) => setHeritage(e.target.value)}
            placeholder="Heritage story"
          />
          <GourmeatPrimaryButton
            label={createListing.isPending ? 'Publishing…' : 'Publish listing'}
            disabled={createListing.isPending}
            onClick={publish}
            testID="publish-listing-btn"
          />
          {published ? (
            <p className="text-sm font-bold text-[var(--shc-success)]">Published: {String(published.name || name)}</p>
          ) : null}
        </div>
      </GourmeatCard>
    </div>
  );
}