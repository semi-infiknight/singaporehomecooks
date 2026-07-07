// Collection location picker — search, saved addresses, map confirm (map slot injected per platform).
// @ts-nocheck
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import type { SHCSavedAddress } from '@shc/types';
import type { AddressSearchResult } from '@shc/utils';
import { formatLocationLabel, formatLocationShort } from '@shc/utils';
import { shcSpacing, gourmeatColors, gourmeatRadii, gourmeatShadows } from './theme';
import { SHCButton, SHCButtonText, SHCCard } from './primitives';
import { SHCIcon } from './icons';
import { SHCCheckoutStepper } from './food-ux';
import { SHCLocationDraggableMap } from './location-map';

export type PinNudgeDirection = 'n' | 's' | 'e' | 'w';

export type LocationPickerCopy = {
  collectionBadge: string;
  titleStep1: string;
  titleStep2: string;
  subtitleStep1: string;
  subtitleStep2: string;
  stepFind: string;
  stepConfirm: string;
  useGps: string;
  gettingGps: string;
  savedAddresses: string;
  remove: string;
  searchSection: string;
  searchPlaceholder: string;
  searchGo: string;
  searching: string;
  sourceOnemap: string;
  sourceArea: string;
  geocodeLooking: string;
  pinLabel: (lat: number, lng: number) => string;
  pinHint: string;
  addressLabelSection: string;
  labelHome: string;
  labelWork: string;
  labelOther: string;
  line1Section: string;
  line2Section: string;
  line2Placeholder: string;
  postalSection: string;
  instructionsSection: string;
  instructionsPlaceholder: string;
  preview: (label: string) => string;
  saveBtn: string;
  saving: string;
  loadingAddress: string;
  steps: () => Array<{ id: string; label: string }>;
  addressLabels: () => Array<{ id: SHCSavedAddress['label']; title: string }>;
};

export function LocationPickerExperience({
  step,
  onStepChange,
  query,
  onQueryChange,
  results,
  searching,
  onSearch,
  saved,
  activeId,
  onSelectSaved,
  onDeleteSaved,
  onUseCurrentLocation,
  locating,
  draft,
  onDraftChange,
  onSelectResult,
  onConfirm,
  onBack,
  busy,
  onNudgePin,
  onPinDrag,
  copy,
  testID = 'location-picker',
}: {
  step: 1 | 2;
  onStepChange: (s: 1 | 2) => void;
  query: string;
  onQueryChange: (q: string) => void;
  results: AddressSearchResult[];
  searching: boolean;
  onSearch: () => void;
  saved: SHCSavedAddress[];
  activeId?: string;
  onSelectSaved: (addr: SHCSavedAddress) => void;
  onDeleteSaved?: (id: string) => void;
  onUseCurrentLocation: () => void;
  locating: boolean;
  draft: Partial<SHCSavedAddress> | null;
  onDraftChange: (patch: Partial<SHCSavedAddress>) => void;
  onSelectResult: (r: AddressSearchResult) => void;
  onConfirm: () => void;
  onBack?: () => void;
  busy?: boolean;
  onNudgePin?: (dir: PinNudgeDirection) => void;
  onPinDrag?: (coords: { lat: number; lng: number }) => void;
  copy: LocationPickerCopy;
  testID?: string;
}) {
  const steps = copy.steps();
  const labels = copy.addressLabels();
  const goBack = () => {
    if (step === 2) onStepChange(1);
    else onBack?.();
  };

  const header = (
    <View style={{ paddingHorizontal: shcSpacing.md, paddingTop: shcSpacing.md, backgroundColor: gourmeatColors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: shcSpacing.sm }}>
        <Pressable onPress={goBack} testID="location-back-btn" style={backBtn}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: gourmeatColors.text }}>←</Text>
        </Pressable>
        <Text style={{ fontSize: 11, fontWeight: '700', color: gourmeatColors.textLight }}>{copy.collectionBadge}</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '900', color: gourmeatColors.text }}>
        {step === 1 ? copy.titleStep1 : copy.titleStep2}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4, lineHeight: 18 }}>
        {step === 1 ? copy.subtitleStep1 : copy.subtitleStep2}
      </Text>
      <View style={{ marginTop: shcSpacing.md }}>
        <SHCCheckoutStepper steps={steps} currentStep={step} testID="location-stepper" />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: gourmeatColors.background }} testID={testID}>
      {header}
      <ScrollView
        key={`location-scroll-${step}`}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: shcSpacing.xl, flexGrow: 1 }}
        showsVerticalScrollIndicator
        style={{ flex: 1, backgroundColor: gourmeatColors.background }}
      >
        <View key={`location-body-${step}`} style={{ paddingHorizontal: shcSpacing.md, backgroundColor: gourmeatColors.background }}>
            {step === 1 ? (
              <View testID="location-step-find">
                <SHCButton variant="outline" onPress={onUseCurrentLocation} disabled={locating} testID="location-use-gps" style={{ marginBottom: shcSpacing.md }}>
                  <SHCButtonText variant="outline">{locating ? copy.gettingGps : copy.useGps}</SHCButtonText>
                </SHCButton>

                {saved.length > 0 && (
                  <>
                    <Text style={sectionLabel}>{copy.savedAddresses}</Text>
                    {saved.map((addr) => (
                      <Pressable key={addr.id} onPress={() => onSelectSaved(addr)} testID={`saved-addr-${addr.id}`} style={{ marginBottom: shcSpacing.sm }}>
                        <SHCCard variant={activeId === addr.id ? 'bento-mint' : 'default'}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm }}>
                            <SHCIcon name="location" size={18} color={gourmeatColors.primary} active />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontWeight: '800', fontSize: 13, textTransform: 'capitalize' }}>{addr.label}</Text>
                              <Text style={{ fontSize: 12, color: gourmeatColors.textLight, marginTop: 2 }} numberOfLines={2}>
                                {formatLocationShort(addr)}
                              </Text>
                            </View>
                            {onDeleteSaved && (
                              <Pressable onPress={() => onDeleteSaved(addr.id)} hitSlop={8} testID={`delete-addr-${addr.id}`}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: gourmeatColors.error }}>{copy.remove}</Text>
                              </Pressable>
                            )}
                          </View>
                        </SHCCard>
                      </Pressable>
                    ))}
                  </>
                )}

                <Text style={sectionLabel}>{copy.searchSection}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: shcSpacing.sm }}>
                  <TextInput
                    value={query}
                    onChangeText={onQueryChange}
                    placeholder={copy.searchPlaceholder}
                    placeholderTextColor={gourmeatColors.textMuted}
                    style={[inputStyle, { flex: 1 }]}
                    testID="location-search-input"
                    returnKeyType="search"
                    onSubmitEditing={onSearch}
                  />
                  <SHCButton onPress={onSearch} disabled={searching || query.trim().length < 2} testID="location-search-btn">
                    <SHCButtonText>{searching ? '…' : copy.searchGo}</SHCButtonText>
                  </SHCButton>
                </View>

                {searching && <ActivityIndicator color={gourmeatColors.primary} style={{ marginVertical: shcSpacing.sm }} />}

                {results.map((r) => (
                  <Pressable key={r.id} onPress={() => onSelectResult(r)} testID={`location-result-${r.id}`} style={{ marginBottom: shcSpacing.sm }}>
                    <SHCCard>
                      <Text style={{ fontWeight: '800', fontSize: 14 }}>{r.title}</Text>
                      <Text style={{ fontSize: 12, color: gourmeatColors.textLight, marginTop: 2 }}>{r.subtitle}</Text>
                      <Text style={{ fontSize: 10, color: gourmeatColors.textLight, marginTop: 4 }}>
                        {r.source === 'onemap' ? copy.sourceOnemap : copy.sourceArea}
                      </Text>
                    </SHCCard>
                  </Pressable>
                ))}
              </View>
            ) : draft ? (
              <View testID="location-step-confirm">
                {draft.source === 'gps' && !draft.line1 ? (
                  <View style={geocodeBanner}>
                    <ActivityIndicator color={gourmeatColors.primary} size="small" />
                    <Text style={geocodeBannerText}>{copy.geocodeLooking}</Text>
                  </View>
                ) : null}
                {draft.lat != null && draft.lng != null && onPinDrag ? (
                  <View style={pinPanel} testID="location-pin-panel">
                    <SHCLocationDraggableMap lat={draft.lat} lng={draft.lng} onPinChange={onPinDrag} />
                    <Text style={pinCoords}>
                      {copy.pinLabel(draft.lat, draft.lng)}
                    </Text>
                    <Text style={hint}>{copy.pinHint}</Text>
                    {onNudgePin ? (
                    <View style={pinControls}>
                      <Pressable onPress={() => onNudgePin('n')} style={pinBtn} testID="location-map-n">
                        <Text style={pinBtnText}>↑</Text>
                      </Pressable>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Pressable onPress={() => onNudgePin('w')} style={pinBtn} testID="location-map-w">
                          <Text style={pinBtnText}>←</Text>
                        </Pressable>
                        <Pressable onPress={() => onNudgePin('e')} style={pinBtn} testID="location-map-e">
                          <Text style={pinBtnText}>→</Text>
                        </Pressable>
                      </View>
                      <Pressable onPress={() => onNudgePin('s')} style={pinBtn} testID="location-map-s">
                        <Text style={pinBtnText}>↓</Text>
                      </Pressable>
                    </View>
                    ) : null}
                  </View>
                ) : null}
                <Text style={sectionLabel}>{copy.addressLabelSection}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: shcSpacing.md }}>
                  {labels.map((l) => (
                    <Pressable
                      key={l.id}
                      onPress={() => onDraftChange({ label: l.id })}
                      style={chip(draft.label === l.id)}
                      testID={`location-label-${l.id}`}
                    >
                      <Text style={chipText(draft.label === l.id)}>{l.title}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={sectionLabel}>{copy.line1Section}</Text>
                <TextInput
                  value={draft.line1 ?? ''}
                  onChangeText={(t) => onDraftChange({ line1: t })}
                  style={inputStyle}
                  testID="location-line1"
                />
                <Text style={sectionLabel}>{copy.line2Section}</Text>
                <TextInput
                  value={draft.line2 ?? ''}
                  onChangeText={(t) => onDraftChange({ line2: t })}
                  placeholder={copy.line2Placeholder}
                  placeholderTextColor={gourmeatColors.textMuted}
                  style={inputStyle}
                  testID="location-line2"
                />
                <Text style={sectionLabel}>{copy.postalSection}</Text>
                <TextInput
                  value={draft.postal_code ?? ''}
                  onChangeText={(t) => onDraftChange({ postal_code: t.replace(/\D/g, '').slice(0, 6) })}
                  keyboardType="number-pad"
                  style={inputStyle}
                  testID="location-postal"
                />
                <Text style={sectionLabel}>{copy.instructionsSection}</Text>
                <TextInput
                  value={draft.instructions ?? ''}
                  onChangeText={(t) => onDraftChange({ instructions: t })}
                  placeholder={copy.instructionsPlaceholder}
                  placeholderTextColor={gourmeatColors.textMuted}
                  style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
                  multiline
                  testID="location-instructions"
                />

                <SHCCard variant="bento-peach" style={{ marginTop: shcSpacing.sm }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', lineHeight: 18 }}>
                    {copy.preview(formatLocationLabel(draft as SHCSavedAddress))}
                  </Text>
                </SHCCard>

                <SHCButton
                  size="lg"
                  onPress={onConfirm}
                  disabled={busy || !draft.line1 || (draft.line1?.length ?? 0) < 3}
                  testID="location-confirm-btn"
                  style={{ marginTop: shcSpacing.lg, width: '100%' }}
                >
                  <SHCButtonText>{busy ? copy.saving : copy.saveBtn}</SHCButtonText>
                </SHCButton>
              </View>
            ) : (
              <View testID="location-step-empty" style={{ paddingVertical: shcSpacing.lg }}>
                <ActivityIndicator color={gourmeatColors.primary} />
                <Text style={{ marginTop: shcSpacing.sm, fontWeight: '700', color: gourmeatColors.textLight }}>{copy.loadingAddress}</Text>
              </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}

const geocodeBanner = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: shcSpacing.md,
  padding: shcSpacing.sm,
  borderRadius: gourmeatRadii.md,
  backgroundColor: gourmeatColors.primaryLight,
  borderWidth: 1,
  borderColor: gourmeatColors.border,
};
const geocodeBannerText = { fontSize: 12, fontWeight: '700', color: gourmeatColors.text, flex: 1 };

const pinPanel = {
  marginTop: shcSpacing.sm,
  marginBottom: shcSpacing.md,
  padding: shcSpacing.md,
  borderRadius: gourmeatRadii.md,
  borderWidth: 1,
  borderColor: gourmeatColors.border,
  backgroundColor: gourmeatColors.surfaceAlt,
  ...gourmeatShadows.soft,
};
const pinCoords = { fontSize: 13, fontWeight: '800', color: gourmeatColors.text, marginBottom: 4 };
const pinControls = { alignItems: 'center', gap: 6, marginTop: shcSpacing.sm };
const pinBtn = {
  width: 40,
  height: 40,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: gourmeatColors.border,
  backgroundColor: gourmeatColors.surface,
  alignItems: 'center',
  justifyContent: 'center',
  ...gourmeatShadows.soft,
};
const pinBtnText = { fontSize: 16, fontWeight: '800', color: gourmeatColors.text };

const sectionLabel = { fontSize: 13, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm, marginTop: shcSpacing.sm };
const hint = { fontSize: 11, color: gourmeatColors.textLight, marginBottom: shcSpacing.sm, fontWeight: '600' };
const inputStyle = {
  borderWidth: 1,
  borderColor: gourmeatColors.border,
  borderRadius: gourmeatRadii.md,
  padding: shcSpacing.md,
  backgroundColor: gourmeatColors.surface,
  fontSize: 15,
  color: gourmeatColors.text,
  marginBottom: shcSpacing.sm,
  ...gourmeatShadows.soft,
};
const backBtn = {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: gourmeatColors.border,
  backgroundColor: gourmeatColors.surface,
  alignItems: 'center',
  justifyContent: 'center',
  ...gourmeatShadows.soft,
};
function chip(active: boolean) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: gourmeatRadii.pill,
    borderWidth: 1,
    borderColor: active ? gourmeatColors.primary : gourmeatColors.border,
    backgroundColor: active ? gourmeatColors.primary : gourmeatColors.surface,
  };
}
function chipText(active: boolean) {
  return { fontSize: 13, fontWeight: '800', color: active ? gourmeatColors.onPrimary : gourmeatColors.text };
}