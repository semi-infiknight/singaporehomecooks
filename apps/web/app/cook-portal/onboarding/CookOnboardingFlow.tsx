'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BENTO_ACTION_IMAGES,
  PROMO_BANNER_IMAGES,
  COOK_ONBOARDING_STEPS,
  COOK_ONBOARDING_CUISINE_PRESETS,
  COOK_ONBOARDING_LEAD_TIME_SLOTS,
  filterIngredientSuggestions,
  createEmptyCookOnboardingDraft,
  createEmptyCookOnboardingDish,
  snapshotCookOnboardingDish,
  cookOnboardingHasDishDraft,
  validateCookOnboardingStep,
  validateCookOnboardingDish,
  cookOnboardingNextStep,
  cookOnboardingPrevStep,
  cookOnboardingLinearProgress,
  cookOnboardingCookTakeHome,
  coerceCookOnboardingStepId,
  collectCookOnboardingDishes,
  buildCookOnboardingProfilePayload,
  buildCookOnboardingFirstListingPayload,
  searchSingaporeAddresses,
  formatLocationLabel,
  nearestSgAreaName,
  type AddressSearchResult,
  type CookOnboardingDraft,
  type CookOnboardingStepId,
} from '@shc/utils';
import {
  markCookOnboardingSeen,
  loadCookOnboardingDraft,
  saveCookOnboardingDraft,
} from '../../../lib/onboarding';
import {
  updateCookProfile,
  createCookListing,
  submitComplianceDoc,
  getCookProfile,
} from '../../../lib/cook-api-client';
import { SHCOnboardingFlowScreenWeb } from '../../components/SHCOnboardingWeb';
import { SHCButton } from '../../components/SHCWebComponents';
import { ListingPhotoPanelWeb } from '../ListingPhotoPanel';

const IMAGE_BY_KEY: Record<string, string> = {
  listings: BENTO_ACTION_IMAGES.listings,
  compliance: BENTO_ACTION_IMAGES.compliance,
  orders: BENTO_ACTION_IMAGES.orders,
  family: PROMO_BANNER_IMAGES.family,
  checkout: BENTO_ACTION_IMAGES.checkout,
};

function FieldLabel({ children }: { children: string }) {
  return <p className="text-xs font-extrabold text-muted-foreground mb-1 mt-2">{children}</p>;
}

function TextField({
  value,
  onChange,
  placeholder,
  testID,
  type = 'text',
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testID?: string;
  type?: string;
  multiline?: boolean;
}) {
  const className =
    'w-full rounded-2xl border border-black/[0.12] bg-white px-4 py-3.5 text-sm font-semibold mb-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--shc-primary,#F87048)]/30';
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={className}
        data-testid={testID}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className={className}
      data-testid={testID}
    />
  );
}

function ChipRow({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: readonly string[] | string[];
  value: string;
  onChange: (v: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3.5 py-2 rounded-full text-sm font-bold border ${
              sel ? 'bg-[#1F3D2B] border-[#1F3D2B] text-white' : 'bg-white border-black/[0.12] text-foreground'
            }`}
            data-testid={testIDPrefix ? `${testIDPrefix}-${opt.replace(/\s+/g, '-').toLowerCase()}` : undefined}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ConsentRow({
  checked,
  onToggle,
  label,
  testID,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  testID?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-start gap-3 text-left mb-3 w-full rounded-2xl border border-black/[0.12] bg-white p-4 shadow-sm"
      data-testid={testID}
    >
      <span
        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
          checked ? 'bg-[var(--shc-primary,#F87048)] text-white' : 'bg-[#F0E4D8] text-transparent'
        }`}
      >
        ✓
      </span>
      <span className="text-sm font-semibold text-foreground leading-snug">{label}</span>
    </button>
  );
}

function KitchenAddressSearch({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (patch: { kitchen_address: string; area?: string }) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      void searchSingaporeAddresses(q).then(setResults);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative mb-2" data-testid="cook-onboarding-kitchen-address">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onSelect({ kitchen_address: e.target.value });
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search block, street, or postal code"
        className="w-full rounded-2xl border-2 border-foreground bg-white px-4 py-3.5 text-sm font-semibold"
        data-testid="location-search-input"
      />
      {open && results.length > 0 ? (
        <ul className="absolute z-20 mt-2 w-full rounded-2xl border border-black/10 bg-white shadow-lg overflow-hidden">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-[#FFF5F0]"
                data-testid={`location-result-${r.id}`}
                onClick={() => {
                  const kitchen_address = formatLocationLabel({ line1: r.line1, postal_code: r.postal_code });
                  setQuery(kitchen_address);
                  setOpen(false);
                  setResults([]);
                  onSelect({ kitchen_address, area: nearestSgAreaName(r.lat, r.lng) });
                }}
              >
                <p className="text-sm font-extrabold">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.subtitle}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function CookOnboardingFlow() {
  const router = useRouter();
  const [stepId, setStepId] = useState<CookOnboardingStepId>('kitchen');
  const [draft, setDraft] = useState<CookOnboardingDraft>(createEmptyCookOnboardingDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [formOpen, setFormOpen] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const saved = loadCookOnboardingDraft();
    if (saved) {
      setStepId(coerceCookOnboardingStepId(saved.stepId));
      setDraft({ ...createEmptyCookOnboardingDraft(), ...saved.draft, saved_dishes: saved.draft.saved_dishes || [] });
    }
  }, []);

  useEffect(() => {
    void getCookProfile()
      .then((res) => {
        const cook = res.cook as { contact_mobile?: string };
        const mobile = cook?.contact_mobile?.replace(/^\+65/, '') || '';
        if (!mobile) return;
        setDraft((d) => ({ ...d, mobile_verified: true, contact_mobile: mobile }));
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    saveCookOnboardingDraft({ stepId, draft });
  }, [draft, stepId]);

  const stepMeta = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId) ?? COOK_ONBOARDING_STEPS[0];
  const linear = useMemo(() => cookOnboardingLinearProgress(stepId), [stepId]);
  const isLast = stepId === 'menu';
  const canGoBack = cookOnboardingPrevStep(stepId) !== null;
  const takeHome = cookOnboardingCookTakeHome(Number(draft.dish_price));
  const selectedIngredients = draft.dish_ingredients
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const patch = useCallback((partial: Partial<CookOnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

  const goBack = () => {
    const prev = cookOnboardingPrevStep(stepId);
    if (prev) setStepId(prev);
  };

  const goNext = () => {
    const gate = validateCookOnboardingStep(stepId, draft);
    if (!gate.ok) {
      setError(gate.message);
      return;
    }
    setError('');
    const next = cookOnboardingNextStep(stepId);
    if (next) setStepId(next);
  };

  const finish = async () => {
    const gate = validateCookOnboardingStep(stepId, draft);
    if (!gate.ok) {
      setError(gate.message);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updateCookProfile(buildCookOnboardingProfilePayload(draft) as Parameters<typeof updateCookProfile>[0]);
      for (const dish of collectCookOnboardingDishes(draft)) {
        await createCookListing(
          buildCookOnboardingFirstListingPayload({ ...dish, kitchen_halal_certified: draft.kitchen_halal_certified })
        );
      }
      markCookOnboardingSeen();
      router.replace('/cook-portal/dashboard');
    } catch (e) {
      setError((e as Error).message || 'Could not finish setup');
    } finally {
      setBusy(false);
    }
  };

  const handlePrimary = () => {
    if (isLast) void finish();
    else goNext();
  };

  const saveDishToMenu = () => {
    const gate = validateCookOnboardingDish(draft);
    if (!gate.ok) {
      setError(gate.message);
      return;
    }
    setError('');
    const snap = snapshotCookOnboardingDish(draft);
    const nextSaved =
      editingIndex != null
        ? draft.saved_dishes.map((d, i) => (i === editingIndex ? snap : d))
        : [...draft.saved_dishes, snap];
    patch({ saved_dishes: nextSaved, ...createEmptyCookOnboardingDish() });
    setEditingIndex(null);
    setFormOpen(false);
    setIngredientQuery('');
  };

  const addNewDish = () => {
    if (formOpen && cookOnboardingHasDishDraft(draft)) {
      const gate = validateCookOnboardingDish(draft);
      if (!gate.ok) {
        setError(gate.message);
        return;
      }
      const snap = snapshotCookOnboardingDish(draft);
      const nextSaved =
        editingIndex != null
          ? draft.saved_dishes.map((d, i) => (i === editingIndex ? snap : d))
          : [...draft.saved_dishes, snap];
      patch({ saved_dishes: nextSaved, ...createEmptyCookOnboardingDish() });
    } else if (formOpen) {
      patch(createEmptyCookOnboardingDish());
    }
    setError('');
    setEditingIndex(null);
    setFormOpen(true);
    setIngredientQuery('');
  };

  const editSavedDish = (index: number) => {
    const dish = draft.saved_dishes[index];
    if (!dish) return;
    patch({ ...dish });
    setEditingIndex(index);
    setFormOpen(true);
    setIngredientQuery('');
  };

  const markCert = async (type: 'sfa' | 'wsq' | 'halal') => {
    try {
      await submitComplianceDoc({
        type,
        file_key: `compliance/onboarding/${type}_${Date.now()}.pdf`,
      });
      patch({
        compliance_uploaded: { ...draft.compliance_uploaded, [type]: true },
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const renderStep = () => {
    switch (stepId) {
      case 'kitchen':
        return (
          <>
            <FieldLabel>Kitchen name</FieldLabel>
            <TextField
              value={draft.display_name}
              onChange={(display_name) => patch({ display_name })}
              placeholder="Auntie Rose's Kitchen"
              testID="cook-onboarding-cook-name"
            />
            <FieldLabel>Kitchen address</FieldLabel>
            <KitchenAddressSearch
              value={draft.kitchen_address}
              onSelect={(next) => patch(next)}
            />
          </>
        );
      case 'paynow':
        return (
          <>
            <FieldLabel>PayNow mobile</FieldLabel>
            <TextField
              value={draft.paynow_mobile}
              onChange={(paynow_mobile) => patch({ paynow_mobile })}
              placeholder="9123 4567"
              testID="cook-onboarding-paynow-mobile"
              type="tel"
            />
            <FieldLabel>Confirm PayNow mobile</FieldLabel>
            <TextField
              value={draft.paynow_mobile_confirm}
              onChange={(paynow_mobile_confirm) => patch({ paynow_mobile_confirm })}
              placeholder="9123 4567"
              testID="cook-onboarding-paynow-confirm"
              type="tel"
            />
          </>
        );
      case 'legal':
        return (
          <>
            <ConsentRow
              checked={draft.pdpa_consent}
              onToggle={() => patch({ pdpa_consent: !draft.pdpa_consent })}
              label="I agree to PDPA data handling and accurate allergen disclosure on every listing."
              testID="cook-onboarding-pdpa-checkbox"
            />
            <ConsentRow
              checked={draft.terms_consent}
              onToggle={() => patch({ terms_consent: !draft.terms_consent })}
              label="I accept the Terms & Conditions and marketplace rules."
              testID="cook-onboarding-terms-checkbox"
            />
          </>
        );
      case 'responsible_person':
        return (
          <TextField
            value={draft.responsible_person_name}
            onChange={(responsible_person_name) => patch({ responsible_person_name })}
            placeholder="Full legal name"
            testID="cook-onboarding-responsible-name"
          />
        );
      case 'nric_fin':
        return (
          <TextField
            value={draft.nric_fin_last4}
            onChange={(nric_fin_last4) => patch({ nric_fin_last4 })}
            placeholder="e.g. 123B"
            testID="cook-onboarding-nric"
          />
        );
      case 'alternate_contact':
        return (
          <TextField
            value={draft.alternate_contact}
            onChange={(alternate_contact) => patch({ alternate_contact })}
            placeholder="Backup mobile"
            testID="cook-onboarding-alt-contact"
            type="tel"
          />
        );
      case 'halal':
        return (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {(['Yes', 'No'] as const).map((label) => {
              const selected =
                label === 'Yes' ? draft.kitchen_halal_certified === true : draft.kitchen_halal_certified === false;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => patch({ kitchen_halal_certified: label === 'Yes' })}
                  className={`min-h-[88px] rounded-2xl border text-lg font-extrabold ${
                    selected ? 'bg-[#1F3D2B] border-[#1F3D2B] text-white' : 'bg-white border-black/10'
                  }`}
                  data-testid={`cook-onboarding-halal-${label.toLowerCase()}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        );
      case 'certificates':
        return (
          <>
            {(['sfa', 'wsq', 'halal'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => markCert(t)}
                className="w-full text-left p-4 rounded-2xl border border-black/10 bg-white mb-2"
                data-testid={`cook-onboarding-cert-${t}`}
              >
                <p className="font-black text-sm">{t.toUpperCase()} certificate</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {draft.compliance_uploaded[t] ? '✓ Uploaded' : 'Tap to mark uploaded'}
                </p>
              </button>
            ))}
          </>
        );
      case 'menu': {
        const ingredientMatches = filterIngredientSuggestions(ingredientQuery, selectedIngredients);
        const addCustom =
          ingredientQuery.trim().length > 0 &&
          !ingredientMatches.some((ing) => ing.toLowerCase() === ingredientQuery.trim().toLowerCase()) &&
          !selectedIngredients.some((ing) => ing.toLowerCase() === ingredientQuery.trim().toLowerCase());
        return (
          <>
            {draft.saved_dishes.map((dish, index) => (
              <button
                key={`${dish.dish_name}-${index}`}
                type="button"
                onClick={() => editSavedDish(index)}
                className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 text-left"
                data-testid={`cook-onboarding-saved-dish-${index}`}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F0E4D8] text-lg font-extrabold">
                  {(dish.dish_name || 'D').slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold">{dish.dish_name}</span>
                  <span className="block truncate text-xs font-semibold text-muted-foreground">
                    {dish.dish_cuisine ? `${dish.dish_cuisine} · ` : ''}S${dish.dish_price}
                  </span>
                </span>
                <span className="text-sm font-extrabold">Edit</span>
              </button>
            ))}
            {formOpen ? (
              <>
            <FieldLabel>Cuisine</FieldLabel>
            <ChipRow
              options={COOK_ONBOARDING_CUISINE_PRESETS}
              value={draft.dish_cuisine}
              onChange={(dish_cuisine) => patch({ dish_cuisine })}
              testIDPrefix="cook-onboarding-cuisine"
            />
            <FieldLabel>Dish name</FieldLabel>
            <TextField
              value={draft.dish_name}
              onChange={(dish_name) => patch({ dish_name })}
              placeholder="Nasi Lemak"
              testID="cook-onboarding-dish-name"
            />
            <FieldLabel>Portion size</FieldLabel>
            <ChipRow
              options={['plate', 'piece']}
              value={draft.dish_portion_unit}
              onChange={(v) => patch({ dish_portion_unit: v as 'plate' | 'piece' })}
              testIDPrefix="cook-onboarding-portion"
            />
            <FieldLabel>Recommended pax</FieldLabel>
            <TextField
              value={draft.dish_recommended_pax ? String(draft.dish_recommended_pax) : ''}
              onChange={(t) => {
                const n = parseInt(t.replace(/\D/g, ''), 10);
                patch({ dish_recommended_pax: Number.isFinite(n) ? n : 0 });
              }}
              placeholder="e.g. 4"
              testID="cook-onboarding-pax"
              type="number"
            />
            <FieldLabel>List price (S$)</FieldLabel>
            <TextField
              value={draft.dish_price}
              onChange={(dish_price) => patch({ dish_price })}
              placeholder="12"
              testID="cook-onboarding-dish-price"
              type="number"
            />
            {takeHome ? (
              <p className="text-sm font-bold text-[#1F3D2B] mb-2" data-testid="cook-onboarding-take-home">
                You receive S${takeHome.cook.toFixed(2)} after our 15% cut
              </p>
            ) : null}
            <FieldLabel>Ingredients</FieldLabel>
            {selectedIngredients.length ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedIngredients.map((ing) => (
                  <button
                    key={ing}
                    type="button"
                    className="rounded-full bg-[#1F3D2B] px-3 py-1.5 text-xs font-bold text-white"
                    data-testid={`cook-onboarding-ingredient-${ing.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() =>
                      patch({
                        dish_ingredients: selectedIngredients.filter((i) => i !== ing).join(', '),
                      })
                    }
                  >
                    × {ing}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="relative mb-2" data-testid="cook-onboarding-ingredients-open">
              <TextField
                value={ingredientQuery}
                onChange={setIngredientQuery}
                placeholder="Search ingredients"
                testID="cook-onboarding-ingredients"
              />
              {ingredientQuery.trim() ? (
                <ul className="absolute z-20 mt-[-6px] max-h-44 w-full overflow-auto rounded-2xl border border-black/10 bg-white shadow-lg">
                  {ingredientMatches.map((ing) => (
                    <li key={ing}>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold"
                        data-testid={`cook-onboarding-ingredient-suggest-${ing.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => {
                          patch({ dish_ingredients: [...selectedIngredients, ing].join(', ') });
                          setIngredientQuery('');
                        }}
                      >
                        {ing}
                      </button>
                    </li>
                  ))}
                  {addCustom ? (
                    <li>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold"
                        data-testid="cook-onboarding-ingredient-custom"
                        onClick={() => {
                          patch({
                            dish_ingredients: [...selectedIngredients, ingredientQuery.trim()].join(', '),
                          });
                          setIngredientQuery('');
                        }}
                      >
                        Add “{ingredientQuery.trim()}”
                      </button>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
            <FieldLabel>Brief description</FieldLabel>
            <TextField
              value={draft.dish_description}
              onChange={(dish_description) => patch({ dish_description })}
              placeholder="What makes this dish special"
              testID="cook-onboarding-dish-desc"
              multiline
            />
            <FieldLabel>Minimum order time (days)</FieldLabel>
            <TextField
              value={String(draft.dish_lead_days)}
              onChange={(t) => patch({ dish_lead_days: Number(t) || 1 })}
              testID="cook-onboarding-lead-days"
              type="number"
            />
            <FieldLabel>Collection window</FieldLabel>
            <ChipRow
              options={COOK_ONBOARDING_LEAD_TIME_SLOTS}
              value={draft.dish_lead_time_slot}
              onChange={(dish_lead_time_slot) => patch({ dish_lead_time_slot })}
              testIDPrefix="cook-onboarding-lead-slot"
            />
            <FieldLabel>Dish available</FieldLabel>
            <ChipRow
              options={['Yes', 'No']}
              value={draft.dish_available ? 'Yes' : 'No'}
              onChange={(v) => patch({ dish_available: v === 'Yes' })}
              testIDPrefix="cook-onboarding-dish-available"
            />
            <div data-testid="cook-onboarding-dish-photo">
              <ListingPhotoPanelWeb
                dishName={draft.dish_name}
                cuisine={draft.dish_cuisine}
                imageUrl={draft.dish_image_url || null}
                onImageUrl={(url) => patch({ dish_image_url: url })}
              />
            </div>
            <SHCButton onClick={saveDishToMenu} testID="cook-onboarding-save-dish" className="w-full mb-2">
              Save dish to menu
            </SHCButton>
              </>
            ) : null}
            <SHCButton variant="ghost" onClick={addNewDish} testID="cook-onboarding-add-dish" className="w-full">
              + Add new dish
            </SHCButton>
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <SHCOnboardingFlowScreenWeb
      imageUri={IMAGE_BY_KEY[stepMeta.imageKey] || BENTO_ACTION_IMAGES.listings}
      title={stepMeta.title}
      subtitle={stepMeta.subtitle}
      stepIndex={linear.current - 1}
      totalSteps={linear.total}
      progressPercent={linear.percent}
      onNext={handlePrimary}
      onSkip={stepMeta.skippable ? (isLast ? () => void finish() : goNext) : undefined}
      onBack={canGoBack ? goBack : undefined}
      secondaryTestID="cook-onboarding-back-btn"
      nextLabel={isLast ? (busy ? 'Finishing…' : stepMeta.nextLabel || 'Complete onboarding') : 'Next'}
      nextTestID={isLast ? 'cook-onboarding-finish-btn' : 'cook-onboarding-next-btn'}
      skipTestID="cook-onboarding-skip-btn"
      skipLabel={isLast ? 'Add dishes later' : 'Skip'}
      disabled={busy}
      loading={busy}
      screenTestID="cook-onboarding-screen"
    >
      {renderStep()}
      {error ? <p className="text-sm font-bold text-destructive mt-2">{error}</p> : null}
    </SHCOnboardingFlowScreenWeb>
  );
}
