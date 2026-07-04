'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  CUISINE_IMAGE,
  filterCookListings,
  getDishImageUrl,
  uniqueListingCuisines,
  type CookListingStatusFilter,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import {
  useCookListings,
  useCreateCookListing,
  useUpdateCookListing,
  useDeleteCookListing,
} from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatSearchBar,
  FilterChipRow,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  SHCSectionTitle,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../../components/SHCWebComponents';

type ListingRow = Record<string, unknown> & {
  id?: string;
  name?: string;
  price?: number;
  min_qty?: number;
  cuisine?: string;
  heritage_note?: string;
  occasion_tags?: string[];
  ingredients?: Array<{ name: string; quantity: number; unit: string }>;
  image_url?: string;
  shc_availability?: { paused?: boolean };
};

const DEFAULT_FORM = {
  name: 'New Nyonya Dish',
  price: 14,
  minQty: 4,
  cuisine: 'Peranakan',
  heritage: 'Family recipe from our HDB kitchen since 1978.',
};

export default function CookListingsPage() {
  const { user } = useCookAuth();
  const { data: myListings = [] } = useCookListings();
  const createListing = useCreateCookListing();
  const updateListing = useUpdateCookListing();
  const deleteListing = useDeleteCookListing();
  const { openTray, pushTrayContent, popTray, dismiss } = useSHCTrayWeb();

  const [name, setName] = useState(DEFAULT_FORM.name);
  const [price, setPrice] = useState(DEFAULT_FORM.price);
  const [minQty, setMinQty] = useState(DEFAULT_FORM.minQty);
  const [cuisine, setCuisine] = useState(DEFAULT_FORM.cuisine);
  const [heritage, setHeritage] = useState(DEFAULT_FORM.heritage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [published, setPublished] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CookListingStatusFilter>('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showErrorTray = useCallback(
    (title: string, message: string) => {
      openTray(
        { id: 'listing-error', title, height: 'compact' },
        <SHCTrayActionWeb message={message} primaryLabel="OK" onPrimary={dismiss} testID="listing-error-tray" />
      );
    },
    [dismiss, openTray]
  );

  const filteredListings = useMemo(
    () => filterCookListings(myListings as ListingRow[], { q: searchQuery, status: statusFilter, cuisine: cuisineFilter }),
    [myListings, searchQuery, statusFilter, cuisineFilter]
  );

  const filterChips = useMemo(() => {
    const chips = [
      { id: 'status:all', label: 'All', active: statusFilter === 'all' && cuisineFilter === 'all' },
      { id: 'status:live', label: 'Live', active: statusFilter === 'live' },
      { id: 'status:paused', label: 'Paused', active: statusFilter === 'paused' },
      ...uniqueListingCuisines(myListings as ListingRow[]).map((cuisineName) => ({
        id: `cuisine:${cuisineName}`,
        label: cuisineName,
        active: cuisineFilter === cuisineName,
      })),
    ];
    return chips;
  }, [myListings, statusFilter, cuisineFilter]);

  const handleFilterChip = (chipId: string) => {
    if (chipId === 'status:all') {
      setStatusFilter('all');
      setCuisineFilter('all');
      return;
    }
    if (chipId.startsWith('status:')) {
      setStatusFilter(chipId.replace('status:', '') as CookListingStatusFilter);
      return;
    }
    if (chipId.startsWith('cuisine:')) {
      const cuisineName = chipId.replace('cuisine:', '');
      setCuisineFilter((prev) => (prev === cuisineName ? 'all' : cuisineName));
    }
  };

  const previewImage = getDishImageUrl({ name, cuisine });
  const saving = createListing.isPending || updateListing.isPending;

  const resetForm = () => {
    setEditingId(null);
    setName(DEFAULT_FORM.name);
    setPrice(DEFAULT_FORM.price);
    setMinQty(DEFAULT_FORM.minQty);
    setCuisine(DEFAULT_FORM.cuisine);
    setHeritage(DEFAULT_FORM.heritage);
    setPublished(null);
  };

  const startEdit = useCallback((listing: ListingRow) => {
    setEditingId(String(listing.id));
    setName(String(listing.name || 'Dish'));
    setPrice(Number(listing.price) || 12);
    setMinQty(Number(listing.min_qty) || 4);
    setCuisine(String(listing.cuisine || 'Singapore'));
    setHeritage(String(listing.heritage_note || ''));
    setPublished(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, []);

  const buildPayload = () => ({
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

  const saveListing = async () => {
    try {
      const payload = buildPayload();
      const prod = editingId
        ? await updateListing.mutateAsync({ id: editingId, input: payload })
        : await createListing.mutateAsync(payload);
      setPublished(prod as Record<string, unknown>);
      if (editingId) setEditingId(null);
    } catch (e) {
      showErrorTray(
        editingId ? 'Update failed' : 'Publish failed',
        (e as Error).message || (editingId ? 'Update failed' : 'Publish failed')
      );
    }
  };

  const performDelete = useCallback(
    async (listing: ListingRow) => {
      try {
        await deleteListing.mutateAsync(String(listing.id));
        if (editingId === listing.id) resetForm();
      } catch (e) {
        showErrorTray('Delete failed', (e as Error).message || 'Delete failed');
      }
    },
    [deleteListing, editingId, showErrorTray]
  );

  const togglePause = useCallback(
    async (listing: ListingRow) => {
      const paused = !listing.shc_availability?.paused;
      try {
        await updateListing.mutateAsync({ id: String(listing.id), input: { paused } });
      } catch (e) {
        showErrorTray(
          paused ? 'Pause failed' : 'Unpause failed',
          (e as Error).message || 'Could not update listing.'
        );
      }
    },
    [showErrorTray, updateListing]
  );

  const pushDeleteConfirm = useCallback(
    (listing: ListingRow) => {
      pushTrayContent(
        { id: 'listing-delete-confirm', title: 'Delete listing?', height: 'medium' },
        <SHCTrayActionWeb
          message={`Delete "${listing.name}"? This cannot be undone.`}
          primaryLabel="Delete listing"
          onPrimary={() => {
            dismiss();
            void performDelete(listing);
          }}
          secondaryLabel="Cancel"
          onSecondary={popTray}
          destructive
          testID="listing-delete-confirm-tray"
        />
      );
    },
    [dismiss, performDelete, popTray, pushTrayContent]
  );

  const showListingActions = useCallback(
    (listing: ListingRow) => {
      const isPaused = !!listing.shc_availability?.paused;
      openTray(
        { id: 'listing-actions', title: String(listing.name), height: 'compact' },
        <div className="flex flex-col gap-2" data-testid="listing-actions-tray">
          <button
            type="button"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold"
            data-testid={`edit-listing-${listing.id}`}
            onClick={() => {
              dismiss();
              startEdit(listing);
            }}
          >
            Edit listing
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold"
            data-testid={`pause-listing-${listing.id}`}
            onClick={() => {
              dismiss();
              void togglePause(listing);
            }}
          >
            {isPaused ? 'Unpause listing' : 'Pause listing'}
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-red-700"
            data-testid={`delete-listing-${listing.id}`}
            onClick={() => pushDeleteConfirm(listing)}
          >
            Delete listing
          </button>
        </div>
      );
    },
    [dismiss, openTray, pushDeleteConfirm, startEdit, togglePause]
  );

  const bindListingLongPress = useCallback(
    (listing: ListingRow) => ({
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        showListingActions(listing);
      },
      onTouchStart: () => {
        longPressTimer.current = setTimeout(() => showListingActions(listing), 500);
      },
      onTouchEnd: () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      },
      onTouchMove: () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      },
    }),
    [showListingActions]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-listings-screen">
      <GourmeatCookHeader
        title="My Listings"
        subtitle={
          myListings.length
            ? `${filteredListings.length} of ${myListings.length} dishes`
            : user?.name
        }
        testID="listings-hero"
      />

      <GourmeatSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search your dishes…"
        testID="cook-listings-search"
      />

      {myListings.length > 0 ? (
        <>
          <FilterChipRow
            chips={filterChips}
            onChipClick={handleFilterChip}
            testID="cook-listings-filter-chips"
          />
          <p className="text-xs text-[var(--shc-text-light)] mb-3">Press and hold a dish for edit, pause, or delete</p>
        </>
      ) : null}

      {myListings.length === 0 ? (
        <GourmeatCard className="mb-4 bg-[var(--shc-bento-mint)] text-center">
          <div className="relative h-20 rounded-xl overflow-hidden mb-2">
            <Image src={CUISINE_IMAGE.Peranakan} alt="" fill className="object-cover" sizes="100vw" />
          </div>
          <SHCBadge variant="default">No listings yet</SHCBadge>
        </GourmeatCard>
      ) : filteredListings.length === 0 ? (
        <GourmeatCard className="mb-4 bg-[var(--shc-bento-mint)] text-center">
          <SHCBadge variant="default">No dishes match your search</SHCBadge>
        </GourmeatCard>
      ) : (
        filteredListings.map((p: ListingRow) => (
          <div
            key={String(p.id)}
            className="mb-3 select-none touch-manipulation"
            data-testid={`listing-card-${p.id}`}
            {...bindListingLongPress(p)}
          >
          <GourmeatCard className="mb-0">
            <div className="flex gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={getDishImageUrl({
                    name: String(p.name),
                    cuisine: String(p.cuisine || ''),
                    image_url: p.image_url as string | undefined,
                  })}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm truncate">{String(p.name)}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <SHCBadge variant="default">S${String(p.price)}</SHCBadge>
                  <SHCBadge variant="heritage">min {String(p.min_qty)}</SHCBadge>
                  {p.shc_availability?.paused ? <SHCBadge variant="warning">Paused</SHCBadge> : null}
                </div>
              </div>
            </div>
          </GourmeatCard>
          </div>
        ))
      )}

      <SHCSectionTitle>{editingId ? 'Edit listing' : 'Create listing'}</SHCSectionTitle>
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
            label={saving ? (editingId ? 'Saving…' : 'Publishing…') : editingId ? 'Save changes' : 'Publish listing'}
            disabled={saving}
            onClick={saveListing}
            testID="publish-listing-btn"
          />
          {editingId ? (
            <button
              type="button"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm font-bold"
              onClick={resetForm}
            >
              Cancel edit
            </button>
          ) : null}
          {published ? (
            <p className="text-sm font-bold text-[var(--shc-success)]">
              {editingId ? 'Updated' : 'Published'}: {String(published.name || name)}
            </p>
          ) : null}
        </div>
      </GourmeatCard>
    </div>
  );
}