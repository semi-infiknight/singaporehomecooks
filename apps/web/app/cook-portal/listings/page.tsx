'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BENTO_ACTION_IMAGES,
  CUISINE_IMAGE,
  filterCookListings,
  getDishImageUrl,
  uniqueListingCuisines,
  resolveCookListingsForDisplay,
  cookListingE2eTestId,
  type CookListingStatusFilter,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import {
  useCookListings,
  useCreateCookListing,
  useUpdateCookListing,
  useDeleteCookListing,
} from '../../../lib/useCookPortal';
import { useAICalorieEstimate } from '../../../lib/useProducts';
import { getPhotoTips } from '../../../lib/api-client';
import {
  GourmeatCookHeader,
  GourmeatSearchBar,
  FilterChipRow,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  SHCSectionTitle,
  SHCButton,
  useSHCTrayWeb,
  SHCTrayActionWeb,
  SHCWizardPaneWeb,
  SHCWizardProgressWeb,
  ListingWizardMorphCtaWeb,
  SHCCelebrationWeb,
  useMilestoneCelebrationWeb,
  PhotoTipsTrayContentWeb,
  CalorieBadge,
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
  calories?: number;
  calories_confidence?: string;
};

const OCCASION_OPTIONS = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Family Gathering', 'Birthday'];
const DEFAULT_FORM = {
  name: 'New Nyonya Dish',
  price: 14,
  minQty: 4,
  cuisine: 'Peranakan',
  heritage: 'Family recipe from our HDB kitchen since 1978.',
};

export default function CookListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useCookAuth();
  const { data: myListings = [] } = useCookListings();
  const createListing = useCreateCookListing();
  const updateListing = useUpdateCookListing();
  const deleteListing = useDeleteCookListing();
  const aiEstMut = useAICalorieEstimate();
  const { openTray, pushTrayContent, popTray, dismiss } = useSHCTrayWeb();
  const wizardRef = useRef<HTMLDivElement>(null);

  const step = Math.min(4, Math.max(1, parseInt(searchParams.get('step') || '1', 10) || 1));
  const goToStep = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', String(next));
    router.replace(`?${params.toString()}`, { scroll: false });
    wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [name, setName] = useState(DEFAULT_FORM.name);
  const [price, setPrice] = useState(DEFAULT_FORM.price);
  const [minQty, setMinQty] = useState(DEFAULT_FORM.minQty);
  const [cuisine, setCuisine] = useState(DEFAULT_FORM.cuisine);
  const [heritage, setHeritage] = useState(DEFAULT_FORM.heritage);
  const [occasionTags, setOccasionTags] = useState<string[]>(['Hari Raya']);
  const [ingredients, setIngredients] = useState([{ name: 'Chicken', quantity: 300, unit: 'g' }]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [published, setPublished] = useState<Record<string, unknown> | null>(null);
  const [aiCal, setAiCal] = useState<{ calories: number; confidence: string; source?: string } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CookListingStatusFilter>('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maestroE2e = process.env.NEXT_PUBLIC_MAESTRO_E2E === '1';
  const listingsForDisplay = useMemo(
    () => resolveCookListingsForDisplay(myListings as ListingRow[], { dev: process.env.NODE_ENV === 'development', maestroE2e }),
    [myListings, maestroE2e]
  );

  const {
    show: showCelebration,
    triggerIfFirst,
    dismiss: dismissCelebration,
  } = useMilestoneCelebrationWeb('first_listing_publish', user?.id || '');

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
    () => filterCookListings(listingsForDisplay, { q: searchQuery, status: statusFilter, cuisine: cuisineFilter }),
    [listingsForDisplay, searchQuery, statusFilter, cuisineFilter]
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

  const resetWizard = () => {
    setEditingId(null);
    setName(DEFAULT_FORM.name);
    setPrice(DEFAULT_FORM.price);
    setMinQty(DEFAULT_FORM.minQty);
    setCuisine(DEFAULT_FORM.cuisine);
    setOccasionTags(['Hari Raya']);
    setIngredients([{ name: 'Chicken', quantity: 300, unit: 'g' }]);
    setHeritage(DEFAULT_FORM.heritage);
    setPublished(null);
    setAiCal(null);
    goToStep(1);
  };

  const startEdit = useCallback((listing: ListingRow) => {
    setEditingId(String(listing.id));
    setName(String(listing.name || 'Dish'));
    setPrice(Number(listing.price) || 12);
    setMinQty(Number(listing.min_qty) || 4);
    setCuisine(String(listing.cuisine || 'Singapore'));
    setOccasionTags(listing.occasion_tags?.length ? listing.occasion_tags : ['Hari Raya']);
    setIngredients(
      listing.ingredients?.length ? listing.ingredients : [{ name: 'Chicken', quantity: 300, unit: 'g' }]
    );
    setHeritage(String(listing.heritage_note || ''));
    setPublished(null);
    setAiCal(
      listing.calories
        ? { calories: listing.calories, confidence: listing.calories_confidence || 'category', source: 'saved' }
        : null
    );
    goToStep(1);
    wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const toggleTag = (tag: string) => {
    setOccasionTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const openPhotoTipsTray = async () => {
    const tipsRes = await getPhotoTips();
    const tipList = (tipsRes as { tips?: string[] }).tips || [
      'Natural light from a window — avoid harsh overhead kitchen fluorescents.',
      'Shoot at 45° with a clean plate rim visible — families trust tidy presentation.',
      'Include a heritage prop (e.g. tiffin carrier, batik cloth) for Singapore story.',
    ];
    openTray(
      { id: 'photo-tips', title: 'Photo tips', height: 'tall' },
      <PhotoTipsTrayContentWeb tips={tipList} />
    );
  };

  const publish = async () => {
    setPublishing(true);
    const input: Record<string, unknown> = {
      name,
      price,
      min_qty: minQty,
      cuisine,
      occasion_tags: occasionTags,
      ingredients,
      allergen_tiers: { tier1: ['Nuts'], tier2: [], tier3: [] },
      heritage_note: heritage,
      image_url: `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/400/300`,
    };
    if (aiCal) {
      input.calories = aiCal.calories;
      input.calories_confidence = aiCal.confidence;
    }
    try {
      const prod = editingId
        ? await updateListing.mutateAsync({ id: editingId, input })
        : await createListing.mutateAsync(input);
      setPublished(prod as Record<string, unknown>);
      if (!editingId) {
        await triggerIfFirst();
      }
      if (editingId) setEditingId(null);
      goToStep(1);
      setAiCal(null);
    } catch (e) {
      showErrorTray(
        editingId ? 'Update failed' : 'Publish failed',
        (e as Error).message || 'Could not save listing.'
      );
    } finally {
      setPublishing(false);
    }
  };

  const performDelete = useCallback(
    async (listing: ListingRow) => {
      try {
        await deleteListing.mutateAsync(String(listing.id));
        if (editingId === listing.id) resetWizard();
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
        showErrorTray(paused ? 'Pause failed' : 'Unpause failed', (e as Error).message || 'Could not update listing.');
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

  const saving = createListing.isPending || updateListing.isPending || publishing;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-listings-screen">
      <GourmeatCookHeader
        title="My Listings"
        subtitle={
          listingsForDisplay.length
            ? `${filteredListings.length} of ${listingsForDisplay.length} dishes`
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

      {listingsForDisplay.length > 0 ? (
        <>
          <FilterChipRow
            chips={filterChips}
            onChipClick={handleFilterChip}
            testID="cook-listings-filter-chips"
          />
          <p className="text-xs text-[var(--shc-text-light)] mb-3">Press and hold a dish for edit, pause, or delete</p>
        </>
      ) : null}

      {listingsForDisplay.length === 0 ? (
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
        filteredListings.map((p: ListingRow, index: number) => (
          <div
            key={String(p.id)}
            className="mb-3 select-none touch-manipulation"
            data-testid={cookListingE2eTestId(p, index)}
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

      <div ref={wizardRef}>
        <SHCSectionTitle>{editingId ? 'Edit listing' : 'New listing'}</SHCSectionTitle>
        <SHCWizardProgressWeb step={step} />
      </div>

      <GourmeatCard>
        <SHCWizardPaneWeb stepKey={step}>
          {step === 1 && (
            <div className="space-y-3" data-testid="listing-wizard-step1">
              <div className="relative h-28 rounded-xl overflow-hidden">
                <Image src={previewImage} alt="" fill className="object-cover" sizes="100vw" />
              </div>
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
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3" data-testid="listing-wizard-step2">
              <div className="relative h-20 rounded-xl overflow-hidden">
                <Image
                  src={CUISINE_IMAGE[cuisine as keyof typeof CUISINE_IMAGE] || BENTO_ACTION_IMAGES.listings}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
              <input
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="Cuisine"
              />
              <div className="flex flex-wrap gap-2">
                {OCCASION_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-bold ${
                      occasionTags.includes(tag) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3" data-testid="listing-wizard-step3">
              <div className="rounded-xl border border-border p-3 text-sm">
                <p className="font-bold mb-1">{ingredients[0]?.name || 'Chicken'}</p>
                <p className="text-muted-foreground text-xs">
                  {ingredients[0]?.quantity} {ingredients[0]?.unit}
                </p>
              </div>
              <SHCButton
                variant="outline"
                onClick={async () => {
                  const est = await aiEstMut.mutateAsync(ingredients);
                  setAiCal(est as { calories: number; confidence: string; source?: string });
                }}
                testID="ai-cal-est-btn"
              >
                🔥 AI Calories
              </SHCButton>
              {aiCal ? <CalorieBadge calories={aiCal.calories} /> : null}
              <button
                type="button"
                onClick={openPhotoTipsTray}
                className="flex items-center gap-2 w-full rounded-xl border border-border p-3 text-left"
                data-testid="photo-tips-btn"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <Image src={BENTO_ACTION_IMAGES.listings} alt="" fill className="object-cover" sizes="48px" />
                </div>
                <SHCBadge variant="heritage">📸 Photo tips</SHCBadge>
              </button>
              <textarea
                className="w-full rounded-xl border border-border px-3 py-2 text-sm min-h-[80px]"
                value={heritage}
                onChange={(e) => setHeritage(e.target.value)}
                placeholder="Heritage story"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3" data-testid="listing-wizard-step4">
              <div className="relative h-32 rounded-xl overflow-hidden">
                <Image src={previewImage} alt="" fill className="object-cover" sizes="100vw" />
                <div className="absolute inset-0 bg-black/35 flex items-end p-3 gap-2">
                  <p className="text-white font-extrabold flex-1">{name}</p>
                  <SHCBadge variant="default">S${price}</SHCBadge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Earnings preview: S${Math.floor(price * minQty * 0.85)} per minimum order
              </p>
              <div className="flex flex-wrap gap-1">
                {occasionTags.map((t) => (
                  <SHCBadge key={t} variant="heritage">
                    {t}
                  </SHCBadge>
                ))}
              </div>
              {editingId ? (
                <GourmeatPrimaryButton label="Cancel edit" onClick={resetWizard} />
              ) : null}
              {published ? (
                <p className="text-sm font-bold text-[var(--shc-success)]">
                  Live: {String(published.name || name)}
                </p>
              ) : null}
            </div>
          )}
        </SHCWizardPaneWeb>

        <div className={`flex gap-2 mt-4 ${step === 1 ? '' : ''}`}>
          {step > 1 && step <= 4 ? (
            <SHCButton variant="outline" onClick={() => goToStep(step - 1)} testID={`listing-wizard-back-step${step}`}>
              ←
            </SHCButton>
          ) : null}
          <div className="flex-1">
            <ListingWizardMorphCtaWeb
              step={step}
              editing={!!editingId}
              onPress={step >= 4 ? publish : () => goToStep(step + 1)}
              disabled={step >= 4 && saving}
              testID={step >= 4 ? 'listing-wizard-publish' : `listing-wizard-next-step${step}`}
              showChevron={step < 4}
            />
          </div>
        </div>
      </GourmeatCard>

      <SHCCelebrationWeb
        visible={showCelebration}
        message="Your first dish is live! Families can now discover your heritage cooking."
        onDone={dismissCelebration}
        testID="first-listing-celebration"
      />
    </div>
  );
}