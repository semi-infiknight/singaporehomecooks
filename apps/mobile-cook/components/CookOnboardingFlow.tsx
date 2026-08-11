import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  SHCOnboardingFlowScreen,
  SHCOnboardingOptionStack,
  SHCCookAreaPicker,
  shcColors,
  shcSpacing,
  shcBorders,
  shcRadii,
  SHCButton,
  SHCButtonText,
} from '@shc/ui';
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
  normalizePaynowMobile,
  type CookOnboardingDraft,
  type CookOnboardingStepId,
} from '@shc/utils';
import {
  markCookOnboardingSeen,
  loadCookOnboardingDraft,
  saveCookOnboardingDraft,
} from '../lib/onboarding';
import {
  updateCookProfile,
  createCookListing,
  getCurrentUser,
  getCookProfile,
} from '../lib/api-client';
import { loadCookSignupMobile } from '../lib/cook-signup-mobile';
import { CookKitchenAddressPicker } from './CookKitchenAddressPicker';
import { pickCookMediaImage, uploadCookMediaImage } from '../lib/cook-media-upload';
import { pickComplianceCertificate, uploadComplianceCertificate } from '../lib/compliance-upload';

const IMAGE_BY_KEY: Record<string, string> = {
  listings: BENTO_ACTION_IMAGES.listings,
  compliance: BENTO_ACTION_IMAGES.compliance,
  orders: BENTO_ACTION_IMAGES.orders,
  family: PROMO_BANNER_IMAGES.family,
  checkout: BENTO_ACTION_IMAGES.checkout,
};

const WELCOME_HERO_CARDS = [
  BENTO_ACTION_IMAGES.listings,
  PROMO_BANNER_IMAGES.family,
  BENTO_ACTION_IMAGES.checkout,
] as const;

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function TextField({
  value,
  onChangeText,
  placeholder,
  testID,
  keyboardType,
  secureTextEntry,
  multiline,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  testID?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address';
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={shcColors.textLight}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      style={[multiline ? styles.input : styles.inputShort]}
      testID={testID}
      autoCorrect
      spellCheck
      textAlign="left"
      textAlignVertical={multiline ? 'top' : 'center'}
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
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, sel && styles.chipOn]}
            testID={testIDPrefix ? `${testIDPrefix}-${opt.replace(/\s+/g, '-').toLowerCase()}` : undefined}
          >
            <Text style={[styles.chipText, sel && styles.chipTextOn]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
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
    <Pressable onPress={onToggle} style={styles.consentRow} testID={testID}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={styles.consentLabel}>{label}</Text>
    </Pressable>
  );
}

function resolveOnboardingPhotoUri(stored: string, preview?: string): string | undefined {
  if (preview?.trim()) return preview;
  const value = stored.trim();
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('file://') || value.startsWith('data:')) {
    return value;
  }
  return undefined;
}

export default function CookOnboardingFlow() {
  const router = useRouter();
  const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
  const [stepId, setStepId] = useState<CookOnboardingStepId>('welcome');
  const [draft, setDraft] = useState<CookOnboardingDraft>(createEmptyCookOnboardingDraft);
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<'avatar_url' | 'dish_image_url' | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ avatar_url?: string; dish_image_url?: string }>({});
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (maestroE2e) {
        setDraftReady(true);
        return;
      }
      const saved = await loadCookOnboardingDraft();
      if (!cancelled && saved) {
        setStepId(saved.stepId);
        setDraft(saved.draft);
      }
      if (!cancelled) setDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [maestroE2e]);

  useEffect(() => {
    if (!draftReady || maestroE2e) return;
    void (async () => {
      const signupMobile = await loadCookSignupMobile();
      if (signupMobile) {
        setDraft((d) => ({
          ...d,
          contact_mobile: signupMobile,
          mobile_verified: true,
          whatsapp_same: true,
        }));
      }
      void getCookProfile()
        .then((res) => {
          const cook = res.cook as {
            contact_mobile?: string;
            whatsapp_number?: string;
            mobile_verified_at?: string | null;
          };
          const mobile =
            cook?.contact_mobile?.replace(/^\+65/, '') ||
            cook?.whatsapp_number?.replace(/^\+65/, '') ||
            signupMobile ||
            '';
          if (!mobile) return;
          setDraft((d) => ({
            ...d,
            mobile_verified: true,
            contact_mobile: mobile,
            whatsapp_same: true,
          }));
        })
        .catch(() => null);
    })();
  }, [draftReady, maestroE2e]);

  useEffect(() => {
    if (!draftReady || maestroE2e) return;
    void saveCookOnboardingDraft({ stepId, draft });
  }, [draft, stepId, draftReady, maestroE2e]);

  useEffect(() => {
    if (!maestroE2e) return;
    setDraft((d) => ({
      ...d,
      area: 'Tampines',
      kitchen_address: 'Blk 88 Tampines Street 1, #08-88',
      contact_mobile: '91234567',
      mobile_verified: true,
      paynow_mobile: '91234567',
      paynow_mobile_confirm: '91234567',
      pdpa_consent: true,
      terms_consent: true,
      display_name: 'Maestro Test Cook',
      responsible_person_name: 'Maestro Tester',
      nric_fin_last4: '123B',
      kitchen_halal_certified: false,
      compliance_uploaded: { sfa: true, wsq: true, halal: false },
      dish_cuisine: 'Singapore',
      dish_name: 'Maestro Nasi Lemak',
      dish_price: '12',
      dish_ingredients: 'Rice, coconut milk, sambal',
      dish_description: 'Heritage kitchen test dish for Maestro e2e.',
      dish_lead_time_slot: COOK_ONBOARDING_LEAD_TIME_SLOTS[2],
    }));
  }, [maestroE2e]);

  const stepMeta = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId)!;
  const linear = cookOnboardingLinearProgress(stepId);
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
      Alert.alert('Almost there', gate.message);
      return;
    }
    const next = cookOnboardingNextStep(stepId);
    if (next) setStepId(next);
  };

  const finish = async () => {
    setBusy(true);
    try {
      await updateCookProfile(buildCookOnboardingProfilePayload(draft) as any);
      if (draft.dish_name.trim()) {
        try {
          await createCookListing(buildCookOnboardingFirstListingPayload(draft));
        } catch (listingErr) {
          const listingMsg = (listingErr as Error).message || '';
          await markCookOnboardingSeen();
          router.replace('/(cook)/dashboard');
          Alert.alert(
            'Profile saved',
            listingMsg.includes('Compliance') || listingMsg.includes('SFA') || listingMsg.includes('WSQ')
              ? 'Your kitchen profile is ready. Upload SFA & WSQ certificates in Compliance to publish your first dish.'
              : `Your kitchen profile is saved. We could not publish your dish yet — ${listingMsg || 'try again from Listings.'}`
          );
          return;
        }
      }
      await markCookOnboardingSeen();
      router.replace('/(cook)/dashboard');
    } catch (e) {
      Alert.alert('Could not finish setup', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handlePrimary = () => {
    if (isLast) void finish();
    else goNext();
  };

  const applyPaynowFromWhatsapp = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        patch({ whatsapp_same: false });
        return;
      }
      let source = draft.contact_mobile.trim();
      if (!source) {
        source = (await loadCookSignupMobile()) ?? '';
      }
      if (!source && draft.paynow_mobile.trim()) {
        source = draft.paynow_mobile;
      }
      const normalized = normalizePaynowMobile(source);
      const display = normalized ? normalized.replace(/^\+65/, '') : source.replace(/^\+65/, '').trim();
      patch({
        whatsapp_same: true,
        ...(source ? { contact_mobile: display } : {}),
        paynow_mobile: display,
        paynow_mobile_confirm: display,
      });
    },
    [draft.contact_mobile, draft.paynow_mobile, patch]
  );

  useEffect(() => {
    if (stepId !== 'paynow' || !draft.whatsapp_same || !draft.contact_mobile.trim()) return;
    const normalized = normalizePaynowMobile(draft.contact_mobile);
    const display = normalized ? normalized.replace(/^\+65/, '') : draft.contact_mobile.replace(/^\+65/, '').trim();
    if (draft.paynow_mobile === display && draft.paynow_mobile_confirm === display) return;
    patch({ paynow_mobile: display, paynow_mobile_confirm: display });
  }, [stepId, draft.contact_mobile, draft.whatsapp_same, draft.paynow_mobile, draft.paynow_mobile_confirm, patch]);

  const markCert = async (type: 'sfa' | 'wsq' | 'halal') => {
    const cookId = getCurrentUser()?.id;
    if (!cookId) {
      Alert.alert('Upload', 'Sign in again to upload certificates.');
      return;
    }
    setBusy(true);
    try {
      const file = await pickComplianceCertificate();
      if (!file) return;
      await uploadComplianceCertificate(cookId, type, file);
      patch({
        compliance_uploaded: { ...draft.compliance_uploaded, [type]: true },
      });
    } catch (e) {
      Alert.alert('Upload', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async (field: 'avatar_url' | 'dish_image_url') => {
    const cookId = getCurrentUser()?.id;
    if (!cookId) {
      Alert.alert('Photo', 'Sign in again to upload photos.');
      return;
    }
    setUploadingPhoto(field);
    setBusy(true);
    try {
      const file = await pickCookMediaImage();
      if (!file) return;
      if (file.uri) {
        setMediaPreview((prev) => ({ ...prev, [field]: file.uri }));
      }
      const kind = field === 'avatar_url' ? 'avatar' : 'hero';
      const uploaded = await uploadCookMediaImage(cookId, kind, file);
      patch({ [field]: uploaded.key });
      if (uploaded.url) {
        setMediaPreview((prev) => ({ ...prev, [field]: uploaded.url }));
      }
    } catch (e) {
      Alert.alert('Photo', (e as Error).message);
    } finally {
      setUploadingPhoto(null);
      setBusy(false);
    }
  };

  const renderStep = () => {
    switch (stepId) {
      case 'area':
        return <SHCCookAreaPicker value={draft.area} onChange={(area) => patch({ area })} testID="cook-onboarding-area-input" />;
      case 'kitchen_address':
        return (
          <>
            <CookKitchenAddressPicker
              kitchenAddress={draft.kitchen_address}
              collectionInstructions={draft.collection_instructions}
              areaHint={draft.area || undefined}
              onConfirm={({ kitchen_address, collection_instructions }) =>
                patch({
                  kitchen_address,
                  ...(collection_instructions !== undefined ? { collection_instructions } : {}),
                })
              }
              testID="cook-onboarding-kitchen-address"
            />
            <FieldLabel>Collection instructions (optional)</FieldLabel>
            <TextField
              value={draft.collection_instructions}
              onChangeText={(collection_instructions) => patch({ collection_instructions })}
              placeholder="Lift lobby B — WhatsApp on arrival"
              testID="cook-onboarding-collection-input"
              multiline
            />
          </>
        );
      case 'paynow':
        return (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Same as WhatsApp{draft.contact_mobile ? ` (+65 ${draft.contact_mobile.replace(/^\+65/, '')})` : ''}
              </Text>
              <Switch
                value={draft.whatsapp_same}
                onValueChange={applyPaynowFromWhatsapp}
                testID="cook-onboarding-paynow-same"
              />
            </View>
            <FieldLabel>PayNow mobile</FieldLabel>
            <TextField value={draft.paynow_mobile} onChangeText={(paynow_mobile) => patch({ paynow_mobile, whatsapp_same: false })} placeholder="9123 4567" keyboardType="phone-pad" testID="cook-onboarding-paynow-mobile" />
            <FieldLabel>Confirm PayNow mobile</FieldLabel>
            <TextField value={draft.paynow_mobile_confirm} onChangeText={(paynow_mobile_confirm) => patch({ paynow_mobile_confirm, whatsapp_same: false })} placeholder="9123 4567" keyboardType="phone-pad" testID="cook-onboarding-paynow-confirm" />
          </>
        );
      case 'legal':
        return (
          <>
            <ConsentRow checked={draft.pdpa_consent} onToggle={() => patch({ pdpa_consent: !draft.pdpa_consent })} label="I agree to PDPA data handling and accurate allergen disclosure on every listing." testID="cook-onboarding-pdpa-checkbox" />
            <ConsentRow checked={draft.terms_consent} onToggle={() => patch({ terms_consent: !draft.terms_consent })} label="I accept the Terms & Conditions and marketplace rules." testID="cook-onboarding-terms-checkbox" />
          </>
        );
      case 'profile_photo': {
        const avatarUri = resolveOnboardingPhotoUri(draft.avatar_url, mediaPreview.avatar_url);
        return (
          <>
            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatar} /> : null}
            <SHCButton onPress={() => pickPhoto('avatar_url')} testID="cook-onboarding-avatar-pick" disabled={uploadingPhoto === 'avatar_url'}>
              <SHCButtonText>
                {uploadingPhoto === 'avatar_url' ? 'Uploading…' : avatarUri || draft.avatar_url ? 'Change photo' : 'Add profile photo'}
              </SHCButtonText>
            </SHCButton>
          </>
        );
      }
      case 'cook_name':
        return <TextField value={draft.display_name} onChangeText={(display_name) => patch({ display_name })} placeholder="Auntie Rose's Kitchen" testID="cook-onboarding-cook-name" />;
      case 'responsible_person':
        return <TextField value={draft.responsible_person_name} onChangeText={(responsible_person_name) => patch({ responsible_person_name })} placeholder="Full legal name" testID="cook-onboarding-responsible-name" />;
      case 'nric_fin':
        return <TextField value={draft.nric_fin_last4} onChangeText={(nric_fin_last4) => patch({ nric_fin_last4 })} placeholder="e.g. 123B" testID="cook-onboarding-nric" />;
      case 'alternate_contact':
        return <TextField value={draft.alternate_contact} onChangeText={(alternate_contact) => patch({ alternate_contact })} placeholder="Backup mobile" keyboardType="phone-pad" testID="cook-onboarding-alt-contact" />;
      case 'halal':
        return (
          <SHCOnboardingOptionStack
            options={[
              { label: 'Yes, halal certified', value: 'yes' },
              { label: 'No, not halal certified', value: 'no' },
            ]}
            value={draft.kitchen_halal_certified === true ? 'yes' : draft.kitchen_halal_certified === false ? 'no' : ''}
            onChange={(v) => patch({ kitchen_halal_certified: v === 'yes' })}
            testIDPrefix="cook-onboarding-halal"
          />
        );
      case 'certificates':
        return (
          <>
            {(['sfa', 'wsq', 'halal'] as const).map((t) => (
              <Pressable key={t} style={styles.certRow} onPress={() => markCert(t)} testID={`cook-onboarding-cert-${t}`}>
                <Text style={styles.certLabel}>{t.toUpperCase()} certificate</Text>
                <Text style={styles.certStatus}>{draft.compliance_uploaded[t] ? '✓ Uploaded' : 'Tap to upload photo'}</Text>
              </Pressable>
            ))}
          </>
        );
      case 'kitchen_available':
        return (
          <SHCOnboardingOptionStack
            options={[
              { label: 'Yes — accepting orders', value: 'yes' },
              { label: 'No — taking a break', value: 'no' },
            ]}
            value={draft.kitchen_available ? 'yes' : 'no'}
            onChange={(v) => patch({ kitchen_available: v === 'yes' })}
            testIDPrefix="cook-onboarding-kitchen-available"
          />
        );
      case 'menu_intro':
        return null;
      case 'menu_cuisine':
        return (
          <SHCOnboardingOptionStack
            options={COOK_ONBOARDING_CUISINE_PRESETS.map((c) => ({ label: c, value: c }))}
            value={draft.dish_cuisine}
            onChange={(dish_cuisine) => patch({ dish_cuisine })}
            testIDPrefix="cook-onboarding-cuisine"
          />
        );
      case 'menu_dish_name':
        return <TextField value={draft.dish_name} onChangeText={(dish_name) => patch({ dish_name })} placeholder="Nasi Lemak" testID="cook-onboarding-dish-name" />;
      case 'menu_portion':
        return (
          <SHCOnboardingOptionStack
            options={[
              { label: 'Plate', value: 'plate' },
              { label: 'Piece', value: 'piece' },
            ]}
            value={draft.dish_portion_unit}
            onChange={(v) => patch({ dish_portion_unit: v as 'plate' | 'piece' })}
            testIDPrefix="cook-onboarding-portion"
          />
        );
      case 'menu_pax':
        return (
          <SHCOnboardingOptionStack
            options={[
              { label: '2 pax', value: '2' },
              { label: '3 pax', value: '3' },
            ]}
            value={String(draft.dish_recommended_pax)}
            onChange={(v) => patch({ dish_recommended_pax: Number(v) as 2 | 3 })}
            testIDPrefix="cook-onboarding-pax"
          />
        );
      case 'menu_price':
        return <TextField value={draft.dish_price} onChangeText={(dish_price) => patch({ dish_price })} placeholder="12" keyboardType="number-pad" testID="cook-onboarding-dish-price" />;
      case 'menu_ingredients':
        return (
          <>
            <ChipRow options={COOK_ONBOARDING_INGREDIENT_SUGGESTIONS} value="" onChange={(ing) => patch({ dish_ingredients: draft.dish_ingredients ? `${draft.dish_ingredients}, ${ing}` : ing })} testIDPrefix="cook-onboarding-ingredient" />
            <TextField value={draft.dish_ingredients} onChangeText={(dish_ingredients) => patch({ dish_ingredients })} placeholder="Rice, coconut milk, sambal…" multiline testID="cook-onboarding-ingredients" />
          </>
        );
      case 'menu_description':
        return <TextField value={draft.dish_description} onChangeText={(dish_description) => patch({ dish_description })} placeholder="Brief heritage story for this dish" multiline testID="cook-onboarding-dish-desc" />;
      case 'menu_lead_time':
        return (
          <>
            <FieldLabel>Minimum lead (days)</FieldLabel>
            <TextField value={String(draft.dish_lead_days)} onChangeText={(t) => patch({ dish_lead_days: Number(t) || 1 })} keyboardType="number-pad" testID="cook-onboarding-lead-days" />
            <FieldLabel>Preferred collection window</FieldLabel>
            <SHCOnboardingOptionStack
              options={COOK_ONBOARDING_LEAD_TIME_SLOTS.map((s) => ({ label: s, value: s }))}
              value={draft.dish_lead_time_slot}
              onChange={(dish_lead_time_slot) => patch({ dish_lead_time_slot })}
              testIDPrefix="cook-onboarding-lead-slot"
            />
          </>
        );
      case 'menu_dish_available':
        return (
          <SHCOnboardingOptionStack
            options={[
              { label: 'Yes — dish available', value: 'yes' },
              { label: 'No — pause this dish', value: 'no' },
            ]}
            value={draft.dish_available ? 'yes' : 'no'}
            onChange={(v) => patch({ dish_available: v === 'yes' })}
            testIDPrefix="cook-onboarding-dish-available"
          />
        );
      case 'menu_calories':
        return <TextField value={draft.dish_calories} onChangeText={(dish_calories) => patch({ dish_calories })} placeholder="e.g. 450" keyboardType="number-pad" testID="cook-onboarding-calories" />;
      case 'menu_photo': {
        const dishUri = resolveOnboardingPhotoUri(draft.dish_image_url, mediaPreview.dish_image_url);
        return (
          <>
            {dishUri ? <Image source={{ uri: dishUri }} style={styles.dishPhoto} /> : null}
            <SHCButton onPress={() => pickPhoto('dish_image_url')} testID="cook-onboarding-dish-photo" disabled={uploadingPhoto === 'dish_image_url'}>
              <SHCButtonText>
                {uploadingPhoto === 'dish_image_url' ? 'Uploading…' : dishUri || draft.dish_image_url ? 'Change dish photo' : 'Add dish photo'}
              </SHCButtonText>
            </SHCButton>
          </>
        );
      }
      case 'complete':
        return (
          <>
            <Text style={styles.completeCopy}>You’re ready to accept orders. Complete setup to open your dashboard.</Text>
            {maestroE2e ? (
              <SHCButton onPress={finish} testID="cook-onboarding-maestro-finish" style={{ marginTop: shcSpacing.md }}>
                <SHCButtonText>Maestro: save & finish</SHCButtonText>
              </SHCButton>
            ) : null}
          </>
        );
      default:
        return null;
    }
  };

  if (!draftReady) return null;

  const isWelcome = stepId === 'welcome';

  return (
    <>
      <StatusBar style={isWelcome ? 'light' : 'dark'} />
      <SHCOnboardingFlowScreen
      variant={isWelcome ? 'hero' : 'default'}
      heroCardUris={isWelcome ? [...WELCOME_HERO_CARDS] : undefined}
      imageUri={IMAGE_BY_KEY[stepMeta.imageKey] || BENTO_ACTION_IMAGES.listings}
      title={stepMeta.title}
      subtitle={stepMeta.subtitle}
      stepIndex={linear.current - 1}
      totalSteps={linear.total}
      progressPercent={linear.percent}
      chapterLabel={isWelcome ? undefined : `Step ${linear.current} of ${linear.total}`}
      showHero={stepMeta.hero && !isWelcome}
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
    </SHCOnboardingFlowScreen>
    </>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: shcColors.text,
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: -0.1,
  },
  inputShort: {
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: shcSpacing.md,
    backgroundColor: '#FFFFFF',
    color: shcColors.text,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    marginBottom: shcSpacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    borderRadius: 14,
    padding: shcSpacing.md,
    minHeight: 96,
    backgroundColor: '#FFFFFF',
    color: shcColors.text,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    textAlignVertical: 'top',
    marginBottom: shcSpacing.sm,
    width: '100%',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: shcSpacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: shcRadii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    backgroundColor: '#FFFFFF',
  },
  chipOn: {
    backgroundColor: '#FFF5F0',
    borderColor: shcColors.primary,
    borderWidth: 2,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: shcColors.text },
  chipTextOn: { color: shcColors.primary },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: shcSpacing.sm,
    marginTop: shcSpacing.sm,
    padding: shcSpacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.1)',
    backgroundColor: '#FFFFFF',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.18)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: shcColors.surface,
  },
  checkboxOn: { backgroundColor: shcColors.primary, borderColor: shcColors.primary },
  checkMark: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  consentLabel: { flex: 1, fontSize: 15, color: shcColors.text, lineHeight: 22, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: shcSpacing.md },
  switchLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: shcColors.text, paddingRight: 12 },
  sentTo: { fontSize: 14, fontWeight: '600', color: shcColors.textLight, marginBottom: shcSpacing.md },
  hint: { fontSize: 13, color: shcColors.primary, fontWeight: '700', marginTop: 8 },
  certRow: {
    padding: shcSpacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  certLabel: { fontWeight: '800', fontSize: 14 },
  certStatus: { fontSize: 12, color: shcColors.textLight, marginTop: 4 },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignSelf: 'center',
    marginBottom: shcSpacing.md,
    borderWidth: 3,
    borderColor: '#FFE8DE',
  },
  dishPhoto: {
    width: '100%',
    height: 168,
    borderRadius: 16,
    marginBottom: shcSpacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.08)',
  },
  completeCopy: { fontSize: 16, lineHeight: 24, color: shcColors.text, fontWeight: '600' },
});
