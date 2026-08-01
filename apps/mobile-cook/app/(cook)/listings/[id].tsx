import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { gourmeatColors, SHCSkeletonList, SHCButton, SHCButtonText, shcSpacing, shcRadii } from '@shc/ui';
import { normalizeRouteParam, resolveCookListingById } from '@shc/utils';
import { useCookListings } from '../../../hooks/useProducts';
import { CookListingWizardScreen } from '../../../components/CookListingWizardScreen';

export default function EditListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const listingId = normalizeRouteParam(params.id);
  const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
  const { data: listings, isLoading, isFetching, isError, refetch } = useCookListings();
  const listing = resolveCookListingById(listings as any[] | undefined, listingId, {
    dev: __DEV__,
    maestroE2e,
  });
  const waitingForData = (isLoading || isFetching) && !listing;

  if (!listingId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Listing not found</Text>
        <SHCButton onPress={() => router.back()} testID="listing-edit-back">
          <SHCButtonText>Back to listings</SHCButtonText>
        </SHCButton>
      </View>
    );
  }

  if (waitingForData) {
    return (
      <View style={{ flex: 1, backgroundColor: gourmeatColors.background, paddingTop: 48 }}>
        <SHCSkeletonList count={3} rowHeight={80} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load this listing</Text>
        <Text style={styles.errorHint}>
          {isError ? 'Check your connection and try again.' : 'It may have been removed.'}
        </Text>
        <View style={styles.errorActions}>
          <SHCButton onPress={() => void refetch()} testID="listing-edit-retry">
            <SHCButtonText>Retry</SHCButtonText>
          </SHCButton>
          <Pressable onPress={() => router.back()} testID="listing-edit-back">
            <Text style={styles.linkBack}>Back to listings</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <CookListingWizardScreen
      editingId={listingId}
      initialListing={listing}
      onExit={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: gourmeatColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: shcSpacing.lg,
    gap: shcSpacing.md,
  },
  errorTitle: { fontSize: 18, fontWeight: '800', color: gourmeatColors.text, textAlign: 'center' },
  errorHint: { fontSize: 14, fontWeight: '600', color: gourmeatColors.textLight, textAlign: 'center' },
  errorActions: { alignItems: 'center', gap: shcSpacing.sm, marginTop: shcSpacing.sm },
  linkBack: { fontSize: 14, fontWeight: '700', color: gourmeatColors.primary, padding: shcSpacing.sm },
});
