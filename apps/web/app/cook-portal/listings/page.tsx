'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  VIRTUAL_LISTING_ROW_HEIGHT,
  buildCookListingPayload,
  emptyAllergenTiers,
  DEFAULT_LISTING_AVAILABILITY,
  allergenTiersFromListing,
  availabilityFromListing,
  shcPortionMinBadgeLabel,
  shcUploadTypeBadgeLabel,
  defaultMealExtrasDraft,
  defaultMealAddonsDraft,
  mealOptionsFromListing,
  recipeStepsFromListing,
  cookAllergenTier1Presets,
  resolveCookCollectionTimeSlots,
  defaultListingOccasionTag,
  listingOccasionTagOptions,
  cookEarningsPreviewFromDollars,
  validateCookListingDraft,
  validateCookListingWizardStep,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useCookConfig } from '../../../lib/useCookConfig';
import { useBusinessRules } from '../../../lib/useBusinessRules';
import { useCookProfile } from '../../../lib/useCookPortal';
import { useCustomerConfig } from '../../../lib/useCustomerConfig';
import {
  useCookListings,
  useCreateCookListing,
  useUpdateCookListing,
  useDeleteCookListing,
} from '../../../lib/useCookPortal';
import { useAICalorieEstimate } from '../../../lib/useProducts';
import { getPhotoTips, generateListingImage, getAiImageStatus } from '../../../lib/api-client';
import {
  GourmeatCookHeader,
  GourmeatSearchBar,
  FilterChipRow,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  SHCMetaBadge,
  SHCSectionTitle,
  SHCButton,
  useSHCTrayWeb,
  SHCTrayActionWeb,
  SHCWizardPaneWeb,
  SHCWizardProgressWeb,
  ListingWizardMorphCtaWeb,
  SHCCelebrationWeb,
  useMilestoneCelebrationWeb,
  SHCSkeletonList,
  PhotoTipsTrayContentWeb,
  CalorieBadge,
  AllergenTierPickerWeb,
  HalalToggleWeb,
  ListingAvailabilityEditorWeb,
  ListingDescriptionInputWeb,
  MealExtrasEditorWeb,
  MealAddonsEditorWeb,
  RecipeStepsEditorWeb,
} from '../../components/SHCWebComponents';
import { VirtualRowList } from '../../components/VirtualLists';

type ListingRow = Record<string, unknown> & {
  id?: string;
  name?: string;
  price?: number;
  min_qty?: number;
  cuisine?: string;
  description?: string;
  halal?: boolean;
  allergen_tiers?: { tier1?: string[]; tier2?: string[]; tier3?: string[] };
  occasion_tags?: string[];
  ingredients?: Array<{ name: string; quantity: number; unit: string }>;
  image_url?: string;
  shc_availability?: {
    paused?: boolean;
    portions_per_day?: number;
    collection_days?: number[];
    time_slots?: string[];
  };
  calories?: number;
  calories_confidence?: string;
  meal_extras?: unknown;
  meal_addons?: unknown;
  recipe_steps?: unknown;
};

const DEFAULT_CUISINE_PRESETS = ['Peranakan', 'Malay', 'Chinese', 'Indian', 'Eurasian', 'Western', 'Fusion'];
const EMPTY_NEW_LISTING = {
  name: '',
  price: '' as number | '',
  minQty: '' as number | '',
  cuisine: '',
};

type AiImageStatus = {
  configured?: boolean;
  generate_available?: boolean;
  generate_unavailable_reason?: string | null;
  cuisine_presets?: string[];
  model?: string;
  note?: string;
};

export default function CookListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useCookAuth();
  const { config } = useCookConfig();
  const { config: browseConfig } = useCustomerConfig();
  const occasionOptions = useMemo(() => listingOccasionTagOptions(browseConfig), [browseConfig]);
  const defaultOccasionTag = useMemo(() => defaultListingOccasionTag(browseConfig), [browseConfig]);
  const { commissionRate } = useBusinessRules();
  const { data: cookProfile } = useCookProfile();
  const collectionTimeSlots = resolveCookCollectionTimeSlots(cookProfile);
  const { data: myListings, isLoading: listingsLoading } = useCookListings();
  const listingList = (myListings as ListingRow[]) ?? [];
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

  const [name, setName] = useState(EMPTY_NEW_LISTING.name);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>(EMPTY_NEW_LISTING.price);
  const [minQty, setMinQty] = useState<number | ''>(EMPTY_NEW_LISTING.minQty);
  const [cuisine, setCuisine] = useState(EMPTY_NEW_LISTING.cuisine);
  const [halal, setHalal] = useState(false);
  const [allergenTiers, setAllergenTiers] = useState(emptyAllergenTiers);
  const [portionsPerDay, setPortionsPerDay] = useState(DEFAULT_LISTING_AVAILABILITY.portions_per_day);
  const [collectionDays, setCollectionDays] = useState<number[]>([...DEFAULT_LISTING_AVAILABILITY.collection_days]);
  const [timeSlots, setTimeSlots] = useState<string[]>([...DEFAULT_LISTING_AVAILABILITY.time_slots]);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: number; unit: string }>>([]);
  const [mealExtras, setMealExtras] = useState<import('@shc/utils').MealOptionDraft[]>([]);
  const [mealAddons, setMealAddons] = useState<import('@shc/utils').MealOptionDraft[]>([]);
  const [recipeSteps, setRecipeSteps] = useState<import('@shc/utils').RecipeStepDraft[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [published, setPublished] = useState<Record<string, unknown> | null>(null);
  const [aiCal, setAiCal] = useState<{ calories: number; confidence: string; source?: string } | null>(null);
  const [listingImageUrl, setListingImageUrl] = useState<string | null>(null);
  const [aiPhotoBusy, setAiPhotoBusy] = useState(false);
  const [aiPhotoNote, setAiPhotoNote] = useState<string | null>(null);
  const [aiImageStatus, setAiImageStatus] = useState<AiImageStatus | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CookListingStatusFilter>('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maestroE2e = process.env.NEXT_PUBLIC_MAESTRO_E2E === '1';
  const listingsForDisplay = useMemo(
    () => resolveCookListingsForDisplay(listingList, { dev: process.env.NODE_ENV === 'development', maestroE2e }),
    [listingList, maestroE2e]
  );

  useEffect(() => {
    let cancelled = false;
    void getAiImageStatus()
      .then((st) => {
        if (!cancelled) setAiImageStatus(st || {});
      })
      .catch(() => {
        if (!cancelled) setAiImageStatus({ generate_available: false, generate_unavailable_reason: 'Could not reach AI status' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cuisinePresets = aiImageStatus?.cuisine_presets?.length
    ? aiImageStatus.cuisine_presets
    : DEFAULT_CUISINE_PRESETS;
  const generateAvailable = aiImageStatus?.generate_available === true || aiImageStatus?.configured === true;
  const generateBlockedReason =
    aiImageStatus?.generate_unavailable_reason ||
    (!generateAvailable && aiImageStatus ? 'AI generate offline — upload a real kitchen photo instead' : null);

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
      ...uniqueListingCuisines(listingList).map((cuisineName) => ({
        id: `cuisine:${cuisineName}`,
        label: cuisineName,
        active: cuisineFilter === cuisineName,
      })),
    ];
    return chips;
  }, [listingList, statusFilter, cuisineFilter]);

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

  const previewImage = listingImageUrl || getDishImageUrl({ name, cuisine });

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

  const runGenerateAi = async () => {
    if (!generateAvailable) {
      showErrorTray('AI generate offline', generateBlockedReason || 'Upload a real kitchen photo instead.');
      return;
    }
    if (!name.trim()) {
      showErrorTray('Dish name needed', 'Enter a dish name before generating an AI plate.');
      return;
    }
    setAiPhotoBusy(true);
    setAiPhotoNote(null);
    try {
      const res = await generateListingImage({
        mode: 'generate',
        dish_name: name,
        cuisine,
      });
      const url = res.webp_url || res.image_url || res.jpeg_url;
      if (!url) throw new Error('No image URL returned');
      setListingImageUrl(url);
      setAiPhotoNote(
        `Illustrative AI plate (${res.model || res.source || 'flux'}) — real dish may vary. Prefer a kitchen photo when you can.`
      );
    } catch (e) {
      showErrorTray('AI generate failed', (e as Error).message || 'Could not create photo. Try upload instead.');
    } finally {
      setAiPhotoBusy(false);
    }
  };

  /** Upload or brighten — always polish (keeps cook photo pixels). */
  const onPolishPhoto = async (file: File | null, label: 'upload' | 'brighten') => {
    if (!file) return;
    setAiPhotoBusy(true);
    setAiPhotoNote(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await generateListingImage({
        mode: 'enhance',
        dish_name: name || 'Dish',
        cuisine,
        image_base64: dataUrl,
        enhance_style: 'polish',
        ai_restyle: false,
      });
      const url = res.webp_url || res.image_url || res.jpeg_url;
      if (!url) throw new Error('Photo processing failed');
      setListingImageUrl(url);
      setAiPhotoNote(
        label === 'brighten'
          ? 'Brightened your photo (lighting/contrast only — still your kitchen shot)'
          : 'Kitchen photo uploaded & optimized for listing cards'
      );
    } catch (e) {
      showErrorTray(label === 'brighten' ? 'Brighten failed' : 'Upload failed', (e as Error).message || 'Could not process photo');
    } finally {
      setAiPhotoBusy(false);
    }
  };

  const resetWizard = () => {
    setEditingId(null);
    setListingImageUrl(null);
    setAiPhotoNote(null);
    setName(EMPTY_NEW_LISTING.name);
    setDescription('');
    setPrice(EMPTY_NEW_LISTING.price);
    setMinQty(EMPTY_NEW_LISTING.minQty);
    setCuisine(EMPTY_NEW_LISTING.cuisine);
    setHalal(false);
    setAllergenTiers(emptyAllergenTiers());
    setPortionsPerDay(DEFAULT_LISTING_AVAILABILITY.portions_per_day);
    setCollectionDays([...DEFAULT_LISTING_AVAILABILITY.collection_days]);
    setTimeSlots([...DEFAULT_LISTING_AVAILABILITY.time_slots]);
    setOccasionTags([]);
    setIngredients([]);
    setMealExtras([]);
    setMealAddons([]);
    setRecipeSteps([]);
    setPublished(null);
    setAiCal(null);
    goToStep(1);
  };

  const startEdit = useCallback((listing: ListingRow) => {
    setEditingId(String(listing.id));
    setName(String(listing.name || 'Dish'));
    setDescription(String(listing.description || ''));
    setPrice(Number(listing.price) || 12);
    setMinQty(Number(listing.min_qty) || 4);
    setCuisine(String(listing.cuisine || 'Singapore'));
    setHalal(!!listing.halal);
    setAllergenTiers(allergenTiersFromListing(listing.allergen_tiers));
    const avail = availabilityFromListing(listing.shc_availability);
    setPortionsPerDay(avail.portions_per_day);
    setCollectionDays(avail.collection_days);
    setTimeSlots(avail.time_slots);
    setOccasionTags(listing.occasion_tags?.length ? listing.occasion_tags : [defaultOccasionTag]);
    setIngredients(
      listing.ingredients?.length ? listing.ingredients : [{ name: 'Chicken', quantity: 300, unit: 'g' }]
    );
    const mealMeta = mealOptionsFromListing(listing);
    setMealExtras(mealMeta.extras);
    setMealAddons(mealMeta.addons);
    setRecipeSteps(recipeStepsFromListing(listing));
    setPublished(null);
    setAiCal(
      listing.calories
        ? { calories: listing.calories, confidence: listing.calories_confidence || 'category', source: 'saved' }
        : null
    );
    goToStep(1);
    wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [defaultOccasionTag]);

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
    const basicsDraft = {
      name,
      price: typeof price === 'number' ? price : 0,
      min_qty: typeof minQty === 'number' ? minQty : 0,
    };
    const validation = validateCookListingDraft(basicsDraft);
    if (!validation.valid) {
      showErrorTray('Cannot publish yet', validation.errors.join(' '));
      if (step !== 1) goToStep(1);
      return;
    }
    setPublishing(true);
    const input = buildCookListingPayload({
      name: name.trim(),
      description,
      price: basicsDraft.price,
      min_qty: basicsDraft.min_qty,
      cuisine,
      occasion_tags: occasionTags,
      ingredients,
      allergen_tiers: allergenTiers,
      halal,
      portions_per_day: portionsPerDay,
      collection_days: collectionDays,
      time_slots: timeSlots,
      meal_extras: mealExtras,
      meal_addons: mealAddons,
      recipe_steps: recipeSteps,
      image_url:
        listingImageUrl ||
        `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/400/300`,
      calories: aiCal?.calories,
      calories_confidence: aiCal?.confidence,
    });
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

  const basicsDraft = useMemo(
    () => ({
      name,
      price: typeof price === 'number' ? price : 0,
      min_qty: typeof minQty === 'number' ? minQty : 0,
    }),
    [name, price, minQty]
  );
  const basicsValidation = useMemo(() => validateCookListingDraft(basicsDraft), [basicsDraft]);

  const advanceStep = () => {
    const gate = validateCookListingWizardStep(step, basicsDraft);
    if (!gate.ok) {
      showErrorTray('Complete dish basics', gate.message || 'Fix the highlighted fields.');
      return;
    }
    goToStep(step + 1);
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
        { id: 'listing-actions', title: String(listing.name), height: 'medium' },
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

      {listingsLoading && listingList.length === 0 ? <SHCSkeletonList count={4} rowHeight={80} /> : null}

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

      {!listingsLoading && listingsForDisplay.length === 0 ? (
        <GourmeatCard className="mb-4 bg-[var(--shc-bento-mint)] text-center">
          <div className="relative h-20 rounded-xl overflow-hidden mb-2">
            <Image src={CUISINE_IMAGE.Peranakan} alt="" fill className="object-cover" sizes="100vw" />
          </div>
          <SHCMetaBadge kind="label">No listings yet</SHCMetaBadge>
        </GourmeatCard>
      ) : filteredListings.length === 0 && !listingsLoading ? (
        <GourmeatCard className="mb-4 bg-[var(--shc-bento-mint)] text-center">
          <SHCMetaBadge kind="label">No dishes match your search</SHCMetaBadge>
        </GourmeatCard>
      ) : (
        <VirtualRowList
          items={filteredListings}
          getKey={(p) => String(p.id)}
          rowHeight={VIRTUAL_LISTING_ROW_HEIGHT}
          testID="cook-listings-virtual-list"
          renderItem={(p: ListingRow, index) => (
            <div
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
                      <SHCMetaBadge kind="price">S${String(p.price)}</SHCMetaBadge>
                      <SHCMetaBadge kind="portion_min">{shcPortionMinBadgeLabel(p.min_qty ?? 0)}</SHCMetaBadge>
                      {p.shc_availability?.paused ? <SHCMetaBadge kind="paused">Paused</SHCMetaBadge> : null}
                    </div>
                  </div>
                </div>
              </GourmeatCard>
            </div>
          )}
        />
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
                data-testid="listing-name-input"
              />
              {basicsValidation.fieldErrors.name ? (
                <p className="text-xs font-bold text-red-600">{basicsValidation.fieldErrors.name}</p>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Price"
                    data-testid="listing-price-input"
                  />
                  {basicsValidation.fieldErrors.price ? (
                    <p className="text-xs font-bold text-red-600 mt-1">{basicsValidation.fieldErrors.price}</p>
                  ) : null}
                </div>
                <div>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Min qty"
                    data-testid="listing-min-qty-input"
                  />
                  {basicsValidation.fieldErrors.min_qty ? (
                    <p className="text-xs font-bold text-red-600 mt-1">{basicsValidation.fieldErrors.min_qty}</p>
                  ) : null}
                </div>
              </div>
              <ListingDescriptionInputWeb value={description} onChange={setDescription} />
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
              <p className="text-xs font-extrabold text-muted-foreground">Cuisine (helps AI plate + discovery)</p>
              <div className="flex flex-wrap gap-2" data-testid="listing-cuisine-presets">
                {cuisinePresets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCuisine(c)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-bold ${
                      cuisine === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                    }`}
                    data-testid={`cuisine-preset-${c}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="Or type a cuisine"
                data-testid="listing-cuisine-input"
              />
              <p className="text-xs font-extrabold text-muted-foreground pt-1">Occasion tags</p>
              <div className="flex flex-wrap gap-2">
                {occasionOptions.map((tag) => (
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
              <HalalToggleWeb value={halal} onChange={setHalal} />
              <AllergenTierPickerWeb
                value={allergenTiers}
                onChange={setAllergenTiers}
                tier1Presets={cookAllergenTier1Presets(config)}
              />
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
              <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 space-y-2" data-testid="listing-photo-panel">
                <p className="text-sm font-extrabold">Dish photo</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Kitchen photo recommended.</strong> AI plate is illustrative only — customers should see the real dish when you can.
                </p>
                {listingImageUrl ? (
                  <div className="relative h-36 w-full rounded-lg overflow-hidden border border-border">
                    <Image src={listingImageUrl} alt="" fill className="object-cover" sizes="400px" unoptimized />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <label className={`cursor-pointer ${aiPhotoBusy ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="inline-flex rounded-xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-mint)] px-3 py-2 text-xs font-extrabold">
                      Upload kitchen photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="listing-photo-upload"
                      disabled={aiPhotoBusy}
                      onChange={(e) => void onPolishPhoto(e.target.files?.[0] || null, 'upload')}
                    />
                  </label>
                  <label className={`cursor-pointer ${aiPhotoBusy ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="inline-flex rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2 text-xs font-extrabold">
                      Brighten my photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="listing-photo-brighten"
                      disabled={aiPhotoBusy}
                      onChange={(e) => void onPolishPhoto(e.target.files?.[0] || null, 'brighten')}
                    />
                  </label>
                  <SHCButton
                    size="sm"
                    variant="outline"
                    disabled={aiPhotoBusy || !name.trim() || !generateAvailable}
                    onClick={() => void runGenerateAi()}
                    testID="listing-photo-generate"
                  >
                    {aiPhotoBusy ? 'Working…' : generateAvailable ? 'Generate AI plate' : 'AI offline'}
                  </SHCButton>
                </div>
                <p
                  className="text-[11px] font-semibold text-muted-foreground leading-snug"
                  data-testid="listing-photo-help"
                >
                  <span className="font-extrabold">Upload</span> = your shot, optimized ·{' '}
                  <span className="font-extrabold">Brighten</span> = lighting/contrast only (still your photo) ·{' '}
                  <span className="font-extrabold">Generate AI</span> = new illustrative plate from dish name + cuisine
                  {generateAvailable ? ` (${aiImageStatus?.model?.split('/').pop() || 'FLUX'})` : ''}
                </p>
                {!generateAvailable && generateBlockedReason ? (
                  <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5" data-testid="listing-photo-ai-offline">
                    {generateBlockedReason}
                  </p>
                ) : null}
                {aiPhotoNote ? (
                  <p className="text-[11px] font-semibold text-muted-foreground" data-testid="listing-photo-note">
                    {aiPhotoNote}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={openPhotoTipsTray}
                className="flex items-center gap-2 w-full rounded-xl border border-border p-3 text-left"
                data-testid="photo-tips-btn"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <Image src={BENTO_ACTION_IMAGES.listings} alt="" fill className="object-cover" sizes="48px" />
                </div>
                <SHCMetaBadge kind="photo_tips">📸 Photo tips</SHCMetaBadge>
              </button>
              <MealExtrasEditorWeb value={mealExtras} onChange={setMealExtras} />
              <MealAddonsEditorWeb value={mealAddons} onChange={setMealAddons} />
              <RecipeStepsEditorWeb value={recipeSteps} onChange={setRecipeSteps} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3" data-testid="listing-wizard-step4">
              <div className="relative h-32 rounded-xl overflow-hidden">
                <Image src={previewImage} alt="" fill className="object-cover" sizes="100vw" />
                <div className="absolute inset-0 bg-black/35 flex items-end p-3 gap-2">
                  <p className="text-white font-extrabold flex-1">{name}</p>
                  <SHCMetaBadge kind="price">{typeof price === 'number' ? `S$${price}` : 'Price TBD'}</SHCMetaBadge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Earnings preview: S$
                {cookEarningsPreviewFromDollars(
                  (typeof price === 'number' ? price : 0) * (typeof minQty === 'number' ? minQty : 0),
                  commissionRate
                )}{' '}
                per minimum order
              </p>
              <ListingAvailabilityEditorWeb
                portionsPerDay={portionsPerDay}
                collectionDays={collectionDays}
                timeSlots={timeSlots}
                onPortionsChange={setPortionsPerDay}
                onCollectionDaysChange={setCollectionDays}
                onTimeSlotsChange={setTimeSlots}
                timeSlotPresets={collectionTimeSlots}
              />
              <div className="flex flex-wrap gap-1">
                {occasionTags.map((t) => (
                  <SHCMetaBadge key={t} kind="occasion">
                    {t}
                  </SHCMetaBadge>
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
              onPress={step >= 4 ? publish : advanceStep}
              disabled={(step < 4 && step === 1 && !basicsValidation.valid) || (step >= 4 && saving)}
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