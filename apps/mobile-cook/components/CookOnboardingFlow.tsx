import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  SHCOnboardingFlowScreen,
  SHCOnboardingOptionStack,
  shcColors,
  shcSpacing,
  shcRadii,
  SHCButton,
  SHCButtonText,
} from '@shc/ui';
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

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function TextField({
  value,
  onChangeText,
  placeholder,
  testID,
  keyboardType,
  multiline,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  testID?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address';
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={shcColors.textLight}
      keyboardType={keyboardType}
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
  const [stepId, setStepId] = useState<CookOnboardingStepId>('kitchen');
  const [draft, setDraft] = useState<CookOnboardingDraft>(createEmptyCookOnboardingDraft);
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ dish_image_url?: string }>({});
  const [draftReady, setDraftReady] = useState(false);
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [formOpen, setFormOpen] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (maestroE2e) {
        setDraftReady(true);
        return;
      }
      const saved = await loadCookOnboardingDraft();
      if (!cancelled && saved) {
        setStepId(coerceCookOnboardingStepId(saved.stepId));
        setDraft({ ...createEmptyCookOnboardingDraft(), ...saved.draft, saved_dishes: saved.draft.saved_dishes || [] });
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
        }));
      }
      void getCookProfile()
        .then((res) => {
          const cook = res.cook as { contact_mobile?: string; whatsapp_number?: string };
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
      display_name: 'Maestro Test Cook',
      contact_mobile: '91234567',
      mobile_verified: true,
      paynow_mobile: '91234567',
      paynow_mobile_confirm: '91234567',
      pdpa_consent: true,
      terms_consent: true,
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

  const stepMeta = COOK_ONBOARDING_STEPS.find((s) => s.id === stepId) ?? COOK_ONBOARDING_STEPS[0];
  const linear = cookOnboardingLinearProgress(stepId);
  const isLast = stepId === 'menu';
  const canGoBack = cookOnboardingPrevStep(stepId) !== null;
  const takeHome = useMemo(() => cookOnboardingCookTakeHome(Number(draft.dish_price)), [draft.dish_price]);
  const selectedIngredients = useMemo(
    () =>
      draft.dish_ingredients
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [draft.dish_ingredients]
  );

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
    const gate = validateCookOnboardingStep(stepId, draft);
    if (!gate.ok) {
      Alert.alert('Almost there', gate.message);
      return;
    }
    setBusy(true);
    try {
      await updateCookProfile(buildCookOnboardingProfilePayload(draft) as any);
      const dishes = collectCookOnboardingDishes(draft);
      for (const dish of dishes) {
        try {
          await createCookListing(
            buildCookOnboardingFirstListingPayload({ ...dish, kitchen_halal_certified: draft.kitchen_halal_certified })
          );
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

  const saveDishToMenu = () => {
    const gate = validateCookOnboardingDish(draft);
    if (!gate.ok) {
      Alert.alert('Almost there', gate.message);
      return;
    }
    const snap = snapshotCookOnboardingDish(draft);
    const nextSaved =
      editingIndex != null
        ? draft.saved_dishes.map((d, i) => (i === editingIndex ? snap : d))
        : [...draft.saved_dishes, snap];
    patch({
      saved_dishes: nextSaved,
      ...createEmptyCookOnboardingDish(),
    });
    setEditingIndex(null);
    setFormOpen(false);
    setMediaPreview({});
    setIngredientQuery('');
  };

  const addNewDish = () => {
    if (formOpen && cookOnboardingHasDishDraft(draft)) {
      const gate = validateCookOnboardingDish(draft);
      if (!gate.ok) {
        Alert.alert('Almost there', gate.message);
        return;
      }
      const snap = snapshotCookOnboardingDish(draft);
      const nextSaved =
        editingIndex != null
          ? draft.saved_dishes.map((d, i) => (i === editingIndex ? snap : d))
          : [...draft.saved_dishes, snap];
      patch({
        saved_dishes: nextSaved,
        ...createEmptyCookOnboardingDish(),
      });
    } else if (formOpen) {
      patch(createEmptyCookOnboardingDish());
    }
    setEditingIndex(null);
    setFormOpen(true);
    setMediaPreview({});
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

  const pickPhoto = async () => {
    const cookId = getCurrentUser()?.id;
    if (!cookId) {
      Alert.alert('Photo', 'Sign in again to upload photos.');
      return;
    }
    setUploadingPhoto(true);
    setBusy(true);
    try {
      const file = await pickCookMediaImage();
      if (!file) return;
      if (file.uri) setMediaPreview({ dish_image_url: file.uri });
      const uploaded = await uploadCookMediaImage(cookId, 'hero', file);
      patch({ dish_image_url: uploaded.key });
      if (uploaded.url) setMediaPreview({ dish_image_url: uploaded.url });
    } catch (e) {
      Alert.alert('Photo', (e as Error).message);
    } finally {
      setUploadingPhoto(false);
      setBusy(false);
    }
  };

  const toggleIngredient = (name: string) => {
    const next = selectedIngredients.includes(name)
      ? selectedIngredients.filter((i) => i !== name)
      : [...selectedIngredients, name];
    patch({ dish_ingredients: next.join(', ') });
  };

  const renderStep = () => {
    switch (stepId) {
      case 'kitchen':
        return (
          <>
            <FieldLabel>Kitchen name</FieldLabel>
            <TextField
              value={draft.display_name}
              onChangeText={(display_name) => patch({ display_name })}
              placeholder="Auntie Rose's Kitchen"
              testID="cook-onboarding-cook-name"
            />
            <FieldLabel>Kitchen address</FieldLabel>
            <CookKitchenAddressPicker
              kitchenAddress={draft.kitchen_address}
              onConfirm={({ kitchen_address, area }) =>
                patch({
                  kitchen_address,
                  ...(area ? { area } : {}),
                })
              }
              testID="cook-onboarding-kitchen-address"
            />
          </>
        );
      case 'paynow':
        return (
          <>
            <FieldLabel>PayNow mobile</FieldLabel>
            <TextField
              value={draft.paynow_mobile}
              onChangeText={(paynow_mobile) => patch({ paynow_mobile })}
              placeholder="9123 4567"
              keyboardType="phone-pad"
              testID="cook-onboarding-paynow-mobile"
            />
            <FieldLabel>Confirm PayNow mobile</FieldLabel>
            <TextField
              value={draft.paynow_mobile_confirm}
              onChangeText={(paynow_mobile_confirm) => patch({ paynow_mobile_confirm })}
              placeholder="9123 4567"
              keyboardType="phone-pad"
              testID="cook-onboarding-paynow-confirm"
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
            onChangeText={(responsible_person_name) => patch({ responsible_person_name })}
            placeholder="Full legal name"
            testID="cook-onboarding-responsible-name"
          />
        );
      case 'nric_fin':
        return (
          <TextField
            value={draft.nric_fin_last4}
            onChangeText={(nric_fin_last4) => patch({ nric_fin_last4 })}
            placeholder="e.g. 123B"
            testID="cook-onboarding-nric"
          />
        );
      case 'alternate_contact':
        return (
          <TextField
            value={draft.alternate_contact}
            onChangeText={(alternate_contact) => patch({ alternate_contact })}
            placeholder="Backup mobile"
            keyboardType="phone-pad"
            testID="cook-onboarding-alt-contact"
          />
        );
      case 'halal':
        return (
          <View style={styles.choiceGrid}>
            {(
              [
                { label: 'Yes', value: 'yes', testID: 'cook-onboarding-halal-yes' },
                { label: 'No', value: 'no', testID: 'cook-onboarding-halal-no' },
              ] as const
            ).map((opt) => {
              const selected =
                opt.value === 'yes'
                  ? draft.kitchen_halal_certified === true
                  : draft.kitchen_halal_certified === false;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => patch({ kitchen_halal_certified: opt.value === 'yes' })}
                  style={[styles.choiceCard, selected && styles.choiceCardOn]}
                  testID={opt.testID}
                >
                  <Text style={[styles.choiceLabel, selected && styles.choiceLabelOn]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        );
      case 'certificates':
        return (
          <>
            {(['sfa', 'wsq', 'halal'] as const).map((t) => (
              <Pressable key={t} style={styles.certRow} onPress={() => markCert(t)} testID={`cook-onboarding-cert-${t}`}>
                <Text style={styles.certLabel}>{t.toUpperCase()} certificate</Text>
                <Text style={styles.certStatus}>{draft.compliance_uploaded[t] ? '✓ Uploaded' : 'Tap to upload'}</Text>
              </Pressable>
            ))}
          </>
        );
      case 'menu': {
        const dishUri = resolveOnboardingPhotoUri(draft.dish_image_url, mediaPreview.dish_image_url);
        const ingredientMatches = filterIngredientSuggestions(ingredientQuery, selectedIngredients);
        const addCustom =
          ingredientQuery.trim().length > 0 &&
          !ingredientMatches.some((ing) => ing.toLowerCase() === ingredientQuery.trim().toLowerCase()) &&
          !selectedIngredients.some((ing) => ing.toLowerCase() === ingredientQuery.trim().toLowerCase());
        return (
          <>
            {draft.saved_dishes.map((dish, index) => {
              const thumb = resolveOnboardingPhotoUri(dish.dish_image_url);
              return (
              <Pressable
                key={`${dish.dish_name}-${index}`}
                onPress={() => editSavedDish(index)}
                style={styles.listingCard}
                testID={`cook-onboarding-saved-dish-${index}`}
              >
                <View style={styles.listingRow}>
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.listingThumb} />
                  ) : (
                    <View style={styles.listingThumbFallback}>
                      <Text style={styles.listingThumbLetter}>{(dish.dish_name || 'D').slice(0, 1).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingName} numberOfLines={1}>
                      {dish.dish_name}
                    </Text>
                    <Text style={styles.listingMeta} numberOfLines={1}>
                      {dish.dish_cuisine ? `${dish.dish_cuisine} · ` : ''}S${dish.dish_price}
                    </Text>
                  </View>
                  <Text style={styles.listingEdit}>Edit</Text>
                </View>
              </Pressable>
              );
            })}
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
              onChangeText={(dish_name) => patch({ dish_name })}
              placeholder="Nasi Lemak"
              testID="cook-onboarding-dish-name"
            />
            <FieldLabel>Portion size</FieldLabel>
            <SHCOnboardingOptionStack
              options={[
                { label: 'Plate', value: 'plate' },
                { label: 'Piece', value: 'piece' },
              ]}
              value={draft.dish_portion_unit}
              onChange={(v) => patch({ dish_portion_unit: v as 'plate' | 'piece' })}
              testIDPrefix="cook-onboarding-portion"
            />
            <FieldLabel>Recommended pax</FieldLabel>
            <SHCOnboardingOptionStack
              options={[
                { label: '2 pax', value: '2' },
                { label: '3 pax', value: '3' },
              ]}
              value={String(draft.dish_recommended_pax)}
              onChange={(v) => patch({ dish_recommended_pax: Number(v) as 2 | 3 })}
              testIDPrefix="cook-onboarding-pax"
            />
            <FieldLabel>List price (S$)</FieldLabel>
            <TextField
              value={draft.dish_price}
              onChangeText={(dish_price) => patch({ dish_price })}
              placeholder="12"
              keyboardType="number-pad"
              testID="cook-onboarding-dish-price"
            />
            {takeHome ? (
              <Text style={styles.takeHome} testID="cook-onboarding-take-home">
                You receive S${takeHome.cook.toFixed(2)} after our 15% cut
              </Text>
            ) : null}
            <FieldLabel>Ingredients</FieldLabel>
            {selectedIngredients.length ? (
              <View style={styles.chipRow}>
                {selectedIngredients.map((ing) => (
                  <Pressable
                    key={ing}
                    onPress={() => toggleIngredient(ing)}
                    style={[styles.chip, styles.chipOn]}
                    testID={`cook-onboarding-ingredient-${ing.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Text style={[styles.chipText, styles.chipTextOn]}>× {ing}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View testID="cook-onboarding-ingredients-open">
              <TextField
                value={ingredientQuery}
                onChangeText={setIngredientQuery}
                placeholder="Search ingredients"
                testID="cook-onboarding-ingredients"
              />
              {(ingredientQuery.length > 0 || ingredientMatches.length > 0) && ingredientQuery.length > 0 ? (
                <View style={styles.suggestBox}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.suggestScroll}>
                    {ingredientMatches.map((ing) => (
                      <Pressable
                        key={ing}
                        onPress={() => {
                          toggleIngredient(ing);
                          setIngredientQuery('');
                        }}
                        style={styles.suggestRow}
                        testID={`cook-onboarding-ingredient-suggest-${ing.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <Text style={styles.suggestText}>{ing}</Text>
                      </Pressable>
                    ))}
                    {addCustom ? (
                      <Pressable
                        onPress={() => {
                          const name = ingredientQuery.trim();
                          patch({
                            dish_ingredients: [...selectedIngredients, name].join(', '),
                          });
                          setIngredientQuery('');
                        }}
                        style={styles.suggestRow}
                        testID="cook-onboarding-ingredient-custom"
                      >
                        <Text style={styles.suggestText}>Add “{ingredientQuery.trim()}”</Text>
                      </Pressable>
                    ) : null}
                  </ScrollView>
                </View>
              ) : null}
            </View>
            <FieldLabel>Brief description</FieldLabel>
            <TextField
              value={draft.dish_description}
              onChangeText={(dish_description) => patch({ dish_description })}
              placeholder="What makes this dish special"
              multiline
              testID="cook-onboarding-dish-desc"
            />
            <FieldLabel>Minimum order time (days)</FieldLabel>
            <TextField
              value={String(draft.dish_lead_days)}
              onChangeText={(t) => patch({ dish_lead_days: Number(t) || 1 })}
              keyboardType="number-pad"
              testID="cook-onboarding-lead-days"
            />
            <FieldLabel>Collection window</FieldLabel>
            <SHCOnboardingOptionStack
              options={COOK_ONBOARDING_LEAD_TIME_SLOTS.map((s) => ({ label: s, value: s }))}
              value={draft.dish_lead_time_slot}
              onChange={(dish_lead_time_slot) => patch({ dish_lead_time_slot })}
              testIDPrefix="cook-onboarding-lead-slot"
            />
            <FieldLabel>Dish available</FieldLabel>
            <SHCOnboardingOptionStack
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              value={draft.dish_available ? 'yes' : 'no'}
              onChange={(v) => patch({ dish_available: v === 'yes' })}
              testIDPrefix="cook-onboarding-dish-available"
            />
            <FieldLabel>Photo of dish</FieldLabel>
            {dishUri ? <Image source={{ uri: dishUri }} style={styles.dishPhoto} /> : null}
            <SHCButton onPress={pickPhoto} testID="cook-onboarding-dish-photo" disabled={uploadingPhoto}>
              <SHCButtonText>
                {uploadingPhoto ? 'Uploading…' : dishUri || draft.dish_image_url ? 'Change dish photo' : 'Add dish photo'}
              </SHCButtonText>
            </SHCButton>
            <View style={{ marginTop: shcSpacing.md }}>
              <SHCButton onPress={saveDishToMenu} testID="cook-onboarding-save-dish">
                <SHCButtonText>Save dish to menu</SHCButtonText>
              </SHCButton>
            </View>
              </>
            ) : null}
            <View style={{ marginTop: shcSpacing.sm }}>
              <SHCButton variant="ghost" onPress={addNewDish} testID="cook-onboarding-add-dish">
                <SHCButtonText variant="ghost">+ Add new dish</SHCButtonText>
              </SHCButton>
            </View>
            {maestroE2e ? (
              <SHCButton onPress={finish} testID="cook-onboarding-maestro-finish" style={{ marginTop: shcSpacing.md }}>
                <SHCButtonText>Maestro: save & finish</SHCButtonText>
              </SHCButton>
            ) : null}
          </>
        );
      }
      default:
        return null;
    }
  };

  if (!draftReady) return null;

  return (
    <>
      <StatusBar style="dark" />
      <SHCOnboardingFlowScreen
        imageUri={IMAGE_BY_KEY[stepMeta.imageKey] || BENTO_ACTION_IMAGES.listings}
        title={stepMeta.title}
        subtitle={stepMeta.subtitle}
        stepIndex={linear.current - 1}
        totalSteps={linear.total}
        progressPercent={linear.percent}
        showHero={false}
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
    backgroundColor: '#1F3D2B',
    borderColor: '#1F3D2B',
  },
  chipText: { fontSize: 13, fontWeight: '700', color: shcColors.text },
  chipTextOn: { color: '#FFFFFF' },
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
  dishPhoto: {
    width: '100%',
    height: 168,
    borderRadius: 16,
    marginBottom: shcSpacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.08)',
  },
  takeHome: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F3D2B',
    marginBottom: shcSpacing.sm,
  },
  savedNote: { fontSize: 13, fontWeight: '700', color: shcColors.textLight, marginBottom: 8 },
  choiceGrid: { flexDirection: 'row', gap: 12, marginTop: shcSpacing.sm },
  choiceCard: {
    flex: 1,
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCardOn: { backgroundColor: '#1F3D2B', borderColor: '#1F3D2B' },
  choiceLabel: { fontSize: 18, fontWeight: '800', color: shcColors.text },
  choiceLabelOn: { color: '#FFFFFF' },
  dropdownBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: shcSpacing.md,
    backgroundColor: '#FFFFFF',
    marginBottom: shcSpacing.sm,
  },
  dropdownValue: { fontSize: 15, fontWeight: '600', color: shcColors.text },
  dropdownPlaceholder: { fontSize: 15, fontWeight: '500', color: shcColors.textLight },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(36,24,18,0.08)',
  },
  listingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listingThumb: { width: 56, height: 56, borderRadius: 12 },
  listingThumbFallback: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F0E4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingThumbLetter: { fontSize: 20, fontWeight: '800', color: shcColors.text },
  listingInfo: { flex: 1, minWidth: 0 },
  listingName: { fontSize: 15, fontWeight: '800', color: shcColors.text },
  listingMeta: { fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 2 },
  listingEdit: { fontSize: 13, fontWeight: '800', color: shcColors.ctaInk },
  suggestBox: {
    marginTop: -6,
    marginBottom: shcSpacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36,24,18,0.1)',
    maxHeight: 180,
    overflow: 'hidden',
  },
  suggestScroll: { maxHeight: 180 },
  suggestRow: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(36,24,18,0.08)' },
  suggestText: { fontSize: 14, fontWeight: '600', color: shcColors.text },
  addMoreBtn: { marginTop: shcSpacing.md, alignItems: 'center', paddingVertical: 12 },
  addMoreText: { fontSize: 15, fontWeight: '800', color: shcColors.primary },
  sheetScrim: { flex: 1, backgroundColor: 'rgba(36,24,18,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFBF7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: shcSpacing.lg,
    paddingBottom: 32,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: shcSpacing.md },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: shcColors.text },
  sheetClose: { fontSize: 28, fontWeight: '400', color: shcColors.textLight, paddingHorizontal: 8 },
});
