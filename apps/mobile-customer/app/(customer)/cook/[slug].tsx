import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  SHCCookStoreHero,
  SHCZomatoDishRowRail,
  SHCDishCard,
  SHCSectionTitle,
  SHCFoodImage,
  type SHCDishCardData,
  gourmeatColors,
  shcColors,
  shcRadii,
  shcSpacing,
} from '@shc/ui';
import { getDishImageUrl, getCookAvatarUrl, BENTO_ACTION_IMAGES } from '@shc/utils';
import { useShcI18n, getCookProfileCopy } from '@shc/i18n';
import { useCook, useDiscovery } from '../../../hooks/useProducts';
import { getHeritageArchive } from '../../../lib/api-client';

export default function CookProfile() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { locale } = useShcI18n();
  const copy = getCookProfileCopy(locale);
  const { data: cook } = useCook(slug || '');
  const { data: allProducts = [] } = useDiscovery('', {});
  const router = useRouter();
  const [archive, setArchive] = useState<any[]>([]);

  const listings = allProducts.filter((p: any) => p.cook_id === cook?.id || p.cook_id?.includes(slug || ''));

  useEffect(() => {
    if (cook?.id) {
      getHeritageArchive(cook.id).then(setArchive).catch(() => setArchive([]));
    }
  }, [cook?.id]);

  if (!cook) {
    return (
      <View style={styles.loading}>
        <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={80} rounded={shcRadii.lg} />
        <Text style={styles.loadingText}>{copy.loading}</Text>
      </View>
    );
  }

  const toDish = (l: any): SHCDishCardData => ({
    id: l.id,
    name: l.name,
    cook_name: cook.display_name,
    price: l.price,
    cuisine: l.cuisine,
    rating: cook.rating,
    image_url: getDishImageUrl({ id: l.id, cuisine: l.cuisine, name: l.name }),
  });

  const dishRows = listings.map(toDish);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 80 }]}
    >
      <SHCCookStoreHero
        name={cook.display_name}
        area={cook.area}
        rating={cook.rating}
        orders={cook.orders}
        avatarUri={getCookAvatarUrl(cook.id, cook.display_name)}
      />

      {dishRows.length > 0 && (
        <SHCZomatoDishRowRail
          title={copy.menuHighlights}
          dishes={dishRows}
          onDishPress={(id) => router.push(`/(customer)/product/${id}` as any)}
        />
      )}

      <SHCSectionTitle>{copy.allListings}</SHCSectionTitle>
      {listings.length === 0 && (
        <SHCCard variant="bento-yellow" style={styles.emptyCard}>
          <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={72} rounded={shcRadii.md} />
          <Text style={styles.emptyText}>{copy.noListings}</Text>
        </SHCCard>
      )}
      <View style={styles.grid}>
        {listings.map((l: any) => (
          <View key={l.id} style={styles.gridItem}>
            <SHCDishCard dish={toDish(l)} compact onPress={() => router.push(`/(customer)/product/${l.id}` as any)} />
          </View>
        ))}
      </View>

      {archive.length > 0 && (
        <>
          <SHCSectionTitle>{copy.heritageTitle}</SHCSectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.archiveRail}>
            {archive.map((a: any, i: number) => (
              <SHCCard key={i} variant="bento-peach" style={styles.archiveCard}>
                <Text style={styles.archiveIcon}>📜</Text>
                <Text style={styles.archiveTitle} numberOfLines={2}>{a.title}</Text>
                <Text style={styles.archiveStory} numberOfLines={3}>{a.story}</Text>
              </SHCCard>
            ))}
          </ScrollView>
        </>
      )}

      <SHCButton onPress={() => router.push('/(customer)/cart' as any)} style={styles.cartBtn}>
        <SHCButtonText>{copy.viewCart}</SHCButtonText>
      </SHCButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: shcSpacing.xl },
  loadingText: { marginTop: shcSpacing.sm, fontWeight: '600', color: gourmeatColors.textMuted },
  emptyCard: { alignItems: 'center', padding: shcSpacing.lg },
  emptyText: { fontWeight: '700', color: gourmeatColors.textMuted, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: shcSpacing.sm },
  gridItem: { width: '48%' },
  archiveRail: { gap: shcSpacing.sm, paddingBottom: shcSpacing.sm },
  archiveCard: { width: 200, minHeight: 120 },
  archiveIcon: { fontSize: 24 },
  archiveTitle: { fontWeight: '800', color: shcColors.heritage, marginTop: 4 },
  archiveStory: { fontSize: 11, color: gourmeatColors.textMuted, marginTop: 4 },
  cartBtn: { marginTop: shcSpacing.lg },
});
