'use client';

import React, { useEffect } from 'react';
import { registerSharedDishLayout } from '@shc/ui/family-values-core';
import { GourmeatDishCard, SHCSharedDishImageWeb } from '../../components/SHCWebComponents';

const FIXTURE_DISH = {
  id: 'fv-dish-1',
  name: 'Laksa Lemak',
  cook_name: 'Auntie Mei',
  price: 12,
  cuisine: 'Peranakan',
  rating: 4.9,
};

/** Static page for Playwright morph/pixel evidence — no API required. */
export default function FamilyValuesFixturePage() {
  useEffect(() => {
    registerSharedDishLayout(FIXTURE_DISH.id, { x: 16, y: 120, w: 358, h: 140 });
  }, []);

  return (
    <div className="mx-auto max-w-[390px] min-h-[844px] bg-background" data-testid="fv-fixture-page">
      <header className="px-4 py-3 border-b border-border">
        <h1 className="text-sm font-extrabold text-foreground">Family Values fixture</h1>
        <p className="text-[11px] text-muted-foreground">Discover card + PDP hero (offline)</p>
      </header>
      <section className="p-4" data-testid="fv-discover-section">
        <GourmeatDishCard product={FIXTURE_DISH} />
      </section>
      <section className="border-t border-border" data-testid="fv-pdp-section">
        <div className="relative h-[280px] w-full bg-muted">
          <SHCSharedDishImageWeb
            dishId={FIXTURE_DISH.id}
            src={`https://picsum.photos/seed/${FIXTURE_DISH.id}/800/600`}
            alt={FIXTURE_DISH.name}
            className="absolute inset-0"
            hero
            testID={`shared-dish-${FIXTURE_DISH.id}-hero`}
          />
        </div>
        <div className="p-4">
          <h2 className="text-lg font-extrabold" data-testid="fv-pdp-name">
            {FIXTURE_DISH.name}
          </h2>
        </div>
      </section>
    </div>
  );
}