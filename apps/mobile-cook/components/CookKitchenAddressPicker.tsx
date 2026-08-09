import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LocationPickerExperience } from '@shc/ui/location-ux';
import { shcColors, shcSpacing, SHCCard } from '@shc/ui';
import { useSingaporeAddressPicker } from '../lib/use-singapore-address-picker';

type Props = {
  kitchenAddress: string;
  collectionInstructions: string;
  /** Neighbourhood already chosen in onboarding — shown as hint, not re-picked. */
  areaHint?: string;
  onConfirm: (patch: { kitchen_address: string; collection_instructions?: string }) => void;
  testID?: string;
};

/** Swiggy-style SG address search + map pin — cook kitchen collection point. */
export function CookKitchenAddressPicker({
  kitchenAddress,
  collectionInstructions,
  areaHint,
  onConfirm,
  testID = 'cook-kitchen-address-picker',
}: Props) {
  const picker = useSingaporeAddressPicker();
  const [showPicker, setShowPicker] = React.useState(() => !kitchenAddress.trim());

  React.useEffect(() => {
    if (!kitchenAddress.trim()) setShowPicker(true);
  }, [kitchenAddress]);

  const showSummary = !showPicker && kitchenAddress.trim().length >= 8;

  if (showSummary) {
    return (
      <View testID={testID}>
        <SHCCard variant="bento-peach" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Kitchen address</Text>
          <Text style={styles.summaryText}>{kitchenAddress}</Text>
          {collectionInstructions ? (
            <Text style={styles.summaryHint}>{collectionInstructions}</Text>
          ) : null}
        </SHCCard>
        <Pressable
          onPress={() => {
            setShowPicker(true);
            picker.setStep(1);
          }}
          testID="cook-kitchen-address-change"
        >
          <Text style={styles.changeLink}>Change address on map</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View testID={testID} style={styles.pickerWrap}>
      <LocationPickerExperience
        embedded
        uiVariant="swiggy"
        showSavedAddresses={false}
        showQuickPick={false}
        areaHint={areaHint}
        confirmLabel="Confirm & proceed"
        step={picker.step}
        onStepChange={picker.setStep}
        query={picker.query}
        onQueryChange={picker.setQuery}
        results={picker.results}
        searching={picker.searching}
        onSearch={picker.runSearch}
        saved={[]}
        onSelectSaved={() => undefined}
        onUseCurrentLocation={picker.onUseGps}
        locating={picker.locating}
        draft={picker.draft}
        onDraftChange={picker.onDraftChange}
        onSelectResult={picker.onSelectResult}
        onConfirm={() => {
          const next = picker.buildConfirmedAddress();
          if (!next) return;
          onConfirm({
            kitchen_address: next.kitchen_address,
            collection_instructions: next.collection_instructions ?? collectionInstructions,
          });
          picker.resetPicker();
          setShowPicker(false);
        }}
        busy={picker.busy}
        onNudgePin={picker.onPinMove}
        onPinDrag={picker.onPinDrag}
        searchNotice={picker.searchNotice}
        testID={`${testID}-flow`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pickerWrap: { minHeight: 520, marginBottom: shcSpacing.sm },
  summaryCard: { marginBottom: shcSpacing.sm },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: shcColors.textLight, marginBottom: 4 },
  summaryText: { fontSize: 15, fontWeight: '800', color: shcColors.text, lineHeight: 22 },
  summaryHint: { fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 6 },
  changeLink: {
    fontSize: 14,
    fontWeight: '800',
    color: shcColors.primary,
    marginTop: shcSpacing.xs,
    marginBottom: shcSpacing.md,
  },
  previewCard: { marginTop: shcSpacing.sm },
  previewLabel: { fontSize: 11, fontWeight: '800', color: shcColors.textLight, marginBottom: 4 },
  previewText: { fontSize: 13, fontWeight: '700', color: shcColors.text },
});
