// Collection location picker — search, saved addresses, map confirm (map slot injected per platform).
// @ts-nocheck
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import type { SHCSavedAddress } from '@shc/types';
import type { AddressSearchResult } from '@shc/utils';
import { formatLocationLabel, formatLocationShort } from '@shc/utils';
import { shcColors, shcSpacing, shcBorders, shcRadii, shcShadows, gourmeatColors } from './theme';
import { SHCButton, SHCButtonText, SHCCard } from './primitives';
import { SHCIcon } from './icons';
import { SHCCheckoutStepper } from './food-ux';
import { SHCLocationDraggableMap } from './location-map';

export type PinNudgeDirection = 'n' | 's' | 'e' | 'w';

const STEPS = [
  { id: 'find', label: 'Find' },
  { id: 'confirm', label: 'Confirm' },
];

const LABELS: Array<{ id: SHCSavedAddress['label']; title: string }> = [
  { id: 'home', title: 'Home' },
  { id: 'work', title: 'Work' },
  { id: 'other', title: 'Other' },
];

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
  testID?: string;
}) {
  const goBack = () => {
    if (step === 2) onStepChange(1);
    else onBack?.();
  };

  const header = (
    <View style={{ paddingHorizontal: shcSpacing.md, paddingTop: shcSpacing.md, backgroundColor: gourmeatColors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: shcSpacing.sm }}>
        <Pressable onPress={goBack} testID="location-back-btn" style={backBtn}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: shcColors.text }}>←</Text>
        </Pressable>
        <Text style={{ fontSize: 11, fontWeight: '700', color: shcColors.textLight }}>COLLECTION POINT</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '900', color: shcColors.text }}>
        {step === 1 ? 'Where will you collect?' : 'Confirm your address'}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: shcColors.textLight, marginTop: 4, lineHeight: 18 }}>
        {step === 1
          ? 'HDB collection only — we use this to show cooks near you. Cook unit address releases 2h before your slot.'
          : 'Nudge the pin if needed, then save your collection point.'}
      </Text>
      <View style={{ marginTop: shcSpacing.md }}>
        <SHCCheckoutStepper steps={STEPS} currentStep={step} testID="location-stepper" />
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
                  <SHCButtonText variant="outline">{locating ? 'Getting GPS…' : '📍 Use my current location'}</SHCButtonText>
                </SHCButton>

                {saved.length > 0 && (
                  <>
                    <Text style={sectionLabel}>Saved addresses</Text>
                    {saved.map((addr) => (
                      <Pressable key={addr.id} onPress={() => onSelectSaved(addr)} testID={`saved-addr-${addr.id}`} style={{ marginBottom: shcSpacing.sm }}>
                        <SHCCard variant={activeId === addr.id ? 'bento-mint' : 'default'}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm }}>
                            <SHCIcon name="location" size={18} color={shcColors.primary} active />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontWeight: '800', fontSize: 13, textTransform: 'capitalize' }}>{addr.label}</Text>
                              <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 2 }} numberOfLines={2}>
                                {formatLocationShort(addr)}
                              </Text>
                            </View>
                            {onDeleteSaved && (
                              <Pressable onPress={() => onDeleteSaved(addr.id)} hitSlop={8} testID={`delete-addr-${addr.id}`}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: shcColors.error }}>Remove</Text>
                              </Pressable>
                            )}
                          </View>
                        </SHCCard>
                      </Pressable>
                    ))}
                  </>
                )}

                <Text style={sectionLabel}>Search postal code, block, or area</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: shcSpacing.sm }}>
                  <TextInput
                    value={query}
                    onChangeText={onQueryChange}
                    placeholder="e.g. 520456, Tampines, Blk 89 Joo Chiat"
                    placeholderTextColor={shcColors.textLight}
                    style={[inputStyle, { flex: 1 }]}
                    testID="location-search-input"
                    returnKeyType="search"
                    onSubmitEditing={onSearch}
                  />
                  <SHCButton onPress={onSearch} disabled={searching || query.trim().length < 2} testID="location-search-btn">
                    <SHCButtonText>{searching ? '…' : 'Go'}</SHCButtonText>
                  </SHCButton>
                </View>

                {searching && <ActivityIndicator color={shcColors.primary} style={{ marginVertical: shcSpacing.sm }} />}

                {results.map((r) => (
                  <Pressable key={r.id} onPress={() => onSelectResult(r)} testID={`location-result-${r.id}`} style={{ marginBottom: shcSpacing.sm }}>
                    <SHCCard>
                      <Text style={{ fontWeight: '800', fontSize: 14 }}>{r.title}</Text>
                      <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 2 }}>{r.subtitle}</Text>
                      <Text style={{ fontSize: 10, color: shcColors.textLight, marginTop: 4 }}>
                        {r.source === 'onemap' ? 'OneMap SG' : 'Area guide'}
                      </Text>
                    </SHCCard>
                  </Pressable>
                ))}
              </View>
            ) : draft ? (
              <View testID="location-step-confirm">
                {draft.source === 'gps' && !draft.line1 ? (
                  <View style={geocodeBanner}>
                    <ActivityIndicator color={shcColors.primary} size="small" />
                    <Text style={geocodeBannerText}>Looking up your block from GPS…</Text>
                  </View>
                ) : null}
                {draft.lat != null && draft.lng != null && onPinDrag ? (
                  <View style={pinPanel} testID="location-pin-panel">
                    <SHCLocationDraggableMap lat={draft.lat} lng={draft.lng} onPinChange={onPinDrag} />
                    <Text style={pinCoords}>
                      Pin: {draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}
                    </Text>
                    <Text style={hint}>Drag the pin or tap the map — aim for your void deck or lift lobby.</Text>
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
                <Text style={sectionLabel}>Address label</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: shcSpacing.md }}>
                  {LABELS.map((l) => (
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

                <Text style={sectionLabel}>Block & street</Text>
                <TextInput
                  value={draft.line1 ?? ''}
                  onChangeText={(t) => onDraftChange({ line1: t })}
                  style={inputStyle}
                  testID="location-line1"
                />
                <Text style={sectionLabel}>Unit / floor (optional)</Text>
                <TextInput
                  value={draft.line2 ?? ''}
                  onChangeText={(t) => onDraftChange({ line2: t })}
                  placeholder="#05-123"
                  placeholderTextColor={shcColors.textLight}
                  style={inputStyle}
                  testID="location-line2"
                />
                <Text style={sectionLabel}>Postal code</Text>
                <TextInput
                  value={draft.postal_code ?? ''}
                  onChangeText={(t) => onDraftChange({ postal_code: t.replace(/\D/g, '').slice(0, 6) })}
                  keyboardType="number-pad"
                  style={inputStyle}
                  testID="location-postal"
                />
                <Text style={sectionLabel}>Collection notes (optional)</Text>
                <TextInput
                  value={draft.instructions ?? ''}
                  onChangeText={(t) => onDraftChange({ instructions: t })}
                  placeholder="Meet at void deck, call when arriving…"
                  placeholderTextColor={shcColors.textLight}
                  style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
                  multiline
                  testID="location-instructions"
                />

                <SHCCard variant="bento-peach" style={{ marginTop: shcSpacing.sm }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', lineHeight: 18 }}>
                    Preview: {formatLocationLabel(draft as SHCSavedAddress)}
                  </Text>
                </SHCCard>

                <SHCButton
                  size="lg"
                  onPress={onConfirm}
                  disabled={busy || !draft.line1 || (draft.line1?.length ?? 0) < 3}
                  testID="location-confirm-btn"
                  style={{ marginTop: shcSpacing.lg, width: '100%' }}
                >
                  <SHCButtonText>{busy ? 'Saving…' : 'Save collection location'}</SHCButtonText>
                </SHCButton>
              </View>
            ) : (
              <View testID="location-step-empty" style={{ paddingVertical: shcSpacing.lg }}>
                <ActivityIndicator color={shcColors.primary} />
                <Text style={{ marginTop: shcSpacing.sm, fontWeight: '700', color: shcColors.textLight }}>Loading address…</Text>
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
  borderRadius: shcRadii.md,
  backgroundColor: shcColors.bentoPeach,
  borderWidth: shcBorders.brutal,
  borderColor: shcColors.border,
};
const geocodeBannerText = { fontSize: 12, fontWeight: '700', color: shcColors.text, flex: 1 };

const pinPanel = {
  marginTop: shcSpacing.sm,
  marginBottom: shcSpacing.md,
  padding: shcSpacing.md,
  borderRadius: shcRadii.md,
  borderWidth: shcBorders.brutal,
  borderColor: shcColors.border,
  backgroundColor: shcColors.surfaceAlt,
  ...shcShadows.brutalSm,
};
const pinCoords = { fontSize: 13, fontWeight: '800', color: shcColors.text, marginBottom: 4 };
const pinControls = { alignItems: 'center', gap: 6, marginTop: shcSpacing.sm };
const pinBtn = {
  width: 40,
  height: 40,
  borderRadius: 10,
  borderWidth: shcBorders.brutal,
  borderColor: shcColors.border,
  backgroundColor: shcColors.surface,
  alignItems: 'center',
  justifyContent: 'center',
  ...shcShadows.brutalSm,
};
const pinBtnText = { fontSize: 16, fontWeight: '800', color: shcColors.text };

const sectionLabel = { fontSize: 13, fontWeight: '800', color: shcColors.text, marginBottom: shcSpacing.sm, marginTop: shcSpacing.sm };
const hint = { fontSize: 11, color: shcColors.textLight, marginBottom: shcSpacing.sm, fontWeight: '600' };
const inputStyle = {
  borderWidth: shcBorders.brutal,
  borderColor: shcColors.border,
  borderRadius: shcRadii.md,
  padding: shcSpacing.md,
  backgroundColor: shcColors.surface,
  fontSize: 15,
  color: shcColors.text,
  marginBottom: shcSpacing.sm,
  ...shcShadows.brutalSm,
};
const backBtn = {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: shcBorders.brutal,
  borderColor: shcColors.border,
  backgroundColor: shcColors.surface,
  alignItems: 'center',
  justifyContent: 'center',
  ...shcShadows.brutalSm,
};
function chip(active: boolean) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: shcRadii.pill,
    borderWidth: shcBorders.brutal,
    borderColor: active ? gourmeatColors.primary : shcColors.border,
    backgroundColor: active ? gourmeatColors.primary : shcColors.surface,
    ...shcShadows.brutalSm,
  };
}
function chipText(active: boolean) {
  return { fontSize: 13, fontWeight: '800', color: active ? '#fff' : shcColors.text };
}