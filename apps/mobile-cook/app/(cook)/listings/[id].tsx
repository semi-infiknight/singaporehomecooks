import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { gourmeatColors, SHCSkeletonList } from '@shc/ui';
import { useCookListings } from '../../../hooks/useProducts';
import { CookListingWizardScreen } from '../../../components/CookListingWizardScreen';

export default function EditListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listings, isLoading } = useCookListings();
  const listing = (listings as any[] | undefined)?.find((l) => String(l.id) === String(id));

  useEffect(() => {
    if (!isLoading && !listing && id) {
      router.back();
    }
  }, [isLoading, listing, id, router]);

  if (isLoading || !listing) {
    return (
      <View style={{ flex: 1, backgroundColor: gourmeatColors.background, paddingTop: 48 }}>
        <SHCSkeletonList count={3} rowHeight={80} />
      </View>
    );
  }

  return (
    <CookListingWizardScreen
      editingId={String(id)}
      initialListing={listing}
      onExit={() => router.back()}
    />
  );
}
