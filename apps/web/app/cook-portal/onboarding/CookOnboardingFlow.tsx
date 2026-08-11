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
  validateCookOnboardingStep,
  cookOnboardingNextStep,
  cookOnboardingPrevStep,
  cookOnboardingLinearProgress,
  buildCookOnboardingProfilePayload,
  buildCookOnboardingFirstListingPayload,
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
import { CookAreaPickerWeb } from '../../components/SHCWebComponents';

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
    <div className="flex flex-col gap-2 mb-3">
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`w-full min-h-[52px] px-4 py-3 rounded-2xl text-sm font-bold border text-left flex items-center justify-between transition-colors ${
              sel
                ? 'bg-[#FFF5F0] border-[var(--shc-primary,#F87048)] border-2 text-foreground'
                : 'bg-white border-black/[0.12] text-foreground shadow-sm'
            }`}
            data-testid={testIDPrefix ? `${testIDPrefix}-${opt.replace(/\s+/g, '-').toLowerCase()}` : undefined}
          >
            <span>{opt}</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                sel ? 'bg-[var(--shc-primary,#F87048)] text-white' : 'bg-[#F0E4D8] text-transparent'
              }`}
            >
              ✓
            </span>
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
          checked
            ? 'bg-[var(--shc-primary,#F87048)] text-white'
            : 'bg-[#F0E4D8] text-transparent'
        }`}
      >
        ✓
      </span>
      <span className="text-sm font-semibold text-foreground leading-snug">{label}</span>
    </button>
  );
}

export default function CookOnboardingFlow() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const dishInputRef = useRef<HTMLInputElement>(null);
  const [stepId, setStepId] = useState<CookOnboardingStepId>('welcome');
  const [draft, setDraft] = useState<CookOnboardingDraft>(createEmptyCookOnboardingDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = loadCookOnboardingDraft();
    if (saved) {
      setStepId(saved.stepId);
      setDraft(saved.draft);
    }
  }, []);

  useEffect(() => {
    void getCookProfile()
      .then((res) => {
        const cook = res.cook as { contact_mobile?: string; mobile_verified_at?: string | null };
        const mobile = cook?.contact_mobile?.replace(/^\+65/, '') || '';
        if (!mobile) return;
        setDraft((d) => ({
          ...d,
          mobile_verified: true,
          contact_mobile: mobile,
          whatsapp_same: true,
        }));
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    saveCookOnboardingDraft({ stepId, draft });
  }, [draft, stepId]);

  const stepMeta = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId)!;
  const linear = useMemo(() => cookOnboardingLinearProgress(stepId), [stepId]);
  const isLast = stepId === 'complete';
  const canGoBack = cookOnboardingPrevStep(stepId) !== null;

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
    setBusy(true);
    setError('');
    try {
      await updateCookProfile(buildCookOnboardingProfilePayload(draft) as Parameters<typeof updateCookProfile>[0]);
      if (draft.dish_name.trim()) {
        await createCookListing(buildCookOnboardingFirstListingPayload(draft));
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

  const applyPaynowFromWhatsapp = (enabled: boolean) => {
    if (!enabled) {
      patch({ whatsapp_same: false });
      return;
    }
    const digits = draft.contact_mobile.replace(/^\+65/, '').trim();
    patch({
      whatsapp_same: true,
      paynow_mobile: digits,
      paynow_mobile_confirm: digits,
    });
  };

  useEffect(() => {
    if (stepId !== 'paynow' || !draft.whatsapp_same || !draft.contact_mobile.trim()) return;
    const digits = draft.contact_mobile.replace(/^\+65/, '').trim();
    if (draft.paynow_mobile === digits && draft.paynow_mobile_confirm === digits) return;
    patch({ paynow_mobile: digits, paynow_mobile_confirm: digits });
  }, [stepId, draft.contact_mobile, draft.whatsapp_same, draft.paynow_mobile, draft.paynow_mobile_confirm, patch]);

  const onPhotoPick = (field: 'avatar_url' | 'dish_image_url', file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    patch({ [field]: url });
  };

  const renderStep = () => {
    switch (stepId) {
      case 'area':
        return <CookAreaPickerWeb value={draft.area} onChange={(area) => patch({ area })} testID="cook-onboarding-area-input" />;
      case 'kitchen_address':
        return (
          <>
            <FieldLabel>Kitchen address</FieldLabel>
            <TextField
              value={draft.kitchen_address}
              onChange={(kitchen_address) => patch({ kitchen_address })}
              placeholder="Blk 456 Tampines St 42, #05-123"
              testID="cook-onboarding-address-input"
            />
            <FieldLabel>Collection instructions (optional)</FieldLabel>
            <TextField
              value={draft.collection_instructions}
              onChange={(collection_instructions) => patch({ collection_instructions })}
              placeholder="Lift lobby B — WhatsApp on arrival"
              testID="cook-onboarding-collection-input"
              multiline
            />
          </>
        );
      case 'paynow':
        return (
          <>
            <label className="flex items-center justify-between gap-3 py-2 mb-2">
              <span className="text-sm font-semibold">
                Same as WhatsApp
                {draft.contact_mobile ? ` (+65 ${draft.contact_mobile.replace(/^\+65/, '')})` : ''}
              </span>
              <input
                type="checkbox"
                checked={draft.whatsapp_same}
                onChange={(e) => applyPaynowFromWhatsapp(e.target.checked)}
                data-testid="cook-onboarding-paynow-same"
              />
            </label>
            <FieldLabel>PayNow mobile</FieldLabel>
            <TextField
              value={draft.paynow_mobile}
              onChange={(paynow_mobile) => patch({ paynow_mobile, whatsapp_same: false })}
              placeholder="9123 4567"
              testID="cook-onboarding-paynow-mobile"
              type="tel"
            />
            <FieldLabel>Confirm PayNow mobile</FieldLabel>
            <TextField
              value={draft.paynow_mobile_confirm}
              onChange={(paynow_mobile_confirm) => patch({ paynow_mobile_confirm, whatsapp_same: false })}
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
      case 'profile_photo':
        return (
          <>
            {draft.avatar_url ? (
              <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden">
                <Image src={draft.avatar_url} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : null}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhotoPick('avatar_url', e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] font-bold py-3"
              data-testid="cook-onboarding-avatar-pick"
            >
              {draft.avatar_url ? 'Change photo' : 'Add profile photo'}
            </button>
          </>
        );
      case 'cook_name':
        return (
          <TextField
            value={draft.display_name}
            onChange={(display_name) => patch({ display_name })}
            placeholder="Auntie Rose's Kitchen"
            testID="cook-onboarding-cook-name"
          />
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
          <ChipRow
            options={['Yes', 'No']}
            value={draft.kitchen_halal_certified === true ? 'Yes' : draft.kitchen_halal_certified === false ? 'No' : ''}
            onChange={(v) => patch({ kitchen_halal_certified: v === 'Yes' })}
            testIDPrefix="cook-onboarding-halal"
          />
        );
      case 'certificates':
        return (
          <>
            {(['sfa', 'wsq', 'halal'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => markCert(t)}
                className="w-full text-left p-4 rounded-xl border-2 border-[var(--shc-border-brutal)] mb-2"
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
      case 'kitchen_available':
        return (
          <label className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm font-semibold">Kitchen accepting orders</span>
            <input
              type="checkbox"
              checked={draft.kitchen_available}
              onChange={(e) => patch({ kitchen_available: e.target.checked })}
              data-testid="cook-onboarding-kitchen-available"
            />
          </label>
        );
      case 'menu_intro':
        return null;
      case 'menu_cuisine':
        return (
          <ChipRow
            options={COOK_ONBOARDING_CUISINE_PRESETS}
            value={draft.dish_cuisine}
            onChange={(dish_cuisine) => patch({ dish_cuisine })}
            testIDPrefix="cook-onboarding-cuisine"
          />
        );
      case 'menu_dish_name':
        return (
          <TextField
            value={draft.dish_name}
            onChange={(dish_name) => patch({ dish_name })}
            placeholder="Nasi Lemak"
            testID="cook-onboarding-dish-name"
          />
        );
      case 'menu_portion':
        return (
          <ChipRow
            options={['plate', 'piece']}
            value={draft.dish_portion_unit}
            onChange={(v) => patch({ dish_portion_unit: v as 'plate' | 'piece' })}
            testIDPrefix="cook-onboarding-portion"
          />
        );
      case 'menu_pax':
        return (
          <ChipRow
            options={['2', '3']}
            value={String(draft.dish_recommended_pax)}
            onChange={(v) => patch({ dish_recommended_pax: Number(v) as 2 | 3 })}
            testIDPrefix="cook-onboarding-pax"
          />
        );
      case 'menu_price':
        return (
          <TextField
            value={draft.dish_price}
            onChange={(dish_price) => patch({ dish_price })}
            placeholder="12"
            testID="cook-onboarding-dish-price"
            type="number"
          />
        );
      case 'menu_ingredients':
        return (
          <>
            <ChipRow
              options={COOK_ONBOARDING_INGREDIENT_SUGGESTIONS}
              value=""
              onChange={(ing) =>
                patch({ dish_ingredients: draft.dish_ingredients ? `${draft.dish_ingredients}, ${ing}` : ing })
              }
              testIDPrefix="cook-onboarding-ingredient"
            />
            <TextField
              value={draft.dish_ingredients}
              onChange={(dish_ingredients) => patch({ dish_ingredients })}
              placeholder="Rice, coconut milk, sambal…"
              testID="cook-onboarding-ingredients"
              multiline
            />
          </>
        );
      case 'menu_description':
        return (
          <TextField
            value={draft.dish_description}
            onChange={(dish_description) => patch({ dish_description })}
            placeholder="Brief heritage story for this dish"
            testID="cook-onboarding-dish-desc"
            multiline
          />
        );
      case 'menu_lead_time':
        return (
          <>
            <FieldLabel>Minimum lead (days)</FieldLabel>
            <TextField
              value={String(draft.dish_lead_days)}
              onChange={(t) => patch({ dish_lead_days: Number(t) || 1 })}
              testID="cook-onboarding-lead-days"
              type="number"
            />
            <FieldLabel>Preferred collection window</FieldLabel>
            <ChipRow
              options={COOK_ONBOARDING_LEAD_TIME_SLOTS}
              value={draft.dish_lead_time_slot}
              onChange={(dish_lead_time_slot) => patch({ dish_lead_time_slot })}
              testIDPrefix="cook-onboarding-lead-slot"
            />
          </>
        );
      case 'menu_dish_available':
        return (
          <ChipRow
            options={['Yes', 'No']}
            value={draft.dish_available ? 'Yes' : 'No'}
            onChange={(v) => patch({ dish_available: v === 'Yes' })}
            testIDPrefix="cook-onboarding-dish-available"
          />
        );
      case 'menu_calories':
        return (
          <TextField
            value={draft.dish_calories}
            onChange={(dish_calories) => patch({ dish_calories })}
            testID="cook-onboarding-calories"
            type="number"
          />
        );
      case 'menu_photo':
        return (
          <>
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
              onChange={(e) => onPhotoPick('dish_image_url', e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => dishInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] font-bold py-3"
              data-testid="cook-onboarding-dish-photo"
            >
              {draft.dish_image_url ? 'Change dish photo' : 'Add dish photo'}
            </button>
          </>
        );
      case 'complete':
        return (
          <p className="text-base font-semibold leading-relaxed">
            You&apos;re ready to accept orders. Complete setup to open your dashboard.
          </p>
        );
      default:
        return null;
    }
  };

  const isWelcome = stepMeta.id === 'welcome';

  return (
    <SHCOnboardingFlowScreenWeb
      variant={isWelcome ? 'hero' : 'default'}
      imageUri={IMAGE_BY_KEY[stepMeta.imageKey] || BENTO_ACTION_IMAGES.listings}
      title={stepMeta.title}
      subtitle={stepMeta.subtitle}
      stepIndex={linear.current - 1}
      totalSteps={linear.total}
      progressPercent={linear.percent}
      chapterLabel={isWelcome ? undefined : `Step ${linear.current} of ${linear.total}`}
      onNext={handlePrimary}
      onSkip={stepMeta.skippable ? goNext : undefined}
      onBack={canGoBack ? goBack : undefined}
      secondaryTestID="cook-onboarding-back-btn"
      nextLabel={isLast ? (busy ? 'Finishing…' : stepMeta.nextLabel || 'Finish') : stepMeta.nextLabel || 'Continue'}
      nextTestID={isLast ? 'cook-onboarding-finish-btn' : 'cook-onboarding-next-btn'}
      skipTestID="cook-onboarding-skip-btn"
      disabled={busy}
      loading={busy}
      screenTestID="cook-onboarding-screen"
    >
      {renderStep()}
      {error ? <p className="text-sm font-bold text-destructive mt-2">{error}</p> : null}
    </SHCOnboardingFlowScreenWeb>
  );
}
