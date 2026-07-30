import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  SHCCard,
  SHCMetaBadge,
  GourmeatCookHeader,
  GourmeatSearchBar,
  SHCFilterChipRow,
  SHCFoodImage,
  SHCIcon,
  gourmeatColors,
  shcColors,
  shcSpacing,
  shcRadii,
  shcBorders,
  shcShadows,
  DirectionalTabScreen,
  contentPadForTabBar,
  SHCSkeletonList,
  useSHCTray,
  SHCTrayAction,
} from '@shc/ui';
import {
  CUISINE_IMAGE,
  filterCookListings,
  getDishImageUrl,
  uniqueListingCuisines,
  resolveCookListingsForDisplay,
  cookListingE2eTestId,
  E2E_COOK_SEED_LISTING,
  type CookListingStatusFilter,
  shcPortionMinBadgeLabel,
} from '@shc/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useCookListings } from '../../../hooks/useProducts';
import { deleteCookListing, updateCookListing } from '../../../lib/api-client';
import { useAuth } from '../../../hooks/useAuth';
import { VirtualRowFlashList } from '../../../components/VirtualLists';

export default function CookListingsIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: myListings, isLoading: listingsLoading } = useCookListings();
  const listingList = (myListings as any[]) ?? [];
  const { openTray, pushTrayContent, popTray, dismiss } = useSHCTray();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CookListingStatusFilter>('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');

  const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
  const listingsForDisplay = useMemo(
    () => resolveCookListingsForDisplay(listingList as Array<Record<string, unknown>>, { dev: __DEV__, maestroE2e }) as typeof listingList,
    [listingList, maestroE2e]
  );

  const filteredListings = useMemo(
    () => filterCookListings(listingsForDisplay, { q: searchQuery, status: statusFilter, cuisine: cuisineFilter }),
    [listingsForDisplay, searchQuery, statusFilter, cuisineFilter]
  );

  const filterChips = useMemo(() => {
    const chips = [
      { id: 'status:all', label: 'All', active: statusFilter === 'all' && cuisineFilter === 'all' },
      { id: 'status:live', label: 'Live', active: statusFilter === 'live' },
      { id: 'status:paused', label: 'Paused', active: statusFilter === 'paused' },
      ...uniqueListingCuisines(listingList).map((cuisine) => ({
        id: `cuisine:${cuisine}`,
        label: cuisine,
        active: cuisineFilter === cuisine,
      })),
    ];
    return chips;
  }, [listingList, statusFilter, cuisineFilter]);

  const handleFilterChip = (chipId: string) => {
    if (chipId === 'status:all') {
      setStatusFilter('all');
      setCuisineFilter('all');
      return;
    }
    if (chipId.startsWith('status:')) {
      setStatusFilter(chipId.replace('status:', '') as CookListingStatusFilter);
      return;
    }
    if (chipId.startsWith('cuisine:')) {
      const cuisine = chipId.replace('cuisine:', '');
      setCuisineFilter((prev) => (prev === cuisine ? 'all' : cuisine));
    }
  };

  const showErrorTray = useCallback(
    (title: string, message: string) => {
      openTray(
        { id: 'listing-error', title, height: 'compact' },
        <SHCTrayAction message={message} primaryLabel="OK" onPrimary={dismiss} testID="listing-error-tray" />
      );
    },
    [dismiss, openTray]
  );

  const performDelete = async (listing: any) => {
    if (listing.id === E2E_COOK_SEED_LISTING.id) return;
    try {
      await deleteCookListing(listing.id);
      await qc.invalidateQueries({ queryKey: ['cook-listings'] });
    } catch (e: any) {
      showErrorTray('Delete failed', e?.message || 'Could not delete listing.');
    }
  };

  const togglePause = async (listing: any) => {
    const paused = !listing.shc_availability?.paused;
    try {
      await updateCookListing(listing.id, { paused });
      await qc.invalidateQueries({ queryKey: ['cook-listings'] });
    } catch (e: any) {
      showErrorTray(paused ? 'Pause failed' : 'Unpause failed', e?.message || 'Could not update listing.');
    }
  };

  const pushDeleteConfirm = (listing: any) => {
    pushTrayContent(
      { id: 'listing-delete-confirm', title: 'Delete listing?', height: 'medium' },
      <SHCTrayAction
        message={`Remove "${listing.name}" from your menu? This cannot be undone.`}
        primaryLabel="Delete"
        onPrimary={() => {
          dismiss();
          void performDelete(listing);
        }}
        secondaryLabel="Cancel"
        onSecondary={popTray}
        destructive
        testID="listing-delete-confirm-tray"
      />
    );
  };

  const showListingActions = (listing: any) => {
    const isPaused = !!listing.shc_availability?.paused;
    openTray(
      { id: 'listing-actions', title: String(listing.name), height: 'medium' },
      <View style={styles.trayActions} testID="listing-actions-tray">
        <Pressable
          style={styles.trayActionBtn}
          onPress={() => {
            dismiss();
            router.push(`/(cook)/listings/${listing.id}` as any);
          }}
          testID={`edit-listing-${listing.id}`}
        >
          <Text style={styles.trayActionText}>Edit listing</Text>
        </Pressable>
        <Pressable
          style={styles.trayActionBtn}
          onPress={() => {
            dismiss();
            void togglePause(listing);
          }}
          testID={`pause-listing-${listing.id}`}
        >
          <Text style={styles.trayActionText}>{isPaused ? 'Unpause listing' : 'Pause listing'}</Text>
        </Pressable>
        <Pressable
          style={[styles.trayActionBtn, styles.trayActionDestructive]}
          onPress={() => pushDeleteConfirm(listing)}
          testID={`delete-listing-${listing.id}`}
        >
          <Text style={styles.trayActionDestructiveText}>Delete listing</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <DirectionalTabScreen testID="cook-listings-tab-scene">
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) },
        ]}
        testID="cook-listings-screen"
      >
        <GourmeatCookHeader
          title="My Listings"
          subtitle={
            listingsForDisplay.length
              ? `${filteredListings.length} of ${listingsForDisplay.length} dishes`
              : user?.name
          }
          testID="listings-hero"
          action={
            <Pressable
              onPress={() => router.push('/(cook)/listings/new' as any)}
              style={styles.addBtn}
              testID="create-listings-btn"
              accessibilityRole="button"
              accessibilityLabel="Add new listing"
            >
              <SHCIcon name="add" size={26} color={gourmeatColors.primary} active />
            </Pressable>
          }
        />

        <View style={styles.searchWrap}>
          <GourmeatSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your dishes…"
            testID="cook-listings-search"
          />
        </View>

        {listingsLoading && listingList.length === 0 ? (
          <SHCSkeletonList count={4} rowHeight={80} />
        ) : null}

        {listingsForDisplay.length > 0 ? (
          <>
            <SHCFilterChipRow
              chips={filterChips}
              onChipPress={handleFilterChip}
              testID="cook-listings-filter-chips"
            />
            <Text style={styles.holdHint}>Press and hold a dish for edit, pause, or delete</Text>
          </>
        ) : null}

        {!listingsLoading && listingsForDisplay.length === 0 && (
          <SHCCard variant="bento-mint" style={styles.emptyListings}>
            <SHCFoodImage uri={CUISINE_IMAGE.Peranakan} height={80} rounded={shcRadii.md} />
            <SHCMetaBadge kind="label">No listings yet</SHCMetaBadge>
            <Text style={styles.emptyHint}>Tap + to add your first dish</Text>
          </SHCCard>
        )}
        {listingsForDisplay.length > 0 && filteredListings.length === 0 && (
          <SHCCard variant="bento-mint" style={styles.emptyListings}>
            <SHCMetaBadge kind="label">No dishes match your search</SHCMetaBadge>
          </SHCCard>
        )}
        {filteredListings.length > 0 ? (
          <VirtualRowFlashList
            data={filteredListings}
            scrollEnabled={false}
            testID="cook-listings-virtual-list"
            keyExtractor={(p: any) => String(p.id)}
            renderItem={(p: any, index: number) => (
              <Pressable
                onLongPress={() => showListingActions(p)}
                delayLongPress={400}
                testID={cookListingE2eTestId(p, index)}
                accessibilityRole="button"
                accessibilityLabel={`${p.name}, long press for options`}
              >
                <SHCCard style={styles.listingCard}>
                  <View style={styles.listingRow}>
                    <SHCFoodImage
                      uri={getDishImageUrl({ name: p.name, cuisine: p.cuisine, image_url: p.image_url })}
                      width={64}
                      height={64}
                      rounded={shcRadii.md}
                    />
                    <View style={styles.listingInfo}>
                      <Text style={styles.listingName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <View style={styles.listingBadges}>
                        <SHCMetaBadge kind="price">S${p.price}</SHCMetaBadge>
                        <SHCMetaBadge kind="portion_min">{shcPortionMinBadgeLabel(p.min_qty)}</SHCMetaBadge>
                        {p.shc_availability?.paused ? <SHCMetaBadge kind="paused">Paused</SHCMetaBadge> : null}
                      </View>
                    </View>
                  </View>
                </SHCCard>
              </Pressable>
            )}
          />
        ) : null}
      </ScrollView>
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shcShadows.brutalSm,
  },
  searchWrap: { marginHorizontal: -shcSpacing.md },
  emptyListings: { alignItems: 'center', gap: shcSpacing.sm, paddingVertical: shcSpacing.md },
  emptyHint: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight },
  listingCard: { marginBottom: shcSpacing.sm },
  listingRow: { flexDirection: 'row', gap: shcSpacing.sm, alignItems: 'center' },
  listingInfo: { flex: 1, gap: 4 },
  listingName: { fontWeight: '700', fontSize: 15 },
  listingBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  holdHint: { fontSize: 12, color: gourmeatColors.textLight, marginBottom: shcSpacing.sm },
  trayActions: { gap: shcSpacing.sm },
  trayActionBtn: {
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.md,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.surface,
    ...shcShadows.brutalSm,
  },
  trayActionText: { fontWeight: '800', fontSize: 15, color: gourmeatColors.text, textAlign: 'center' },
  trayActionDestructive: { backgroundColor: '#FEE2E2' },
  trayActionDestructiveText: { fontWeight: '800', fontSize: 15, color: '#B91C1C', textAlign: 'center' },
});
