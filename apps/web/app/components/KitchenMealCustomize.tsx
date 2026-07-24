'use client';

/**
 * HomelyEats-style meal customize sheet for kitchen order flow.
 * Extra (single) · Add-ons · qty · Add item.
 */
import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  getDishImageUrl,
  buildCustomizeDraft,
  kitchenMealExtraOptions,
  kitchenMealAddonOptions,
  kitchenMealMetaChips,
  kitchenCustomizeUnitPrice,
  kitchenCustomizeAddButtonLabel,
  adjustMealQty,
  toggleAddonId,
  draftToOrderLine,
  type KitchenMealCustomizeDraft,
  type KitchenOrderLine,
  recipeHasStory,
  recipeStoryProps,
} from '@shc/utils';
import { SHCButton, RecipeStoryCard } from './SHCWebComponents';

export function KitchenMealCustomizeSheet({
  dish,
  open,
  onClose,
  onConfirm,
}: {
  dish: Record<string, unknown> | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (line: KitchenOrderLine) => void;
}) {
  const [draft, setDraft] = useState<KitchenMealCustomizeDraft | null>(null);

  useEffect(() => {
    if (dish && open) setDraft(buildCustomizeDraft(dish));
    if (!open) setDraft(null);
  }, [dish, open]);

  const extras = useMemo(() => (dish ? kitchenMealExtraOptions(dish) : []), [dish]);
  const addons = useMemo(() => (dish ? kitchenMealAddonOptions(dish) : []), [dish]);
  const chips = useMemo(() => (dish ? kitchenMealMetaChips(dish) : []), [dish]);

  if (!open || !dish || !draft) return null;

  const unit = kitchenCustomizeUnitPrice(draft, { extras, addons });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      data-testid="kitchen-customize-sheet"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card shadow-[var(--shc-shadow-brutal)] p-4 pb-6">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-black text-lg leading-tight" data-testid="kitchen-customize-title">
              {draft.productName}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1 line-clamp-2">
              {dish.description
                ? String(dish.description).slice(0, 100)
                : dish.cuisine
                  ? `${dish.cuisine} dish`
                  : 'Home-cooked portion'}
            </p>
          </div>
          <button type="button" className="text-xl font-light px-2" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-muted">
          <Image
            src={getDishImageUrl({
              id: String(dish.id),
              cuisine: dish.cuisine ? String(dish.cuisine) : undefined,
              name: String(dish.name),
            })}
            alt=""
            fill
            className="object-cover"
            sizes="400px"
          />
        </div>

        {recipeHasStory(dish) ? (
          <RecipeStoryCard
            {...recipeStoryProps(dish, dish.cook_name ? String(dish.cook_name) : undefined)}
            testID="kitchen-customize-recipe"
          />
        ) : null}

        <div className="flex flex-wrap gap-2 mb-4" data-testid="kitchen-customize-chips">
          {chips.map((c) => (
            <span
              key={c.id}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-[var(--shc-border-brutal)] bg-secondary"
            >
              {c.label}
            </span>
          ))}
        </div>

        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">
          Extra · select one
        </p>
        <ul className="space-y-2 mb-4" data-testid="kitchen-customize-extras">
          {extras.map((e) => {
            const on = draft.extraId === e.id;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setDraft((d) => (d ? { ...d, extraId: e.id } : d))}
                  className={`w-full flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left ${
                    on ? 'border-primary bg-primary/5' : 'border-[var(--shc-border-brutal)]'
                  }`}
                  data-testid={`kitchen-extra-${e.id}`}
                >
                  <span className="font-bold text-sm">{e.label}</span>
                  <span className="text-sm font-extrabold tabular-nums">
                    {e.priceDelta > 0 ? `+S$${e.priceDelta}` : 'S$0'} {on ? '✓' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">
          Add-on · optional
        </p>
        <ul className="space-y-2 mb-4" data-testid="kitchen-customize-addons">
          {addons.map((a) => {
            const on = draft.addonIds.includes(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => (d ? { ...d, addonIds: toggleAddonId(d.addonIds, a.id) } : d))
                  }
                  className={`w-full flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left ${
                    on ? 'border-primary bg-primary/5' : 'border-[var(--shc-border-brutal)]'
                  }`}
                  data-testid={`kitchen-addon-${a.id}`}
                >
                  <span className="font-bold text-sm">{a.label}</span>
                  <span className="text-sm font-extrabold">
                    +S${a.priceDelta} {on ? '✓' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 border-2 border-[var(--shc-border-brutal)] rounded-xl px-2 py-1">
            <button
              type="button"
              className="w-9 h-9 font-black text-lg"
              data-testid="kitchen-qty-minus"
              onClick={() => setDraft((d) => (d ? { ...d, qty: adjustMealQty(d.qty, -1) } : d))}
            >
              −
            </button>
            <span className="font-black tabular-nums w-6 text-center" data-testid="kitchen-qty-value">
              {draft.qty}
            </span>
            <button
              type="button"
              className="w-9 h-9 font-black text-lg"
              data-testid="kitchen-qty-plus"
              onClick={() => setDraft((d) => (d ? { ...d, qty: adjustMealQty(d.qty, 1) } : d))}
            >
              +
            </button>
          </div>
          <SHCButton
            className="flex-1"
            testID="kitchen-customize-add-btn"
            onClick={() => {
              onConfirm(draftToOrderLine(draft, extras, addons));
              onClose();
            }}
          >
            {kitchenCustomizeAddButtonLabel(unit)}
          </SHCButton>
        </div>
      </div>
    </div>
  );
}
