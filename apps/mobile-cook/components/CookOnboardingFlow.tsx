import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  Switch,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  SHCOnboardingFlowScreen,
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
  COOK_ONBOARDING_DEMO_OTP,
  COOK_ONBOARDING_CUISINE_PRESETS,
  COOK_ONBOARDING_INGREDIENT_SUGGESTIONS,
  createEmptyCookOnboardingDraft,
  validateCookOnboardingStep,
  cookOnboardingNextStep,
  cookOnboardingChapterProgress,
  buildCookOnboardingProfilePayload,
  buildCookOnboardingFirstListingPayload,
  cookAreaPresetNames,
  type CookOnboardingDraft,
  type CookOnboardingStepId,
} from '@shc/utils';
import { markCookOnboardingSeen } from '../lib/onboarding';
import {
  updateCookProfile,
  sendCookEmailVerify,
  confirmCookEmail,
  sendCookMobileVerify,
  confirmCookMobile,
  createCookListing,
  submitComplianceDoc,
} from '../lib/api-client';

const IMAGE_BY_KEY: Record<string, string> = {
  listings: BENTO_ACTION_IMAGES.listings,
  compliance: BENTO_ACTION_IMAGES.compliance,
  orders: BENTO_ACTION_IMAGES.orders,
  family: PROMO_BANNER_IMAGES.family,
  checkout: BENTO_ACTION_IMAGES.checkout,
};

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

export default function CookOnboardingFlow() {
  const router = useRouter();
  const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
  const [stepId, setStepId] = useState<CookOnboardingStepId>('welcome');
  const [draft, setDraft] = useState<CookOnboardingDraft>(createEmptyCookOnboardingDraft);
  const [busy, setBusy] = useState(false);
  const [verifyHint, setVerifyHint] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const areas = useMemo(() => cookAreaPresetNames(), []);

  useEffect(() => {
    if (!maestroE2e) return;
    setDraft((d) => ({
      ...d,
      area: 'Tampines',
      kitchen_address: 'Blk 88 Tampines Street 1, #08-88',
      email_verified: true,
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
    }));
  }, [maestroE2e]);

  const stepMeta = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId)!;
  const progress = cookOnboardingChapterProgress(stepId);
  const stepIndex = COOK_ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
  const isLast = stepId === 'complete';

  const patch = useCallback((partial: Partial<CookOnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

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
        await createCookListing(buildCookOnboardingFirstListingPayload(draft));
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

  const sendEmail = async () => {
    setBusy(true);
    try {
      const res = await sendCookEmailVerify();
      setVerifyHint(res.hint || `Enter code ${COOK_ONBOARDING_DEMO_OTP}`);
    } catch (e) {
      Alert.alert('Email verify', (e as Error).message);
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
    } catch (e) {
      Alert.alert('Invalid code', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendMobile = async () => {
    const gate = validateCookOnboardingStep('mobile', draft);
    if (!gate.ok) {
      Alert.alert('Mobile', gate.message);
      return;
    }
    setBusy(true);
    try {
      const res = await sendCookMobileVerify(draft.contact_mobile);
      setVerifyHint(res.hint || `Enter code ${COOK_ONBOARDING_DEMO_OTP}`);
    } catch (e) {
      Alert.alert('SMS', (e as Error).message);
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
    } catch (e) {
      Alert.alert('Invalid code', (e as Error).message);
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
      Alert.alert('Upload', (e as Error).message);
    }
  };

  const pickPhoto = async (field: 'avatar_url' | 'dish_image_url') => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) {
      patch({ [field]: res.assets[0].uri });
    }
  };

  const renderStep = () => {
    switch (stepId) {
      case 'area':
        return (
          <>
            <FieldLabel>Neighbourhood</FieldLabel>
            <Pressable style={styles.dropdown} onPress={() => setAreaModalOpen(true)} testID="cook-onboarding-area-input">
              <Text style={draft.area ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {draft.area || 'Select area…'}
              </Text>
            </Pressable>
            <Modal visible={areaModalOpen} animationType="slide" transparent>
              <View style={styles.modalBackdrop}>
                <View style={styles.modalSheet}>
                  <Text style={styles.modalTitle}>Select area</Text>
                  <FlatList
                    data={areas}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <Pressable
                        style={styles.modalRow}
                        onPress={() => {
                          patch({ area: item });
                          setAreaModalOpen(false);
                        }}
                      >
                        <Text style={styles.modalRowText}>{item}</Text>
                      </Pressable>
                    )}
                  />
                  <SHCButton onPress={() => setAreaModalOpen(false)} testID="cook-onboarding-area-close">
                    <SHCButtonText>Close</SHCButtonText>
                  </SHCButton>
                </View>
              </View>
            </Modal>
          </>
        );
      case 'kitchen_address':
        return (
          <>
            <FieldLabel>Kitchen address</FieldLabel>
            <TextField
              value={draft.kitchen_address}
              onChangeText={(kitchen_address) => patch({ kitchen_address })}
              placeholder="Blk 456 Tampines St 42, #05-123"
              testID="cook-onboarding-address-input"
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
      case 'verify_email':
        return (
          <>
            <SHCButton onPress={sendEmail} disabled={busy} testID="cook-onboarding-send-email">
              <SHCButtonText>{busy ? 'Sending…' : 'Send verification code'}</SHCButtonText>
            </SHCButton>
            <FieldLabel>6-digit code</FieldLabel>
            <TextField value={otpCode} onChangeText={setOtpCode} placeholder="123456" keyboardType="number-pad" testID="cook-onboarding-email-otp" />
            <SHCButton onPress={confirmEmail} disabled={busy} testID="cook-onboarding-confirm-email">
              <SHCButtonText>Confirm email</SHCButtonText>
            </SHCButton>
            {verifyHint ? <Text style={styles.hint}>{verifyHint}</Text> : null}
          </>
        );
      case 'mobile':
        return (
          <>
            <FieldLabel>Mobile number</FieldLabel>
            <TextField
              value={draft.contact_mobile}
              onChangeText={(contact_mobile) => patch({ contact_mobile })}
              placeholder="9123 4567"
              keyboardType="phone-pad"
              testID="cook-onboarding-mobile-input"
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Same number for WhatsApp</Text>
              <Switch value={draft.whatsapp_same} onValueChange={(whatsapp_same) => patch({ whatsapp_same })} />
            </View>
          </>
        );
      case 'verify_mobile':
        return (
          <>
            <SHCButton onPress={sendMobile} disabled={busy} testID="cook-onboarding-send-mobile">
              <SHCButtonText>Send SMS code</SHCButtonText>
            </SHCButton>
            <FieldLabel>6-digit code</FieldLabel>
            <TextField value={otpCode} onChangeText={setOtpCode} placeholder="123456" keyboardType="number-pad" testID="cook-onboarding-mobile-otp" />
            <SHCButton onPress={confirmMobile} disabled={busy} testID="cook-onboarding-confirm-mobile">
              <SHCButtonText>Confirm mobile</SHCButtonText>
            </SHCButton>
            {verifyHint ? <Text style={styles.hint}>{verifyHint}</Text> : null}
          </>
        );
      case 'paynow':
        return (
          <>
            <FieldLabel>PayNow mobile</FieldLabel>
            <TextField value={draft.paynow_mobile} onChangeText={(paynow_mobile) => patch({ paynow_mobile })} placeholder="9123 4567" keyboardType="phone-pad" testID="cook-onboarding-paynow-mobile" />
            <FieldLabel>Confirm PayNow mobile</FieldLabel>
            <TextField value={draft.paynow_mobile_confirm} onChangeText={(paynow_mobile_confirm) => patch({ paynow_mobile_confirm })} placeholder="9123 4567" keyboardType="phone-pad" testID="cook-onboarding-paynow-confirm" />
          </>
        );
      case 'legal':
        return (
          <>
            <ConsentRow checked={draft.pdpa_consent} onToggle={() => patch({ pdpa_consent: !draft.pdpa_consent })} label="I agree to PDPA data handling and accurate allergen disclosure on every listing." testID="cook-onboarding-pdpa-checkbox" />
            <ConsentRow checked={draft.terms_consent} onToggle={() => patch({ terms_consent: !draft.terms_consent })} label="I accept the Terms & Conditions and marketplace rules." testID="cook-onboarding-terms-checkbox" />
          </>
        );
      case 'profile_photo':
        return (
          <>
            {draft.avatar_url ? <Image source={{ uri: draft.avatar_url }} style={styles.avatar} /> : null}
            <SHCButton onPress={() => pickPhoto('avatar_url')} testID="cook-onboarding-avatar-pick">
              <SHCButtonText>{draft.avatar_url ? 'Change photo' : 'Add profile photo'}</SHCButtonText>
            </SHCButton>
          </>
        );
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
              <Pressable key={t} style={styles.certRow} onPress={() => markCert(t)} testID={`cook-onboarding-cert-${t}`}>
                <Text style={styles.certLabel}>{t.toUpperCase()} certificate</Text>
                <Text style={styles.certStatus}>{draft.compliance_uploaded[t] ? '✓ Uploaded' : 'Tap to mark uploaded'}</Text>
              </Pressable>
            ))}
          </>
        );
      case 'kitchen_available':
        return (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Kitchen accepting orders</Text>
            <Switch value={draft.kitchen_available} onValueChange={(kitchen_available) => patch({ kitchen_available })} testID="cook-onboarding-kitchen-available" />
          </View>
        );
      case 'menu_basics':
        return (
          <>
            <FieldLabel>Cuisine</FieldLabel>
            <ChipRow options={COOK_ONBOARDING_CUISINE_PRESETS} value={draft.dish_cuisine} onChange={(dish_cuisine) => patch({ dish_cuisine })} testIDPrefix="cook-onboarding-cuisine" />
            <FieldLabel>Dish name</FieldLabel>
            <TextField value={draft.dish_name} onChangeText={(dish_name) => patch({ dish_name })} placeholder="Nasi Lemak" testID="cook-onboarding-dish-name" />
            <FieldLabel>Portion</FieldLabel>
            <ChipRow options={['plate', 'piece']} value={draft.dish_portion_unit} onChange={(v) => patch({ dish_portion_unit: v as 'plate' | 'piece' })} />
            <FieldLabel>Recommended pax</FieldLabel>
            <ChipRow options={['2', '3', '4']} value={String(draft.dish_recommended_pax)} onChange={(v) => patch({ dish_recommended_pax: Number(v) as 2 | 3 | 4 })} />
            <FieldLabel>List price (S$)</FieldLabel>
            <TextField value={draft.dish_price} onChangeText={(dish_price) => patch({ dish_price })} placeholder="12" keyboardType="number-pad" testID="cook-onboarding-dish-price" />
          </>
        );
      case 'menu_details':
        return (
          <>
            <FieldLabel>Ingredients</FieldLabel>
            <ChipRow options={COOK_ONBOARDING_INGREDIENT_SUGGESTIONS} value="" onChange={(ing) => patch({ dish_ingredients: draft.dish_ingredients ? `${draft.dish_ingredients}, ${ing}` : ing })} testIDPrefix="cook-onboarding-ingredient" />
            <TextField value={draft.dish_ingredients} onChangeText={(dish_ingredients) => patch({ dish_ingredients })} placeholder="Rice, coconut milk, sambal…" multiline testID="cook-onboarding-ingredients" />
            <FieldLabel>Description</FieldLabel>
            <TextField value={draft.dish_description} onChangeText={(dish_description) => patch({ dish_description })} placeholder="Brief heritage story for this dish" multiline testID="cook-onboarding-dish-desc" />
            <FieldLabel>Minimum order lead (days)</FieldLabel>
            <TextField value={String(draft.dish_lead_days)} onChangeText={(t) => patch({ dish_lead_days: Number(t) || 1 })} keyboardType="number-pad" testID="cook-onboarding-lead-days" />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Dish available</Text>
              <Switch value={draft.dish_available} onValueChange={(dish_available) => patch({ dish_available })} />
            </View>
            <FieldLabel>Calories (optional)</FieldLabel>
            <TextField value={draft.dish_calories} onChangeText={(dish_calories) => patch({ dish_calories })} keyboardType="number-pad" testID="cook-onboarding-calories" />
          </>
        );
      case 'menu_photo':
        return (
          <>
            {draft.dish_image_url ? <Image source={{ uri: draft.dish_image_url }} style={styles.dishPhoto} /> : null}
            <SHCButton onPress={() => pickPhoto('dish_image_url')} testID="cook-onboarding-dish-photo">
              <SHCButtonText>{draft.dish_image_url ? 'Change dish photo' : 'Add dish photo'}</SHCButtonText>
            </SHCButton>
          </>
        );
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

  return (
    <SHCOnboardingFlowScreen
      imageUri={IMAGE_BY_KEY[stepMeta.imageKey] || BENTO_ACTION_IMAGES.listings}
      title={stepMeta.title}
      subtitle={`${progress.chapterLabel} · Step ${progress.overallStep} of ${progress.overallTotal}\n${stepMeta.subtitle}`}
      stepIndex={stepIndex}
      totalSteps={COOK_ONBOARDING_STEPS.length}
      onNext={handlePrimary}
      onSkip={stepMeta.skippable ? goNext : undefined}
      nextLabel={isLast ? (busy ? 'Finishing…' : stepMeta.nextLabel || 'Finish') : stepMeta.nextLabel || 'Continue'}
      nextTestID={isLast ? 'cook-onboarding-finish-btn' : 'cook-onboarding-next-btn'}
      skipTestID="cook-onboarding-skip-btn"
      disabled={busy}
      loading={busy}
      screenTestID="cook-onboarding-screen"
    >
      {renderStep()}
    </SHCOnboardingFlowScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 12, fontWeight: '800', color: shcColors.text, marginBottom: 4, marginTop: 8 },
  inputShort: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: shcRadii.lg,
    padding: shcSpacing.md,
    backgroundColor: '#FAFAFA',
    color: shcColors.text,
    fontSize: 16,
    marginBottom: shcSpacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: shcRadii.lg,
    padding: shcSpacing.md,
    minHeight: 88,
    backgroundColor: '#FAFAFA',
    color: shcColors.text,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: shcSpacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: shcSpacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: shcRadii.pill,
    borderWidth: shcBorders.thin,
    borderColor: shcColors.border,
    backgroundColor: '#FFF',
  },
  chipOn: { backgroundColor: shcColors.primary, borderColor: shcColors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: shcColors.text },
  chipTextOn: { color: shcColors.onPrimary },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: shcSpacing.sm, marginTop: shcSpacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: shcBorders.thin,
    borderColor: shcColors.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxOn: { backgroundColor: shcColors.primary, borderColor: shcColors.primary },
  checkMark: { color: shcColors.onPrimary, fontWeight: '800', fontSize: 14 },
  consentLabel: { flex: 1, fontSize: 15, color: shcColors.text, lineHeight: 22 },
  dropdown: {
    borderWidth: shcBorders.thin,
    borderColor: shcColors.border,
    borderRadius: shcRadii.lg,
    padding: shcSpacing.md,
    backgroundColor: '#FAFAFA',
    marginBottom: shcSpacing.sm,
  },
  dropdownValue: { fontSize: 16, fontWeight: '700', color: shcColors.text },
  dropdownPlaceholder: { fontSize: 16, color: shcColors.textLight },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFBF7', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', padding: shcSpacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: shcSpacing.md },
  modalRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8DDD4' },
  modalRowText: { fontSize: 16, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: shcSpacing.md },
  switchLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: shcColors.text, paddingRight: 12 },
  hint: { fontSize: 13, color: shcColors.primary, fontWeight: '700', marginTop: 8 },
  certRow: { padding: shcSpacing.md, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: shcRadii.lg, marginBottom: 8 },
  certLabel: { fontWeight: '800', fontSize: 14 },
  certStatus: { fontSize: 12, color: shcColors.textLight, marginTop: 4 },
  avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: shcSpacing.md },
  dishPhoto: { width: '100%', height: 160, borderRadius: shcRadii.lg, marginBottom: shcSpacing.md },
  completeCopy: { fontSize: 16, lineHeight: 24, color: shcColors.text, fontWeight: '600' },
});
