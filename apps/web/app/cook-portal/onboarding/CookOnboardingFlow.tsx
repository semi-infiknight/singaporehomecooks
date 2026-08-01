'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BENTO_ACTION_IMAGES,
  PROMO_BANNER_IMAGES,
  COOK_ONBOARDING_STEPS,
  COOK_ONBOARDING_DEMO_OTP,
  COOK_ONBOARDING_CUISINE_PRESETS,
  COOK_ONBOARDING_INGREDIENT_SUGGESTIONS,
  COOK_ONBOARDING_LEAD_TIME_SLOTS,
  createEmptyCookOnboardingDraft,
  validateCookOnboardingStep,
  cookOnboardingNextStep,
  cookOnboardingPrevStep,
  cookOnboardingChapterProgress,
  cookOnboardingChapterDotProgress,
  buildCookOnboardingProfilePayload,
  buildCookOnboardingFirstListingPayload,
  normalizePaynowMobile,
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
  sendCookEmailVerify,
  confirmCookEmail,
  sendCookMobileVerify,
  confirmCookMobile,
  createCookListing,
  submitComplianceDoc,
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
    'w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold mb-2';
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
            className={`px-3 py-2 rounded-full text-sm font-bold border-2 transition-colors ${
              sel
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-card border-[var(--shc-border-brutal)] text-foreground'
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
    <button type="button" onClick={onToggle} className="flex items-start gap-3 text-left mb-3" data-testid={testID}>
      <span
        className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-black ${
          checked ? 'bg-primary border-primary text-primary-foreground' : 'border-[var(--shc-border-brutal)] bg-card'
        }`}
      >
        {checked ? '✓' : ''}
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
  const [verifyHint, setVerifyHint] = useState('');
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    const saved = loadCookOnboardingDraft();
    if (saved) {
      setStepId(saved.stepId);
      setDraft(saved.draft);
    }
  }, []);

  useEffect(() => {
    saveCookOnboardingDraft({ stepId, draft });
  }, [draft, stepId]);

  useEffect(() => {
    setOtpCode('');
    setVerifyHint('');
  }, [stepId]);

  const stepMeta = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId)!;
  const progress = useMemo(() => cookOnboardingChapterProgress(stepId), [stepId]);
  const chapterDots = useMemo(() => cookOnboardingChapterDotProgress(stepId), [stepId]);
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

  const sendEmail = async () => {
    setBusy(true);
    try {
      const res = await sendCookEmailVerify();
      setVerifyHint(res.hint || `Enter code ${COOK_ONBOARDING_DEMO_OTP}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmEmail = async () => {
    setBusy(true);
    try {
      await confirmCookEmail(otpCode);
      patch({ email_verified: true });
      setVerifyHint('Email verified ✓');
      setTimeout(() => goNext(), 400);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendMobile = async () => {
    const gate = validateCookOnboardingStep('mobile', draft);
    if (!gate.ok) {
      setError(gate.message);
      return;
    }
    setBusy(true);
    try {
      const res = await sendCookMobileVerify(draft.contact_mobile);
      setVerifyHint(res.hint || `Enter code ${COOK_ONBOARDING_DEMO_OTP}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmMobile = async () => {
    setBusy(true);
    try {
      await confirmCookMobile(otpCode);
      patch({ mobile_verified: true });
      setVerifyHint('Mobile verified ✓');
      setTimeout(() => goNext(), 400);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
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

  const fillPaynowFromContact = () => {
    const mobile = normalizePaynowMobile(draft.contact_mobile) || '';
    patch({ paynow_mobile: mobile, paynow_mobile_confirm: mobile });
  };

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
      case 'verify_email':
        return (
          <>
            <button
              type="button"
              onClick={sendEmail}
              disabled={busy}
              className="w-full rounded-xl bg-primary text-primary-foreground font-bold py-3 mb-3"
              data-testid="cook-onboarding-send-email"
            >
              {busy ? 'Sending…' : 'Send verification code'}
            </button>
            <FieldLabel>6-digit code</FieldLabel>
            <TextField value={otpCode} onChange={setOtpCode} placeholder="123456" testID="cook-onboarding-email-otp" />
            <button
              type="button"
              onClick={confirmEmail}
              disabled={busy}
              className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] font-bold py-3 mb-2"
              data-testid="cook-onboarding-confirm-email"
            >
              Confirm email
            </button>
            {verifyHint ? <p className="text-sm font-bold text-primary">{verifyHint}</p> : null}
          </>
        );
      case 'mobile':
        return (
          <>
            <FieldLabel>Mobile number</FieldLabel>
            <TextField
              value={draft.contact_mobile}
              onChange={(contact_mobile) => patch({ contact_mobile })}
              placeholder="9123 4567"
              testID="cook-onboarding-mobile-input"
              type="tel"
            />
            <label className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm font-semibold">Same number for WhatsApp</span>
              <input
                type="checkbox"
                checked={draft.whatsapp_same}
                onChange={(e) => patch({ whatsapp_same: e.target.checked })}
              />
            </label>
          </>
        );
      case 'verify_mobile':
        return (
          <>
            <button
              type="button"
              onClick={sendMobile}
              disabled={busy}
              className="w-full rounded-xl bg-primary text-primary-foreground font-bold py-3 mb-3"
              data-testid="cook-onboarding-send-mobile"
            >
              Send SMS code
            </button>
            <FieldLabel>6-digit code</FieldLabel>
            <TextField value={otpCode} onChange={setOtpCode} placeholder="123456" testID="cook-onboarding-mobile-otp" />
            <button
              type="button"
              onClick={confirmMobile}
              disabled={busy}
              className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] font-bold py-3 mb-2"
              data-testid="cook-onboarding-confirm-mobile"
            >
              Confirm mobile
            </button>
            {verifyHint ? <p className="text-sm font-bold text-primary">{verifyHint}</p> : null}
          </>
        );
      case 'paynow':
        return (
          <>
            <button
              type="button"
              onClick={fillPaynowFromContact}
              className="w-full rounded-xl bg-primary text-primary-foreground font-bold py-3 mb-3"
              data-testid="cook-onboarding-paynow-same"
            >
              Use contact mobile
            </button>
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
      case 'menu_basics':
        return (
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
            <FieldLabel>Portion</FieldLabel>
            <ChipRow
              options={['plate', 'piece']}
              value={draft.dish_portion_unit}
              onChange={(v) => patch({ dish_portion_unit: v as 'plate' | 'piece' })}
            />
            <FieldLabel>Recommended pax</FieldLabel>
            <ChipRow
              options={['2', '3', '4']}
              value={String(draft.dish_recommended_pax)}
              onChange={(v) => patch({ dish_recommended_pax: Number(v) as 2 | 3 | 4 })}
            />
            <FieldLabel>List price (S$)</FieldLabel>
            <TextField
              value={draft.dish_price}
              onChange={(dish_price) => patch({ dish_price })}
              placeholder="12"
              testID="cook-onboarding-dish-price"
              type="number"
            />
          </>
        );
      case 'menu_details':
        return (
          <>
            <FieldLabel>Ingredients</FieldLabel>
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
            <FieldLabel>Description</FieldLabel>
            <TextField
              value={draft.dish_description}
              onChange={(dish_description) => patch({ dish_description })}
              placeholder="Brief heritage story for this dish"
              testID="cook-onboarding-dish-desc"
              multiline
            />
            <FieldLabel>Minimum order lead (days)</FieldLabel>
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
            <label className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm font-semibold">Dish available</span>
              <input
                type="checkbox"
                checked={draft.dish_available}
                onChange={(e) => patch({ dish_available: e.target.checked })}
              />
            </label>
            <FieldLabel>Calories (optional)</FieldLabel>
            <TextField
              value={draft.dish_calories}
              onChange={(dish_calories) => patch({ dish_calories })}
              testID="cook-onboarding-calories"
              type="number"
            />
          </>
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

  return (
    <SHCOnboardingFlowScreenWeb
      imageUri={IMAGE_BY_KEY[stepMeta.imageKey] || BENTO_ACTION_IMAGES.listings}
      title={stepMeta.title}
      subtitle={`${chapterDots.chapterLabel} · ${chapterDots.percentComplete}% · Step ${progress.stepInChapter}/${progress.stepsInChapter}\n${stepMeta.subtitle}`}
      stepIndex={chapterDots.chapterIndex}
      totalSteps={chapterDots.totalChapters}
      onNext={handlePrimary}
      onSkip={stepMeta.skippable ? goNext : undefined}
      onSecondary={canGoBack ? goBack : undefined}
      secondaryLabel={canGoBack ? 'Back' : undefined}
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
