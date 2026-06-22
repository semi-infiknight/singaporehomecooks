// Zomato/Swiggy layout primitives — location bar, promo rail, filter row, horizontal dish rows.
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { shcColors, shcRadii, shcSpacing, shcBorders, shcShadows, shcTypography } from './theme';
import { SHCSearchBar } from './primitives';
import { SHCFoodImage, SHCZomatoRatingPill } from './visuals';
import { SHCIcon, SHCBentoIconBadge, type SHCIconKey } from './icons';
import { SHCStaggerIn } from './motion';
import { getDishImageUrl, getCollectionSlotLabel } from '@shc/utils';
import type { SHCDishCardData } from './domain';

export { SHCZomatoRatingPill, SHCZomatoAddButton } from './visuals';

export function SHCZomatoSectionHeader({
  title,
  actionLabel,
  onActionPress,
  testID,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: shcSpacing.xs,
        marginTop: shcSpacing.sm,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '900', color: shcColors.text, letterSpacing: -0.3 }}>{title}</Text>
      {actionLabel && onActionPress && (
        <Pressable onPress={onActionPress}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: shcColors.primary }}>{actionLabel} →</Text>
        </Pressable>
      )}
    </View>
  );
}

export function SHCZomatoLocationBar({
  areaLabel = 'Katong, SG',
  areaHint = 'COLLECT FROM',
  avatarUri,
  onLocationPress,
  onProfilePress,
  testID = 'zomato-location-bar',
}: {
  areaLabel?: string;
  areaHint?: string;
  avatarUri?: string;
  onLocationPress?: () => void;
  onProfilePress?: () => void;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: shcSpacing.sm,
      }}
    >
      <Pressable
        onPress={onLocationPress}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        testID="sticky-header-location"
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: shcColors.textLight,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {areaHint}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <SHCIcon name="location" size={16} color={shcColors.primary} active />
            <View style={{ width: 4 }} />
            <Text style={{ ...shcTypography.h3, color: shcColors.text, flexShrink: 1 }} numberOfLines={1}>
              {areaLabel}
            </Text>
            <Text style={{ fontSize: 12, color: shcColors.textLight, marginLeft: 4 }}>▼</Text>
          </View>
        </View>
      </Pressable>
      {onProfilePress && (
        <Pressable onPress={onProfilePress} testID="zomato-profile-avatar">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: shcBorders.brutal,
              borderColor: shcColors.border,
              backgroundColor: shcColors.primary,
              ...shcShadows.brutalSm,
            }}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <SHCIcon name="profile" size={20} color={shcColors.onPrimary} active />
              </View>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}

export function SHCZomatoStickyHeader({
  areaLabel,
  areaHint = 'COLLECT FROM',
  avatarUri,
  onLocationPress,
  onProfilePress,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search for dishes, cooks…',
  searchTestID = 'search-input',
  testID = 'sticky-header',
  elevated = false,
}: {
  areaLabel: string;
  areaHint?: string;
  avatarUri?: string;
  onLocationPress?: () => void;
  onProfilePress?: () => void;
  searchValue: string;
  onSearchChange: (t: string) => void;
  searchPlaceholder?: string;
  searchTestID?: string;
  testID?: string;
  elevated?: boolean;
}) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: shcColors.background,
        paddingHorizontal: shcSpacing.md,
        paddingTop: shcSpacing.stickyHeaderPadding,
        paddingBottom: shcSpacing.sm,
        borderBottomWidth: elevated ? shcBorders.brutal : 0,
        borderBottomColor: shcColors.border,
        ...(elevated ? shcShadows.brutalSm : {}),
      }}
    >
      <SHCZomatoLocationBar
        areaLabel={areaLabel}
        areaHint={areaHint}
        avatarUri={avatarUri}
        onLocationPress={onLocationPress}
        onProfilePress={onProfilePress}
      />
      <SHCSearchBar
        value={searchValue}
        onChangeText={onSearchChange}
        placeholder={searchPlaceholder}
        testID={searchTestID}
      />
    </View>
  );
}

export type SHCPromoItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  badge?: string;
  iconKey?: SHCIconKey;
};

export function SHCPromoRail({
  promos,
  onPromoPress,
  testID = 'promo-rail',
}: {
  promos: SHCPromoItem[];
  onPromoPress?: (id: string) => void;
  testID?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={{ gap: shcSpacing.sm, paddingVertical: shcSpacing.sm }}
    >
      {promos.map((promo, i) => (
        <SHCStaggerIn key={promo.id} index={i}>
        <Pressable
          onPress={() => onPromoPress?.(promo.id)}
          testID={`promo-card-${promo.id}`}
          style={{
            width: 260,
            height: 100,
            borderRadius: shcRadii.lg,
            overflow: 'hidden',
            borderWidth: shcBorders.brutal,
            borderColor: shcColors.border,
            ...shcShadows.brutalSm,
          }}
        >
          <Image source={{ uri: promo.imageUrl }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
          <View
            style={{
              flex: 1,
              padding: shcSpacing.sm,
              justifyContent: 'space-between',
              backgroundColor: 'rgba(36,24,18,0.45)',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {promo.iconKey ? <SHCBentoIconBadge iconKey={promo.iconKey} size={28} /> : <View />}
              {promo.badge && (
                <View
                  style={{
                    backgroundColor: shcColors.accent,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: shcRadii.sm,
                    borderWidth: 1,
                    borderColor: shcColors.border,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '900', color: shcColors.text }}>{promo.badge}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={{ color: shcColors.onPrimary, fontWeight: '900', fontSize: 15 }} numberOfLines={1}>
                {promo.title}
              </Text>
              {promo.subtitle && (
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
                  {promo.subtitle}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
        </SHCStaggerIn>
      ))}
    </ScrollView>
  );
}

export function SHCMindSectionTitle({
  children = "What's on your mind?",
  testID = 'mind-section-title',
}: {
  children?: string;
  testID?: string;
}) {
  return (
    <Text
      testID={testID}
      style={{
        fontSize: 16,
        fontWeight: '900',
        color: shcColors.text,
        marginTop: shcSpacing.sm,
        marginBottom: 2,
        letterSpacing: -0.3,
      }}
    >
      {children}
    </Text>
  );
}

export type SHCFilterChip = {
  id: string;
  label: string;
  icon?: string;
  iconKey?: SHCIconKey;
  imageUrl?: string;
  active?: boolean;
  testID?: string;
};

export function SHCFilterChipRow({
  chips,
  onChipPress,
  testID = 'filter-chip-row',
}: {
  chips: SHCFilterChip[];
  onChipPress: (id: string) => void;
  testID?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={{ gap: shcSpacing.sm, paddingVertical: shcSpacing.sm }}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.id}
          onPress={() => onChipPress(chip.id)}
          testID={chip.testID ?? `filter-chip-${chip.id}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: shcRadii.pill,
            borderWidth: shcBorders.brutal,
            borderColor: chip.active ? shcColors.primary : shcColors.border,
            backgroundColor: chip.active ? shcColors.bentoPeach : shcColors.surface,
            ...shcShadows.brutalSm,
          }}
        >
          {chip.imageUrl ? (
            <Image
              source={{ uri: chip.imageUrl }}
              style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: shcColors.border }}
            />
          ) : chip.iconKey ? (
            <SHCIcon name={chip.iconKey} size={14} color={chip.active ? shcColors.primary : shcColors.text} active={chip.active} />
          ) : chip.icon ? (
            <Text style={{ fontSize: 14 }}>{chip.icon}</Text>
          ) : null}
          <Text style={{ fontSize: 12, fontWeight: chip.active ? '800' : '600', color: chip.active ? shcColors.primary : shcColors.text }}>
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** Zomato horizontal restaurant/dish row card */
export function SHCZomatoDishRow({
  dish,
  onPress,
  offerLabel,
  offerText,
  testID,
}: {
  dish: SHCDishCardData;
  onPress?: () => void;
  offerLabel?: string;
  offerText?: string;
  testID?: string;
}) {
  const cardTestID = testID ?? `dish-row-${dish.id}`;
  const imageUri = dish.image_url || getDishImageUrl({ id: dish.id, cuisine: dish.cuisine, name: dish.name });
  const slot = dish.collection_slot || getCollectionSlotLabel(dish.id);
  const rating = dish.rating ?? 4.8;

  return (
    <Pressable
      onPress={onPress}
      testID={cardTestID}
      style={{
        width: 300,
        backgroundColor: shcColors.surface,
        borderRadius: shcRadii.lg,
        overflow: 'hidden',
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        ...shcShadows.brutalSm,
        marginRight: shcSpacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 110, height: 118 }}>
          <SHCFoodImage uri={imageUri} height={118} width={110} rounded={0} testID={`${cardTestID}-image`} />
          {offerLabel && (
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                backgroundColor: shcColors.accent,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: shcRadii.sm,
                borderWidth: 1,
                borderColor: shcColors.border,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '900', color: shcColors.text }}>{offerLabel}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, padding: shcSpacing.sm, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontWeight: '800', fontSize: 14, color: shcColors.text }} numberOfLines={2} testID={`${cardTestID}-name`}>
              {dish.name}
            </Text>
            <Text style={{ fontSize: 11, color: shcColors.textLight, marginTop: 2 }} numberOfLines={1} testID={`${cardTestID}-cook`}>
              {dish.cuisine || 'Heritage'} · {dish.cook_name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
            <SHCZomatoRatingPill rating={rating} reviewCount={42} testID={`${cardTestID}-rating`} />
            <Text style={{ ...shcTypography.mono, fontSize: 13, fontWeight: '800', color: shcColors.text }} testID={`${cardTestID}-price`}>
              S${dish.price}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
            <SHCIcon name="clock" size={12} color={shcColors.textLight} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: shcColors.textLight }}>{slot}</Text>
            {dish.area && (
              <>
                <Text style={{ fontSize: 10, color: shcColors.textLight }}>·</Text>
                <SHCIcon name="location" size={11} color={shcColors.textLight} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: shcColors.textLight }}>{dish.area}</Text>
              </>
            )}
          </View>
        </View>
      </View>
      {(offerText || offerLabel) && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: shcColors.border,
            backgroundColor: shcColors.bentoYellow,
            paddingHorizontal: shcSpacing.sm,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: shcColors.primary }} numberOfLines={1}>
            {offerText || `Heritage offer · ${offerLabel}`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function SHCZomatoDishRowRail({
  title = 'Top picks for you',
  dishes,
  onDishPress,
  testID = 'dish-row-rail',
}: {
  title?: string;
  dishes: SHCDishCardData[];
  onDishPress?: (id: string) => void;
  testID?: string;
}) {
  if (dishes.length === 0) return null;
  return (
    <View testID={testID}>
      {title ? (
        <Text style={{ fontSize: 16, fontWeight: '900', color: shcColors.text, marginBottom: shcSpacing.xs }}>{title}</Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: shcSpacing.md }}>
        {dishes.map((dish, i) => (
          <SHCZomatoDishRow
            key={dish.id}
            dish={dish}
            onPress={() => onDishPress?.(dish.id)}
            offerLabel={i === 0 ? 'POPULAR' : i === 1 ? '20% OFF' : undefined}
            offerText={i === 0 ? '★ Top rated home cook this week' : i === 1 ? '20% off on orders above S$80' : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}