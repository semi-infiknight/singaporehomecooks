'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BENTO_ACTION_IMAGES,
  PROMO_BANNER_IMAGES,
  COOK_ONBOARDING_STEPS,
  COOK_ONBOARDING_CUISINE_PRESETS,
  COOK_ONBOARDING_INGREDIENT_SUGGESTIONS,
  COOK_ONBOARDING_LEAD_TIME_SLOTS,
  createEmptyCookOnboardingDraft,
  createEmptyCookOnboardingDish,
  snapshotCookOnboardingDish,
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
  const dishInputRef = useRef<HTMLInputElement>(null);
  const [stepId, setStepId] = useState<CookOnboardingStepId>('kitchen');
  const [draft, setDraft] = useState<CookOnboardingDraft>(createEmptyCookOnboardingDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ingredientOpen, setIngredientOpen] = useState(false);

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

  const addAnotherDish = () => {
    const gate = validateCookOnboardingDish(draft);
    if (!gate.ok) {
      setError(gate.message);
      return;
    }
    setError('');
    patch({
      saved_dishes: [...draft.saved_dishes, snapshotCookOnboardingDish(draft)],
      ...createEmptyCookOnboardingDish(),
    });
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

  const onPhotoPick = (file?: File | null) => {
    if (!file) return;
    patch({ dish_image_url: URL.createObjectURL(file) });
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
      case 'menu':
        return (
          <>
            {draft.saved_dishes.length > 0 ? (
              <p className="text-xs font-bold text-muted-foreground mb-2">
                {draft.saved_dishes.length} dish{draft.saved_dishes.length === 1 ? '' : 'es'} saved
              </p>
            ) : null}
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
            <ChipRow
              options={['2', '3']}
              value={String(draft.dish_recommended_pax)}
              onChange={(v) => patch({ dish_recommended_pax: Number(v) as 2 | 3 })}
              testIDPrefix="cook-onboarding-pax"
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
            <button
              type="button"
              onClick={() => setIngredientOpen(true)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-left text-sm font-semibold mb-2"
              data-testid="cook-onboarding-ingredients-open"
            >
              {selectedIngredients.length ? selectedIngredients.join(', ') : 'Choose ingredients'}
            </button>
            <TextField
              value={draft.dish_ingredients}
              onChange={(dish_ingredients) => patch({ dish_ingredients })}
              placeholder="Rice, coconut milk, sambal…"
              testID="cook-onboarding-ingredients"
              multiline
            />
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
            <FieldLabel>Photo of dish</FieldLabel>
            {draft.dish_image_url ? (
              <div className="relative w-full h-40 mb-4 rounded-xl overflow-hidden">
                <Image src={draft.dish_image_url} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : null}
            <input
              ref={dishInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhotoPick(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => dishInputRef.current?.click()}
              className="w-full rounded-2xl border border-black/10 font-bold py-3 mb-2"
              data-testid="cook-onboarding-dish-photo"
            >
              {draft.dish_image_url ? 'Change dish photo' : 'Add dish photo'}
            </button>
            <button
              type="button"
              onClick={addAnotherDish}
              className="w-full py-3 text-sm font-extrabold text-[var(--shc-primary,#F87048)]"
              data-testid="cook-onboarding-add-dish"
            >
              Add another dish
            </button>
            {ingredientOpen ? (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-end" data-testid="cook-onboarding-ingredients-sheet">
                <div className="w-full rounded-t-3xl bg-[#FFFBF7] p-5 pb-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xl font-black">Add ingredient</p>
                    <button type="button" onClick={() => setIngredientOpen(false)} data-testid="cook-onboarding-ingredients-close">
                      ×
                    </button>
                  </div>
                  <ChipRow
                    options={COOK_ONBOARDING_INGREDIENT_SUGGESTIONS}
                    value=""
                    onChange={(ing) => {
                      const next = selectedIngredients.includes(ing)
                        ? selectedIngredients.filter((i) => i !== ing)
                        : [...selectedIngredients, ing];
                      patch({ dish_ingredients: next.join(', ') });
                    }}
                    testIDPrefix="cook-onboarding-ingredient"
                  />
                  <button
                    type="button"
                    onClick={() => setIngredientOpen(false)}
                    className="w-full min-h-[52px] rounded-full bg-[var(--shc-primary,#F87048)] text-white font-black"
                    data-testid="cook-onboarding-ingredients-done"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </>
        );
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
