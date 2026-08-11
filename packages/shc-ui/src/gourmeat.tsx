// Gourmeat food-app UI (Orbix Studio / Behance) — customer discover, cart, checkout.
// @ts-nocheck
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  PanResponder,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from 'react-native';
import { gourmeatColors, gourmeatLayout, gourmeatRadii, gourmeatShadows, gourmeatTypography, shcSpacing, shcIconSizes, shcSectionStack, shcTitleBlock, shcHeaderGap, contentPadForTabBar, contentPadForStickyFooter, contentPadSafe } from './theme';

export { gourmeatLayout, contentPadForTabBar, contentPadForStickyFooter, contentPadSafe };
import { SHCIcon, type SHCTabIconKey } from './icons';
import { SHCOrdersTabCookingIcon } from './orders-tab-cue';
import { SHCFoodImage } from './visuals';
import { SHCSharedDishImage, SharedDishNavSurface } from './family-values-ui';
import { SHCFavoriteButton } from './delivery-ux';
import {
  getDishImageUrl,
  DISCOVER_MAX_CAL_PRESETS,
  DISCOVER_MAX_CAL_SLIDER,
  maxCalFilterLabel,
  snapMaxCalSliderValue,
  toggleMaxCalPreset,
} from '@shc/utils';
import type { SHCDishCardData } from './domain';
import type { SHCBottomTab } from './primitives';
import { EmptyIllustration } from './empty-illustrations';

/** @deprecated Fake hash discount — honest browse shows badge only when API sends percent. */
// export function gourmeatDiscountPercent(id: string): number {
//   let hash = 0;
//   for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 100;
//   return 10 + (hash % 16);
// }

export type GourmeatCategoryItem = {
  id: string;
  label: string;
  iconKey: 'restaurant' | 'leaf' | 'people' | 'flame' | 'home' | 'filters';
  imageUrl?: string;
};

/**
 * Discover top chrome — compact Swiggy-style row: location (left) + profile (right).
 * No large marketing headline so more dish content fits above the fold.
 */
export function GourmeatHomeHeader({
  headline: _headline,
  subtitle: _subtitle,
  locationLabel = 'Katong, Singapore',
  locationHint = 'Collect from',
  avatarUri,
  onLocationPress,
  onProfilePress,
  onNotificationPress,
  showLoginTag = false,
  edgeInset = true,
  testID = 'gourmeat-home-header',
}: {
  /** @deprecated Removed from discover chrome to save vertical space. Kept for API compat. */
  headline?: string;
  /** @deprecated Removed from discover chrome. Kept for API compat. */
  subtitle?: string;
  locationLabel?: string;
  locationHint?: string;
  avatarUri?: string;
  onLocationPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  /** Small “Login” chip on the avatar when the customer is a guest. */
  showLoginTag?: boolean;
  /** When false, parent already applies horizontal padding (e.g. FlashList content). */
  edgeInset?: boolean;
  testID?: string;
}) {
  void _headline;
  void _subtitle;

  return (
    <View
      testID={testID}
      style={{
        paddingHorizontal: edgeInset ? shcSpacing.md : 0,
        paddingBottom: shcSpacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: shcSpacing.sm,
        }}
      >
        <Pressable
          onPress={onLocationPress}
          style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}
          testID="gourmeat-location-chip"
          accessibilityRole="button"
          accessibilityLabel={`${locationHint}, ${locationLabel}`}
        >
          <View style={{ marginTop: 2 }}>
            <SHCIcon name="location" size={shcIconSizes.md} color={gourmeatColors.primary} active />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '900',
                  color: gourmeatColors.text,
                  letterSpacing: -0.2,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {locationLabel}
              </Text>
              <Text style={{ fontSize: 10, color: gourmeatColors.textMuted, fontWeight: '700' }}>▼</Text>
            </View>
            {locationHint ? (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: gourmeatColors.textLight,
                  marginTop: 1,
                }}
                numberOfLines={1}
                testID="gourmeat-location-hint"
              >
                {locationHint}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, flexShrink: 0 }}>
          {onNotificationPress ? (
            <Pressable
              onPress={onNotificationPress}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: gourmeatColors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                ...gourmeatShadows.soft,
              }}
              testID="gourmeat-notifications"
            >
              <SHCIcon name="notifications" size={20} color={gourmeatColors.text} />
            </Pressable>
          ) : null}
          {onProfilePress ? (
            <Pressable
              onPress={onProfilePress}
              testID="gourmeat-profile-avatar"
              accessibilityLabel={showLoginTag ? 'Log in' : 'Profile'}
            >
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: gourmeatColors.primaryLight,
                    ...gourmeatShadows.soft,
                  }}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <SHCIcon name="profile" size={20} color={gourmeatColors.primary} active />
                    </View>
                  )}
                </View>
                {showLoginTag ? (
                  <View
                    testID="gourmeat-login-tag"
                    style={{
                      marginTop: -8,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: gourmeatColors.primary,
                      borderWidth: 1.5,
                      borderColor: gourmeatColors.background || '#FAFAFA',
                      zIndex: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '900',
                        color: '#FFFFFF',
                        letterSpacing: 0.3,
                        textTransform: 'uppercase',
                      }}
                    >
                      Login
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function GourmeatSearchBar({
  value,
  onChangeText,
  placeholder = 'Search dishes, cooks…',
  onFilterPress,
  filterCount = 0,
  marginBottom = shcSpacing.md,
  edgeInset = true,
  testID = 'search-input',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  /** Number of active filters — shown as a badge so the state is visible without scrolling. */
  filterCount?: number;
  marginBottom?: number;
  /** When false, parent already applies horizontal padding (e.g. FlashList content). */
  edgeInset?: boolean;
  testID?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: edgeInset ? shcSpacing.md : 0,
        marginBottom,
        gap: shcSpacing.sm,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: gourmeatColors.surface,
          borderRadius: gourmeatRadii.pill,
          paddingHorizontal: shcSpacing.md,
          paddingVertical: 12,
          ...gourmeatShadows.soft,
        }}
      >
        <SHCIcon name="search" size={shcIconSizes.md} color={gourmeatColors.textMuted} />
        <View style={{ width: shcSpacing.sm }} />
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          testID={testID}
          style={{ flex: 1, ...gourmeatTypography.search, color: gourmeatColors.text }}
          placeholderTextColor={gourmeatColors.textMuted}
        />
      </View>
      {onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          accessibilityLabel={filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters'}
          style={{
            width: 44,
            height: 44,
            borderRadius: gourmeatRadii.md,
            backgroundColor: filterCount > 0 ? gourmeatColors.primary : gourmeatColors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            ...gourmeatShadows.soft,
          }}
          testID="gourmeat-filter-btn"
        >
          <SHCIcon
            name="filters"
            size={shcIconSizes.lg}
            color={filterCount > 0 ? '#FFFFFF' : gourmeatColors.text}
          />
          {filterCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 4,
                borderRadius: 9,
                backgroundColor: gourmeatColors.text,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              testID="gourmeat-filter-count"
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>{filterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

export function GourmeatCategoryRow({
  title,
  categories,
  selectedId,
  onSelect,
  testID = 'gourmeat-category-row',
}: {
  /** When set, renders centered eyebrow with equal gap above/below to circles */
  title?: string;
  categories: GourmeatCategoryItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  testID?: string;
}) {
  const gap = shcSpacing.categoryStackGap;
  const row = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={{ paddingHorizontal: shcSpacing.md, gap: shcSpacing.md }}
    >
      {categories.map((cat, index) => {
        const active = cat.id === selectedId;
        return (
          <Pressable
            key={`${cat.id || 'all'}-${index}`}
            onPress={() => onSelect(cat.id)}
            testID={`gourmeat-cat-${cat.id || 'all'}`}
            style={{ alignItems: 'center', width: 72 }}
          >
            <GourmeatCategoryCircle cat={cat} active={active} />
            <Text
              style={{
                marginTop: gap,
                ...gourmeatTypography.categoryLabel,
                fontWeight: active ? '700' : '500',
                color: active ? gourmeatColors.primary : gourmeatColors.textLight,
                textAlign: 'center',
              }}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  if (!title) return row;

  return (
    <View
      style={shcSectionStack}
      testID={testID ? `${testID}-section` : 'gourmeat-category-section'}
    >
      <Text
        style={{
          textAlign: 'center',
          fontSize: 12,
          lineHeight: 12,
          fontWeight: '700',
          color: gourmeatColors.textLight,
          marginBottom: gap,
        }}
      >
        {title}
      </Text>
      {row}
    </View>
  );
}

function GourmeatCategoryCircle({ cat, active }: { cat: GourmeatCategoryItem; active: boolean }) {
  const [failed, setFailed] = React.useState(false);
  const showPhoto = Boolean(cat.imageUrl) && !failed;
  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: active ? gourmeatColors.primaryLight : gourmeatColors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: active ? 2 : 0,
        borderColor: gourmeatColors.primary,
        ...gourmeatShadows.soft,
      }}
    >
      {showPhoto ? (
        <Image
          source={{ uri: cat.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <SHCIcon name={cat.iconKey} size={26} color={active ? gourmeatColors.primary : gourmeatColors.textLight} active={active} />
      )}
    </View>
  );
}

export function GourmeatDiscountBadge({ percent, testID }: { percent?: number; testID?: string }) {
  if (percent == null || percent <= 0) return null;
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: gourmeatColors.discount,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: gourmeatRadii.sm,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '800', color: gourmeatColors.onPrimary }}>{percent}% OFF</Text>
    </View>
  );
}

export function GourmeatPopularBadge({ testID }: { testID?: string }) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: gourmeatColors.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: gourmeatRadii.sm,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '800', color: gourmeatColors.onPrimary }}>Popular</Text>
    </View>
  );
}

export function GourmeatAddButton({ onPress, testID }: { onPress?: () => void; testID?: string }) {
  return (
    <Pressable onPress={onPress} testID={testID} accessibilityRole="button">
      {({ pressed }) => (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: pressed ? gourmeatColors.primaryDark : gourmeatColors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: gourmeatColors.onPrimary, fontSize: 18, fontWeight: '700', lineHeight: 20 }}>+</Text>
        </View>
      )}
    </Pressable>
  );
}

export function GourmeatDishCard({
  dish,
  onPress,
  onAddPress,
  discountPercent,
  isFavorite,
  onFavoritePress,
  showPopular,
  testID,
}: {
  dish: SHCDishCardData;
  onPress?: () => void;
  onAddPress?: () => void;
  discountPercent?: number;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
  showPopular?: boolean;
  testID?: string;
}) {
  const cardTestID = testID ?? `dish-card-${dish.id}`;
  const imageUri = dish.image_url || getDishImageUrl({ id: dish.id, cuisine: dish.cuisine, name: dish.name });
  const displayRating = dish.rating != null && Number.isFinite(Number(dish.rating)) ? Number(dish.rating) : undefined;

  return (
    <View
      testID={cardTestID}
      style={{
        flex: 1,
        backgroundColor: gourmeatColors.surface,
        borderRadius: gourmeatRadii.lg,
        overflow: 'hidden',
        ...gourmeatShadows.card,
      }}
    >
      <View style={{ flex: 1, position: 'relative' }}>
        <SharedDishNavSurface dishId={dish.id} onNavigate={onPress} style={{ flex: 1, paddingBottom: shcSpacing.sm }}>
          {({ measureRef }) => (
            <>
              <View style={{ position: 'relative' }}>
                <SHCSharedDishImage
                  dishId={dish.id}
                  uri={imageUri}
                  style={{ width: '100%', height: 140 }}
                  measureRef={measureRef}
                  testID={`${cardTestID}-image`}
                />
                <View
                  pointerEvents="box-none"
                  style={{
                    position: 'absolute',
                    top: shcSpacing.sm,
                    left: shcSpacing.sm,
                    right: shcSpacing.sm,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', maxWidth: '70%' }}>
                    <GourmeatDiscountBadge percent={discountPercent} testID={`${cardTestID}-discount`} />
                    {showPopular ? <GourmeatPopularBadge testID={`${cardTestID}-popular`} /> : null}
                  </View>
                  {onFavoritePress ? (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16 }} pointerEvents="box-none">
                      <SHCFavoriteButton active={!!isFavorite} onPress={onFavoritePress} testID={`${cardTestID}-favorite`} />
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={{ padding: shcSpacing.sm, paddingRight: 44 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.text, marginBottom: 2 }}
                  numberOfLines={1}
                  testID={`${cardTestID}-name`}
                >
                  {dish.name}
                </Text>
                {dish.kitchenLabel ? (
                  <Text
                    style={{ fontSize: 11, fontWeight: '700', color: gourmeatColors.primary, marginBottom: 2 }}
                    numberOfLines={1}
                    testID={`${cardTestID}-kitchens`}
                  >
                    {dish.kitchenLabel}
                  </Text>
                ) : null}
                <Text
                  style={{ fontSize: 11, color: gourmeatColors.textLight, marginBottom: 6 }}
                  numberOfLines={1}
                  testID={`${cardTestID}-cook`}
                >
                  {dish.cook_name}
                </Text>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: gourmeatColors.primary }} testID={`${cardTestID}-price`}>
                    S${dish.price}
                  </Text>
                  {displayRating != null ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 }}>
                      <Text style={{ fontSize: 10, color: gourmeatColors.ratingStar }}>★</Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: gourmeatColors.textLight }}>
                        {displayRating.toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </SharedDishNavSurface>
        <View style={{ position: 'absolute', bottom: shcSpacing.sm, right: shcSpacing.sm }}>
          <GourmeatAddButton onPress={onAddPress ?? onPress} testID={`${cardTestID}-add`} />
        </View>
      </View>
    </View>
  );
}

export function GourmeatSectionTitle({
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
        paddingHorizontal: shcSpacing.md,
        ...shcTitleBlock,
      }}
    >
      <Text style={{ ...gourmeatTypography.sectionTitle, color: gourmeatColors.text }}>{title}</Text>
      {actionLabel && onActionPress && (
        <Pressable onPress={onActionPress}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: gourmeatColors.primary }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Browse spine — Dishes · Kitchens.
 * Makes the discover IA switchable instead of stacking every zone on one scroll.
 */
export function GourmeatModeSwitch({
  modes,
  activeId,
  onSelect,
  navAction,
  testID = 'discover-mode-switch',
}: {
  modes: Array<{ id: string; label: string; testID?: string }>;
  activeId: string;
  onSelect: (id: string) => void;
  /** Optional third action (unused on discover; occasions removed). */
  navAction?: { label: string; onPress: () => void; testID?: string };
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        marginHorizontal: shcSpacing.md,
        marginBottom: shcSpacing.section,
        padding: 4,
        borderRadius: gourmeatRadii.pill,
        backgroundColor: gourmeatColors.surfaceAlt,
        gap: 4,
      }}
    >
      {modes.map((mode) => {
        const active = mode.id === activeId;
        return (
          <Pressable
            key={mode.id}
            onPress={() => onSelect(mode.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            testID={mode.testID ?? `discover-mode-${mode.id}`}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: gourmeatRadii.pill,
              alignItems: 'center',
              backgroundColor: active ? gourmeatColors.surface : 'transparent',
              ...(active ? gourmeatShadows.soft : null),
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '800' : '600',
                color: active ? gourmeatColors.text : gourmeatColors.textLight,
              }}
            >
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
      {navAction ? (
        <Pressable
          onPress={navAction.onPress}
          accessibilityRole="link"
          testID={navAction.testID ?? 'discover-nav-action'}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: gourmeatRadii.pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: gourmeatColors.border,
            backgroundColor: gourmeatColors.surface,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.primary }}>{navAction.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Under-X cal drag control — pure RN (no native slider package). */
function MaxCalSlider({
  value,
  onChange,
  testID = 'max-cal-slider',
}: {
  value: number | undefined;
  onChange: (maxCal: number) => void;
  testID?: string;
}) {
  const { min, max, defaultPreview } = DISCOVER_MAX_CAL_SLIDER;
  /** Local live value so the tray can update even if parent maxCal is a stale closure. */
  const [live, setLive] = useState(() =>
    value != null ? snapMaxCalSliderValue(value) : defaultPreview
  );
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);
  /** Anchor pageX/localX at grant so moves stay accurate without measureInWindow. */
  const grantPageXRef = useRef(0);
  const grantLocalXRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    if (value != null) setLive(snapMaxCalSliderValue(value));
  }, [value]);

  const commit = useCallback((raw: number) => {
    const snapped = snapMaxCalSliderValue(raw);
    setLive(snapped);
    onChangeRef.current(snapped);
  }, []);

  const setFromLocalX = useCallback(
    (localX: number) => {
      const w = trackWidthRef.current;
      if (w <= 0) return;
      const t = Math.min(1, Math.max(0, localX / w));
      commit(min + t * (max - min));
    },
    [commit, max, min]
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const { pageX, locationX } = e.nativeEvent;
          grantPageXRef.current = pageX;
          grantLocalXRef.current = locationX;
          setFromLocalX(locationX);
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          const delta = e.nativeEvent.pageX - grantPageXRef.current;
          setFromLocalX(grantLocalXRef.current + delta);
        },
      }),
    [setFromLocalX]
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const ratio = (live - min) / (max - min);
  const fillW = Math.max(0, ratio * (trackWidth || 1));
  const thumbLeft = Math.max(0, Math.min((trackWidth || 0) - 24, fillW - 12));
  const active = value != null;

  return (
    <View style={{ width: '100%', marginTop: 10 }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: gourmeatColors.textLight, marginBottom: 2 }}>
            Max calories
          </Text>
          <Text
            style={{ fontSize: 20, fontWeight: '900', color: gourmeatColors.text, letterSpacing: -0.3 }}
            testID={`${testID}-value`}
          >
            {maxCalFilterLabel(live)}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 2 }}>
            {active ? 'Filter on — dishes over this are hidden' : 'Drag to set a calorie ceiling'}
          </Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight }}>
          {min}–{max}
        </Text>
      </View>
      <View
        {...pan.panHandlers}
        onLayout={onTrackLayout}
        testID={`${testID}-track`}
        style={{
          height: 44,
          justifyContent: 'center',
          paddingVertical: 12,
        }}
        accessibilityRole="adjustable"
        accessibilityValue={{ min, max, now: live }}
        accessibilityLabel={`Maximum calories, ${live}`}
      >
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: gourmeatColors.border,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: 8,
              width: fillW,
              borderRadius: 4,
              backgroundColor: gourmeatColors.primary,
            }}
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: thumbLeft,
            top: 10,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: gourmeatColors.primary,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            ...gourmeatShadows.soft,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Every discover filter in one tray, so the controls sit next to a single
 * Apply action instead of being spread across three chip rows on the scroll.
 */
export function SHCDiscoverFilterSheet({
  mealTypeChips,
  mealType,
  onMealTypeChange,
  cuisines,
  cuisine,
  onCuisineChange,
  halalOnly,
  vegetarianOnly,
  veganOnly = false,
  chickenOnly = false,
  excludeNuts = false,
  lightOnly,
  maxCal: maxCalProp,
  onToggleHalal,
  onToggleVegetarian,
  onToggleVegan,
  onToggleChicken,
  onToggleExcludeNuts,
  onToggleLight,
  onMaxCalChange,
  onClear,
  onApply,
  resultCount,
  activeCount = 0,
  hideCuisine = false,
  testID = 'discover-filter-sheet',
}: {
  mealTypeChips: Array<{ id: string; label: string }>;
  mealType: string;
  onMealTypeChange: (id: string) => void;
  cuisines: Array<{ id: string; label: string }>;
  cuisine: string;
  onCuisineChange: (id: string) => void;
  halalOnly: boolean;
  vegetarianOnly: boolean;
  veganOnly?: boolean;
  chickenOnly?: boolean;
  excludeNuts?: boolean;
  /** @deprecated Prefer maxCal + onMaxCalChange */
  lightOnly?: boolean;
  maxCal?: number;
  onToggleHalal: () => void;
  onToggleVegetarian: () => void;
  onToggleVegan?: () => void;
  onToggleChicken?: () => void;
  onToggleExcludeNuts?: () => void;
  /** @deprecated Prefer onMaxCalChange */
  onToggleLight?: () => void;
  onMaxCalChange?: (maxCal: number | undefined) => void;
  onClear: () => void;
  onApply: () => void;
  resultCount: number;
  activeCount?: number;
  hideCuisine?: boolean;
  testID?: string;
}) {
  /**
   * Local maxCal so chips/slider re-render inside the tray.
   * Tray content factories often close over a stale parent `maxCal` prop.
   */
  const [maxCal, setMaxCalLocal] = useState(maxCalProp);
  React.useEffect(() => {
    setMaxCalLocal(maxCalProp);
  }, [maxCalProp]);

  const setMaxCal = useCallback(
    (next: number | undefined) => {
      setMaxCalLocal(next);
      onMaxCalChange?.(next);
    },
    [onMaxCalChange]
  );

  const group = (label: string, children: React.ReactNode) => (
    <View style={{ marginBottom: shcSpacing.lg }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: gourmeatColors.textLight,
          marginBottom: shcSpacing.sm,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: shcSpacing.sm }}>{children}</View>
    </View>
  );

  const pill = (key: string, label: string, active: boolean, onPress: () => void, id: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      testID={`${testID}-${id}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      style={{
        paddingHorizontal: shcSpacing.md,
        paddingVertical: 8,
        borderRadius: gourmeatRadii.pill,
        borderWidth: 1,
        borderColor: active ? gourmeatColors.primary : gourmeatColors.border,
        backgroundColor: active ? gourmeatColors.primary : gourmeatColors.surface,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#FFFFFF' : gourmeatColors.text }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }} testID={testID}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {group(
          'Meal',
          mealTypeChips.map((chip, index) =>
            pill(`meal-${chip.id}-${index}`, chip.label, chip.id === mealType, () => onMealTypeChange(chip.id), `meal-${chip.id}`)
          )
        )}
        {hideCuisine
          ? null
          : group(
              'Cuisine',
              cuisines.map((c, index) =>
                pill(`cuisine-${c.id || 'all'}-${index}`, c.label, c.id === cuisine, () => onCuisineChange(c.id), `cuisine-${c.id || 'all'}`)
              )
            )}
        {group(
          'Dietary',
          <>
            {pill('halal', 'Halal', halalOnly, onToggleHalal, 'halal')}
            {pill('veg', 'Vegetarian', vegetarianOnly, onToggleVegetarian, 'veg')}
            {onToggleVegan
              ? pill('vegan', 'Vegan', veganOnly, onToggleVegan, 'vegan')
              : null}
          </>
        )}
        {group(
          'Calories',
          <>
            {pill(
              'cal-any',
              'Any',
              maxCal == null && !lightOnly,
              () => {
                if (onMaxCalChange) setMaxCal(undefined);
                else if (lightOnly && onToggleLight) onToggleLight();
              },
              'cal-any'
            )}
            {onMaxCalChange
              ? DISCOVER_MAX_CAL_PRESETS.map((n) =>
                  pill(
                    `cal-${n}`,
                    maxCalFilterLabel(n),
                    maxCal === n,
                    () => setMaxCal(toggleMaxCalPreset(maxCal, n)),
                    `cal-${n}`
                  )
                )
              : onToggleLight
                ? pill('light', 'Under 500 cal', !!lightOnly, onToggleLight, 'light')
                : null}
            {onMaxCalChange ? (
              <MaxCalSlider
                value={maxCal}
                onChange={(n) => setMaxCal(n)}
                testID={`${testID}-cal-slider`}
              />
            ) : null}
          </>
        )}
        {group(
          'Ingredients',
          <>
            {onToggleChicken
              ? pill('chicken', 'Chicken', chickenOnly, onToggleChicken, 'chicken')
              : null}
            {onToggleExcludeNuts
              ? pill('no-nuts', 'No nuts', excludeNuts, onToggleExcludeNuts, 'no-nuts')
              : null}
          </>
        )}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: shcSpacing.sm,
          paddingTop: shcSpacing.md,
          borderTopWidth: 1,
          borderTopColor: gourmeatColors.border,
        }}
      >
        <Pressable
          onPress={onClear}
          disabled={activeCount === 0}
          testID={`${testID}-clear`}
          style={{ paddingHorizontal: shcSpacing.md, paddingVertical: 12, opacity: activeCount === 0 ? 0.4 : 1 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.textMuted }}>Clear</Text>
        </Pressable>
        <Pressable
          onPress={onApply}
          testID={`${testID}-apply`}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: gourmeatRadii.pill,
            backgroundColor: gourmeatColors.primary,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
            {resultCount === 1 ? 'Show 1 dish' : `Show ${resultCount} dishes`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Gestalt “common region” — eyebrow + bordered group (cafe wireframe IA).
 * Keeps related controls visually together (proximity + similarity).
 */
export function SHCSectionRegion({
  eyebrow,
  title,
  children,
  testID,
  inset = true,
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  testID?: string;
  /** When false, parent already applies horizontal padding. */
  inset?: boolean;
}) {
  return (
    <View testID={testID} style={[shcSectionStack, inset ? { paddingHorizontal: shcSpacing.md } : undefined]}>
      {eyebrow ? (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            color: gourmeatColors.textLight,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
          testID={testID ? `${testID}-eyebrow` : undefined}
        >
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text
          style={{
            fontSize: 15,
            fontWeight: '800',
            color: gourmeatColors.text,
            marginBottom: shcSpacing.sm,
          }}
          testID={testID ? `${testID}-title` : undefined}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          borderRadius: gourmeatRadii.lg,
          borderWidth: 2,
          borderColor: gourmeatColors.border,
          backgroundColor: gourmeatColors.surface,
          padding: shcSpacing.md,
          ...gourmeatShadows.soft,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Section label only — for horizontal rails that should not be boxed in. */
export function SHCSectionEyebrow({
  children,
  testID,
  inset = true,
}: {
  children: string;
  testID?: string;
  inset?: boolean;
}) {
  return (
    <Text
      testID={testID}
      style={{
        fontSize: 11,
        fontWeight: '800',
        color: gourmeatColors.textLight,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: shcSpacing.xs,
        ...(inset ? { paddingHorizontal: shcSpacing.md } : {}),
        ...shcTitleBlock,
      }}
    >
      {children}
    </Text>
  );
}

/** Restaurant-app quick actions — icon + label row (discover home). */
export function SHCRestaurantQuickActions({
  actions,
  onActionPress,
  testID = 'restaurant-quick-actions',
}: {
  actions: Array<{
    id: string;
    label: string;
    iconKey: 'restaurant' | 'home' | 'cart' | 'location' | 'orders';
    testID: string;
    accessibilityLabel: string;
  }>;
  onActionPress: (id: string) => void;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: shcSpacing.sm,
        marginBottom: shcSpacing.md,
        paddingHorizontal: shcSpacing.md,
      }}
    >
      {actions.map((action) => (
        <Pressable
          key={action.id}
          onPress={() => onActionPress(action.id)}
          testID={action.testID}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 72,
            paddingVertical: shcSpacing.sm,
            paddingHorizontal: 4,
            borderRadius: gourmeatRadii.lg,
            backgroundColor: pressed ? gourmeatColors.primaryLight : gourmeatColors.surface,
            borderWidth: 2,
            borderColor: gourmeatColors.border,
            ...gourmeatShadows.soft,
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: gourmeatColors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            }}
          >
            <SHCIcon name={action.iconKey} size={20} color={gourmeatColors.primary} active />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: gourmeatColors.text, textAlign: 'center' }}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Inline cafe journey — Browse · Order · Collect (wireframe narrative). */
export function SHCFoodJourneyStrip({
  steps,
  testID = 'food-journey-strip',
}: {
  steps: Array<{ id: string; label: string; detail: string }>;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: shcSpacing.sm,
        paddingHorizontal: shcSpacing.md,
      }}
    >
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          {i > 0 ? (
            <Text style={{ fontSize: 12, fontWeight: '700', color: gourmeatColors.textMuted }}>·</Text>
          ) : null}
          <View style={{ alignItems: 'center' }} testID={`food-journey-${s.id}`}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: gourmeatColors.primary }}>{s.label}</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: gourmeatColors.textLight }}>{s.detail}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

export function GourmeatFloatingTabBar({
  tabs,
  activeKey,
  onTabPress,
  testID = 'bottom-tab-bar',
}: {
  tabs: SHCBottomTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        marginHorizontal: shcSpacing.md,
        marginBottom: shcSpacing.sm,
        borderRadius: gourmeatRadii.nav,
        backgroundColor: gourmeatColors.nav,
        flexDirection: 'row',
        paddingVertical: shcSpacing.sm,
        paddingHorizontal: shcSpacing.xs,
        ...gourmeatShadows.nav,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            testID={tab.testID}
            onPress={() => onTabPress(tab.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <View style={{ position: 'relative', marginBottom: 2 }}>
              {tab.iconKey ? (
                tab.ordersLiveCue === 'cooking' ? (
                  <SHCOrdersTabCookingIcon
                    iconKey={tab.iconKey as SHCTabIconKey}
                    active={active}
                    color={active ? gourmeatColors.navActive : 'rgba(255,255,255,0.55)'}
                    size={22}
                  />
                ) : (
                  <SHCIcon
                    name={tab.iconKey as SHCTabIconKey}
                    active={active}
                    size={22}
                    color={active ? gourmeatColors.navActive : 'rgba(255,255,255,0.55)'}
                  />
                )
              ) : (
                <Text style={{ fontSize: 18 }}>{tab.icon ?? '•'}</Text>
              )}
              {tab.badge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: gourmeatColors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ fontSize: 8, fontWeight: '900', color: gourmeatColors.onPrimary }}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: active ? '700' : '500',
                color: active ? gourmeatColors.navActive : 'rgba(255,255,255,0.55)',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function GourmeatStickyCartBar({
  itemCount,
  countLabel,
  totalLabel,
  previewName,
  onPress,
  testID = 'sticky-cart-bar',
}: {
  itemCount: number;
  countLabel: string;
  totalLabel: string;
  previewName?: string;
  onPress: () => void;
  testID?: string;
}) {
  if (itemCount <= 0) return null;
  const badge = itemCount > 99 ? '99+' : String(itemCount);

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`View cart, ${countLabel}, ${totalLabel}`}
      style={{ marginHorizontal: shcSpacing.sm, marginBottom: shcSpacing.sm }}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: pressed ? gourmeatColors.primaryDark : gourmeatColors.primary,
            borderRadius: gourmeatRadii.lg,
            borderWidth: 0,
            paddingVertical: shcSpacing.md,
            paddingHorizontal: shcSpacing.md,
            minHeight: 58,
            ...gourmeatShadows.nav,
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, minWidth: 0 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: gourmeatColors.onPrimary,
                borderWidth: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SHCIcon name="cart" size={20} color={gourmeatColors.primary} active />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: gourmeatColors.onPrimary }} numberOfLines={1}>
                {countLabel}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.95)', marginTop: 1 }} numberOfLines={1}>
                View cart · PayNow →
              </Text>
              {previewName ? (
                <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 }} numberOfLines={1}>
                  {previewName}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                minWidth: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: gourmeatColors.accent,
                borderWidth: 0,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '900', color: gourmeatColors.text }}>{badge}</Text>
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: gourmeatColors.onPrimary }}>{totalLabel}</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: gourmeatColors.onPrimary }}>›</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function GourmeatPayButton({
  label = 'Pay Now',
  amount,
  onPress,
  disabled,
  loading,
  testID = 'gourmeat-pay-btn',
}: {
  label?: string;
  amount?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} testID={testID} accessibilityRole="button">
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: disabled ? gourmeatColors.textMuted : pressed ? gourmeatColors.payPressed : gourmeatColors.pay,
            borderRadius: gourmeatRadii.md,
            paddingVertical: 16,
            paddingHorizontal: shcSpacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: shcSpacing.sm,
            opacity: disabled ? 0.6 : 1,
            minHeight: 52,
            alignSelf: 'stretch',
            ...gourmeatShadows.soft,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.onDark }}>
            {loading ? 'Processing…' : label}
          </Text>
          {amount && !loading ? (
            <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.onDark }}>{amount}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export function GourmeatOrderSummaryCard({
  items,
  subtotal,
  discount,
  total,
  testID = 'gourmeat-order-summary',
}: {
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount?: number;
  total: number;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: gourmeatColors.surface,
        borderRadius: gourmeatRadii.lg,
        padding: shcSpacing.md,
        ...gourmeatShadows.card,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.md }}>Order Summary</Text>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 13, color: gourmeatColors.textLight, flex: 1 }} numberOfLines={1}>
            {item.qty}× {item.name}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: gourmeatColors.text }}>S${(item.price * item.qty).toFixed(2)}</Text>
        </View>
      ))}
      <View style={{ height: 1, backgroundColor: gourmeatColors.border, marginVertical: shcSpacing.sm }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: gourmeatColors.textLight }}>Subtotal</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: gourmeatColors.text }}>S${subtotal.toFixed(2)}</Text>
      </View>
      {discount != null && discount > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: gourmeatColors.primary }}>Credits / promo</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: gourmeatColors.primary }}>-S${discount.toFixed(2)}</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: shcSpacing.sm }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.text }}>Total</Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: gourmeatColors.primary }}>S${total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

export function GourmeatPaymentMethodRow({
  id,
  label,
  subtitle,
  selected,
  onSelect,
  testID,
}: {
  id: string;
  label: string;
  subtitle?: string;
  selected: boolean;
  onSelect: (id: string) => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={() => onSelect(id)}
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: shcSpacing.md,
        backgroundColor: selected ? gourmeatColors.primaryLight : gourmeatColors.surface,
        borderRadius: gourmeatRadii.md,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? gourmeatColors.primary : gourmeatColors.border,
        marginBottom: shcSpacing.sm,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? gourmeatColors.primary : gourmeatColors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: shcSpacing.sm,
        }}
      >
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: gourmeatColors.primary }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.text }}>{label}</Text>
        {subtitle ? <Text style={{ fontSize: 12, color: gourmeatColors.textLight, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      <SHCIcon name="paynow" size={22} color={gourmeatColors.text} />
    </Pressable>
  );
}

export function GourmeatScreenHeader({
  title,
  subtitle,
  onBack,
  testID,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ marginBottom: shcSpacing.md }}>
      {onBack && (
        <Pressable onPress={onBack} style={{ marginBottom: shcSpacing.sm }} testID="gourmeat-back-btn">
          <Text style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.primary }}>← Back</Text>
        </Pressable>
      )}
      <Text style={{ fontSize: 28, fontWeight: '800', color: gourmeatColors.text, letterSpacing: -0.5 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 13, color: gourmeatColors.textLight, marginTop: 4, fontWeight: '500' }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function GourmeatCard({ children, style, testID }: { children: React.ReactNode; style?: object; testID?: string }) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: gourmeatColors.surface,
        borderRadius: gourmeatRadii.lg,
        padding: shcSpacing.md,
        marginBottom: shcSpacing.sm,
        ...gourmeatShadows.card,
        ...(style || {}),
      }}
    >
      {children}
    </View>
  );
}

export function GourmeatStatPill({
  iconKey,
  value,
  label,
  testID,
}: {
  iconKey: 'restaurant' | 'earnings' | 'cart' | 'orders';
  value: string | number;
  label: string;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flex: 1,
        backgroundColor: gourmeatColors.surface,
        borderRadius: gourmeatRadii.lg,
        padding: shcSpacing.md,
        alignItems: 'center',
        ...gourmeatShadows.soft,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: gourmeatColors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <SHCIcon name={iconKey} size={18} color={gourmeatColors.primary} active />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: gourmeatColors.text }}>{value}</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function GourmeatCartLineItem({
  name,
  qty,
  price,
  imageUri,
  minQty = 1,
  onDecrement,
  onIncrement,
  onRemove,
  updating,
  testID,
}: {
  name: string;
  qty: number;
  price: number;
  imageUri?: string;
  minQty?: number;
  onDecrement?: () => void;
  onIncrement?: () => void;
  onRemove?: () => void;
  updating?: boolean;
  testID?: string;
}) {
  const uri = imageUri || getDishImageUrl({ name });
  const interactive = Boolean(onDecrement || onIncrement || onRemove);
  const canDecrement = qty > minQty;
  return (
    <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, paddingVertical: shcSpacing.sm, opacity: updating ? 0.6 : 1 }}>
      <View style={{ width: 56, height: 56, borderRadius: gourmeatRadii.md, overflow: 'hidden' }}>
        <SHCFoodImage uri={uri} width={56} height={56} rounded={gourmeatRadii.md} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.text }} numberOfLines={1}>
          {name}
        </Text>
        <Text style={{ fontSize: 12, color: gourmeatColors.textLight, marginTop: 2 }}>
          S${price.toFixed(2)} each{interactive ? '' : ` · ${qty} ×`}
        </Text>
        {interactive ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: gourmeatColors.surfaceAlt, borderRadius: gourmeatRadii.pill }}>
              <Pressable
                onPress={onDecrement}
                disabled={!canDecrement || updating}
                testID={testID ? `${testID}-decrement` : undefined}
                style={{ paddingHorizontal: 10, paddingVertical: 6, opacity: canDecrement && !updating ? 1 : 0.35 }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: gourmeatColors.text }}>−</Text>
              </Pressable>
              <Text
                style={{ fontSize: 14, fontWeight: '800', color: gourmeatColors.text, minWidth: 20, textAlign: 'center' }}
                testID={testID ? `${testID}-qty` : undefined}
              >
                {qty}
              </Text>
              <Pressable
                onPress={onIncrement}
                disabled={updating}
                testID={testID ? `${testID}-increment` : undefined}
                style={{ paddingHorizontal: 10, paddingVertical: 6, opacity: updating ? 0.35 : 1 }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: gourmeatColors.text }}>+</Text>
              </Pressable>
            </View>
            {onRemove ? (
              <Pressable
                onPress={onRemove}
                disabled={updating}
                testID={testID ? `${testID}-remove` : undefined}
                hitSlop={8}
                style={{ paddingHorizontal: 4, paddingVertical: 2, opacity: updating ? 0.35 : 1 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: gourmeatColors.textLight }}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: 14, fontWeight: '800', color: gourmeatColors.primary }}>S${(qty * price).toFixed(2)}</Text>
    </View>
  );
}

/** Shared CTA — `md` full-width form actions; `sm` equal-height chips for action rows. */
export function GourmeatPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  fullWidth,
  testID,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  /** sm = compact 36px chips (order rows); md = 48px form CTAs */
  size?: 'md' | 'sm';
  /** When true, stretch to parent width (md default). sm is never full-width. */
  fullWidth?: boolean;
  testID?: string;
  style?: object;
}) {
  const isOutline = variant === 'outline';
  const isSm = size === 'sm';
  const stretch = fullWidth ?? !isSm;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} testID={testID} accessibilityRole="button">
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: isOutline
              ? gourmeatColors.surface
              : disabled
                ? gourmeatColors.textMuted
                : pressed
                  ? gourmeatColors.primaryDark
                  : gourmeatColors.primary,
            borderRadius: gourmeatRadii.md,
            paddingVertical: isSm ? 8 : 14,
            paddingHorizontal: isSm ? 14 : shcSpacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: isOutline ? 1 : 0,
            borderColor: gourmeatColors.border,
            opacity: disabled ? 0.6 : 1,
            minHeight: isSm ? 36 : 48,
            height: isSm ? 36 : undefined,
            alignSelf: stretch ? 'stretch' : 'auto',
            flexGrow: 0,
            flexShrink: 0,
            ...gourmeatShadows.soft,
            ...(style || {}),
          }}
        >
          <Text
            style={{
              fontSize: isSm ? 13 : 15,
              fontWeight: '800',
              lineHeight: isSm ? 16 : 20,
              color: isOutline ? gourmeatColors.text : gourmeatColors.onPrimary,
            }}
          >
            {loading ? (isSm ? '…' : 'Please wait…') : label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Equal-height action strip under order cards (Ready / Chat / Details). */
export function GourmeatActionRow({
  children,
  testID,
}: {
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </View>
  );
}

export function GourmeatProductStickyBar({
  qty,
  minQty,
  lineTotal,
  onDecrement,
  onIncrement,
  onAdd,
  disabled,
  loading,
  testID = 'pdp-sticky-bar',
}: {
  qty: number;
  minQty: number;
  lineTotal: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onAdd: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: shcSpacing.sm,
        backgroundColor: gourmeatColors.surface,
        paddingHorizontal: shcSpacing.md,
        paddingVertical: shcSpacing.sm,
        borderTopWidth: 1,
        borderTopColor: gourmeatColors.border,
        ...gourmeatShadows.soft,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: gourmeatColors.surfaceAlt, borderRadius: gourmeatRadii.pill }}>
        <Pressable onPress={onDecrement} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: gourmeatColors.text }}>−</Text>
        </Pressable>
        <Text style={{ fontSize: 15, fontWeight: '800', color: gourmeatColors.text, minWidth: 24, textAlign: 'center' }}>{qty}</Text>
        <Pressable onPress={onIncrement} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: gourmeatColors.text }}>+</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 11, color: gourmeatColors.textLight }}>min {minQty}</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.text }}>S${lineTotal.toFixed(0)}</Text>
      </View>
      <Pressable
        onPress={onAdd}
        disabled={disabled || loading}
        testID="add-to-cart-btn"
        accessibilityRole="button"
        hitSlop={12}
      >
        {({ pressed }) => (
          <View
            style={{
              backgroundColor: disabled ? gourmeatColors.textMuted : pressed ? gourmeatColors.primaryDark : gourmeatColors.primary,
              borderRadius: gourmeatRadii.md,
              paddingVertical: 12,
              paddingHorizontal: shcSpacing.md,
              opacity: disabled ? 0.6 : 1,
              minWidth: 72,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: gourmeatColors.onPrimary }}>
              {loading ? 'Adding…' : 'Add'}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export function GourmeatCookHeader({
  title,
  subtitle,
  badges,
  action,
  testID,
}: {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  action?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View testID={testID} style={[shcHeaderGap, { flexDirection: 'row', alignItems: 'flex-start', gap: shcSpacing.sm }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...gourmeatTypography.screenTitle, color: gourmeatColors.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: gourmeatColors.textLight, marginTop: 4 }}>{subtitle}</Text>
        ) : null}
        {badges ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: shcSpacing.sm }}>{badges}</View> : null}
      </View>
      {action ? <View style={{ flexShrink: 0 }}>{action}</View> : null}
    </View>
  );
}

export function GourmeatOrderRow({
  orderId,
  dishName,
  productId,
  status,
  statusLabel,
  collectionDate,
  collectionSlot,
  total,
  onPress,
  actions,
  testID,
}: {
  orderId: string;
  dishName?: string;
  productId?: string;
  status: string;
  statusLabel?: string;
  collectionDate?: string;
  collectionSlot?: string;
  total?: number;
  onPress?: () => void;
  actions?: React.ReactNode;
  testID?: string;
}) {
  const imageUri = getDishImageUrl({ id: productId, name: dishName });
  const label = statusLabel || status;
  const inner = (
    <View
      testID={testID ?? `order-row-${orderId}`}
      style={{
        backgroundColor: gourmeatColors.surface,
        borderRadius: gourmeatRadii.lg,
        marginBottom: shcSpacing.sm,
        overflow: 'hidden',
        ...gourmeatShadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', padding: shcSpacing.sm, gap: shcSpacing.sm }}>
        <SHCFoodImage uri={imageUri} width={72} height={72} rounded={gourmeatRadii.md} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: gourmeatColors.text }} numberOfLines={1}>
            {dishName || 'Order'}
          </Text>
          <Text style={{ fontSize: 11, color: gourmeatColors.textLight, marginTop: 2 }}>#{orderId}</Text>
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 6,
              backgroundColor: gourmeatColors.primaryLight,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: gourmeatRadii.sm,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: gourmeatColors.primary }}>{label}</Text>
          </View>
          {(collectionDate || collectionSlot) && (
            <Text style={{ fontSize: 11, color: gourmeatColors.textLight, marginTop: 4 }}>
              {collectionDate} {collectionSlot}
            </Text>
          )}
          {total != null && (
            <Text style={{ fontSize: 13, fontWeight: '800', color: gourmeatColors.primary, marginTop: 4 }}>S${total}</Text>
          )}
        </View>
      </View>
    </View>
  );
  if (onPress) {
    return (
      <View>
        <Pressable onPress={onPress}>{inner}</Pressable>
        {actions ? (
          <View
            style={{
              paddingHorizontal: shcSpacing.sm,
              marginTop: 4,
              marginBottom: shcSpacing.sm,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {actions}
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View>
      {inner}
      {actions ? (
        <View
          style={{
            paddingHorizontal: shcSpacing.sm,
            paddingBottom: shcSpacing.sm,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {actions}
        </View>
      ) : null}
    </View>
  );
}

export function GourmeatEmptyState({
  title,
  body,
  ctaLabel,
  onCta,
  testID,
  illustration,
}: {
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
  testID?: string;
  /** HomelyEats empty illustrations */
  illustration?: import('@shc/utils').EmptyIllustrationKind;
}) {
  return (
    <View
      testID={testID}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: shcSpacing.xl * 1.5,
        paddingHorizontal: shcSpacing.lg,
        gap: shcSpacing.md,
        minHeight: 280,
      }}
    >
      {illustration ? <EmptyIllustration kind={illustration} size={120} /> : null}
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: gourmeatColors.textLight,
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 260,
        }}
      >
        {title}
      </Text>
      {body ? (
        <Text style={{ fontSize: 13, color: gourmeatColors.textLight, textAlign: 'center' }}>{body}</Text>
      ) : null}
      {ctaLabel && onCta ? (
        <GourmeatPrimaryButton
          label={ctaLabel}
          onPress={onCta}
          testID="gourmeat-empty-cta"
          style={{ marginTop: shcSpacing.sm, minWidth: 180 }}
        />
      ) : null}
    </View>
  );
}