// Gourmeat food-app UI (Orbix Studio / Behance) — customer discover, cart, checkout.
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Image } from 'react-native';
import { gourmeatColors, gourmeatRadii, gourmeatShadows, shcSpacing, shcColors, shcBorders, shcShadows } from './theme';
import { SHCIcon, type SHCTabIconKey } from './icons';
import { SHCFoodImage } from './visuals';
import { SHCSharedDishImage, SharedDishNavSurface } from './family-values-ui';
import { SHCFavoriteButton } from './delivery-ux';
import { getDishImageUrl } from '@shc/utils';
import type { SHCDishCardData } from './domain';
import type { SHCBottomTab } from './primitives';

/** Deterministic promo badge per dish id (10–25% off). */
export function gourmeatDiscountPercent(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 100;
  return 10 + (hash % 16);
}

export type GourmeatCategoryItem = {
  id: string;
  label: string;
  iconKey: 'restaurant' | 'leaf' | 'people' | 'flame' | 'home' | 'filters';
  imageUrl?: string;
};

export function GourmeatHomeHeader({
  headline = 'Hungry? Order & Eat.',
  locationLabel = 'Katong, Singapore',
  locationHint = 'Deliver to',
  avatarUri,
  onLocationPress,
  onProfilePress,
  onNotificationPress,
  testID = 'gourmeat-home-header',
}: {
  headline?: string;
  locationLabel?: string;
  locationHint?: string;
  avatarUri?: string;
  onLocationPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ paddingHorizontal: shcSpacing.md, paddingBottom: shcSpacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: shcSpacing.md }}>
        <View style={{ flex: 1, paddingRight: shcSpacing.sm }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: gourmeatColors.text,
              letterSpacing: -0.5,
              lineHeight: 32,
            }}
          >
            {headline}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm }}>
          {onNotificationPress && (
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
          )}
          {onProfilePress && (
            <Pressable onPress={onProfilePress} testID="gourmeat-profile-avatar">
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  overflow: 'hidden',
                  backgroundColor: gourmeatColors.primaryLight,
                  ...gourmeatShadows.soft,
                }}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <SHCIcon name="profile" size={22} color={gourmeatColors.primary} active />
                  </View>
                )}
              </View>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        onPress={onLocationPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: gourmeatColors.surface,
          paddingHorizontal: shcSpacing.sm,
          paddingVertical: 6,
          borderRadius: gourmeatRadii.pill,
          ...gourmeatShadows.soft,
        }}
        testID="gourmeat-location-chip"
      >
        <SHCIcon name="location" size={14} color={gourmeatColors.primary} active />
        <View style={{ width: 4 }} />
        <Text style={{ fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight }}>{locationHint}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: gourmeatColors.text, marginLeft: 4 }} numberOfLines={1}>
          {locationLabel}
        </Text>
        <Text style={{ fontSize: 10, color: gourmeatColors.textMuted, marginLeft: 4 }}>▼</Text>
      </Pressable>
    </View>
  );
}

export function GourmeatSearchBar({
  value,
  onChangeText,
  placeholder = 'Search dishes, cooks…',
  onFilterPress,
  testID = 'search-input',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  testID?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: shcSpacing.md,
        marginBottom: shcSpacing.md,
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
        <SHCIcon name="search" size={18} color={gourmeatColors.textMuted} />
        <View style={{ width: shcSpacing.sm }} />
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          testID={testID}
          style={{ flex: 1, fontSize: 14, color: gourmeatColors.text, fontWeight: '500' }}
          placeholderTextColor={gourmeatColors.textMuted}
        />
      </View>
      {onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          style={{
            width: 44,
            height: 44,
            borderRadius: gourmeatRadii.md,
            backgroundColor: gourmeatColors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            ...gourmeatShadows.soft,
          }}
          testID="gourmeat-filter-btn"
        >
          <SHCIcon name="filters" size={20} color={gourmeatColors.text} />
        </Pressable>
      )}
    </View>
  );
}

export function GourmeatCategoryRow({
  categories,
  selectedId,
  onSelect,
  testID = 'gourmeat-category-row',
}: {
  categories: GourmeatCategoryItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  testID?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={{ paddingHorizontal: shcSpacing.md, gap: shcSpacing.md, paddingBottom: shcSpacing.sm }}
    >
      {categories.map((cat) => {
        const active = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id || 'all'}
            onPress={() => onSelect(cat.id)}
            testID={`gourmeat-cat-${cat.id || 'all'}`}
            style={{ alignItems: 'center', width: 72 }}
          >
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
              {cat.imageUrl ? (
                <Image source={{ uri: cat.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <SHCIcon name={cat.iconKey} size={26} color={active ? gourmeatColors.primary : gourmeatColors.textLight} active={active} />
              )}
            </View>
            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
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
}

export function GourmeatDiscountBadge({ percent, testID }: { percent: number; testID?: string }) {
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

export function GourmeatAddButton({ onPress, testID }: { onPress?: () => void; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: pressed ? gourmeatColors.primaryDark : gourmeatColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text style={{ color: gourmeatColors.onPrimary, fontSize: 18, fontWeight: '700', lineHeight: 20 }}>+</Text>
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
  testID,
}: {
  dish: SHCDishCardData;
  onPress?: () => void;
  onAddPress?: () => void;
  discountPercent?: number;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
  testID?: string;
}) {
  const cardTestID = testID ?? `dish-card-${dish.id}`;
  const imageUri = dish.image_url || getDishImageUrl({ id: dish.id, cuisine: dish.cuisine, name: dish.name });
  const discount = discountPercent ?? gourmeatDiscountPercent(dish.id);
  const rating = dish.rating ?? 4.8;

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
                  <GourmeatDiscountBadge percent={discount} testID={`${cardTestID}-discount`} />
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
                <Text style={{ fontSize: 11, color: gourmeatColors.textLight, marginBottom: 6 }} numberOfLines={1} testID={`${cardTestID}-cook`}>
                  {dish.cook_name}
                </Text>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: gourmeatColors.primary }} testID={`${cardTestID}-price`}>
                    S${dish.price}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 }}>
                    <Text style={{ fontSize: 10, color: gourmeatColors.accent }}>★</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: gourmeatColors.textLight }}>{rating.toFixed(1)}</Text>
                  </View>
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

/** Gourmeat dish card loading placeholder — customer discover grid */
export function GourmeatDishCardSkeleton({ testID }: { testID?: string }) {
  const line = (width: `${number}%`) => ({
    height: 10,
    borderRadius: 5,
    backgroundColor: gourmeatColors.surfaceAlt,
    width,
  });
  return (
    <View
      testID={testID}
      style={{
        flex: 1,
        backgroundColor: gourmeatColors.surface,
        borderRadius: gourmeatRadii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: gourmeatColors.border,
        ...gourmeatShadows.card,
      }}
    >
      <View style={{ height: 140, backgroundColor: gourmeatColors.surfaceAlt }} />
      <View style={{ padding: shcSpacing.sm, gap: 6 }}>
        <View style={line('82%')} />
        <View style={line('58%')} />
        <View style={[line('38%'), { marginTop: 4, height: 12 }]} />
      </View>
    </View>
  );
}

export function GourmeatDishSkeletonGrid({ count = 4, testID }: { count?: number; testID?: string }) {
  return (
    <View
      testID={testID}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: shcSpacing.sm, marginBottom: shcSpacing.md }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: '48%' }}>
          <GourmeatDishCardSkeleton testID={testID ? `${testID}-${i}` : undefined} />
        </View>
      ))}
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
        marginBottom: shcSpacing.sm,
        marginTop: shcSpacing.md,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '800', color: gourmeatColors.text, letterSpacing: -0.3 }}>{title}</Text>
      {actionLabel && onActionPress && (
        <Pressable onPress={onActionPress}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: gourmeatColors.primary }}>{actionLabel}</Text>
        </Pressable>
      )}
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
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        paddingVertical: shcSpacing.sm,
        paddingHorizontal: shcSpacing.xs,
        ...gourmeatShadows.soft,
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
                <SHCIcon
                  name={tab.iconKey as SHCTabIconKey}
                  active={active}
                  size={22}
                  color={active ? gourmeatColors.navActive : 'rgba(255,255,255,0.55)'}
                />
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
  subtitle = 'View cart · PayNow →',
  accessibilityLabel,
  onPress,
  testID = 'sticky-cart-bar',
}: {
  itemCount: number;
  countLabel: string;
  totalLabel: string;
  previewName?: string;
  subtitle?: string;
  accessibilityLabel?: string;
  onPress: () => void;
  testID?: string;
}) {
  if (itemCount <= 0) return null;
  const badge = itemCount > 99 ? '99+' : String(itemCount);
  const a11y = accessibilityLabel ?? `View cart, ${countLabel}, ${totalLabel}`;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        marginHorizontal: shcSpacing.sm,
        marginBottom: shcSpacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: pressed ? gourmeatColors.payPressed : gourmeatColors.pay,
        borderRadius: gourmeatRadii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        paddingVertical: shcSpacing.md,
        paddingHorizontal: shcSpacing.md,
        minHeight: 58,
        ...gourmeatShadows.soft,
      })}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, minWidth: 0 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SHCIcon name="cart" size={20} color={gourmeatColors.onDark} active />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: gourmeatColors.onDark }} numberOfLines={1}>
            {countLabel}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.95)', marginTop: 1 }} numberOfLines={1}>
            {subtitle}
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
            backgroundColor: gourmeatColors.primary,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 5,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '900', color: gourmeatColors.onPrimary }}>{badge}</Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '900', color: gourmeatColors.onDark }}>{totalLabel}</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: gourmeatColors.onDark }}>›</Text>
      </View>
    </Pressable>
  );
}

export function GourmeatPayButton({
  label = 'Pay Now',
  amount,
  onPress,
  disabled,
  loading,
  processingLabel = 'Processing…',
  testID = 'gourmeat-pay-btn',
}: {
  label?: string;
  amount?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  processingLabel?: string;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => ({
        backgroundColor: disabled ? gourmeatColors.textMuted : pressed ? gourmeatColors.payPressed : gourmeatColors.pay,
        borderRadius: gourmeatRadii.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        paddingVertical: 16,
        paddingHorizontal: shcSpacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: shcSpacing.sm,
        opacity: disabled ? 0.6 : 1,
        ...gourmeatShadows.soft,
      })}
    >
      <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.onDark }}>
        {loading ? processingLabel : label}
      </Text>
      {amount && !loading ? (
        <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.onDark }}>{amount}</Text>
      ) : null}
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
        borderWidth: 1,
        borderColor: gourmeatColors.border,
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
  backLabel = '← Back',
  testID,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ marginBottom: shcSpacing.md }}>
      {onBack && (
        <Pressable onPress={onBack} style={{ marginBottom: shcSpacing.sm }} testID="gourmeat-back-btn">
          <Text style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.primary }}>{backLabel}</Text>
        </Pressable>
      )}
      <Text style={{ fontSize: 28, fontWeight: '800', color: gourmeatColors.text, letterSpacing: -0.5 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 13, color: gourmeatColors.textLight, marginTop: 4, fontWeight: '500' }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function GourmeatCard({
  children,
  style,
  testID,
  appearance = 'customer',
}: {
  children: React.ReactNode;
  style?: object;
  testID?: string;
  /** Customer — 1px soft border; cook orders — neo-brutalist 2px */
  appearance?: 'customer' | 'cook';
}) {
  const isCook = appearance === 'cook';
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: gourmeatColors.surface,
        borderRadius: gourmeatRadii.lg,
        padding: shcSpacing.md,
        marginBottom: shcSpacing.sm,
        borderWidth: isCook ? shcBorders.brutal : 1,
        borderColor: isCook ? shcColors.border : gourmeatColors.border,
        ...(isCook ? shcShadows.brutalSm : gourmeatShadows.card),
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
  testID,
}: {
  name: string;
  qty: number;
  price: number;
  imageUri?: string;
  testID?: string;
}) {
  const uri = imageUri || getDishImageUrl({ name });
  return (
    <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, paddingVertical: shcSpacing.sm }}>
      <View style={{ width: 56, height: 56, borderRadius: gourmeatRadii.md, overflow: 'hidden' }}>
        <SHCFoodImage uri={uri} width={56} height={56} rounded={gourmeatRadii.md} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.text }} numberOfLines={1}>
          {name}
        </Text>
        <Text style={{ fontSize: 12, color: gourmeatColors.textLight, marginTop: 2 }}>
          {qty} × S${price.toFixed(2)}
        </Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '800', color: gourmeatColors.primary }}>S${(qty * price).toFixed(2)}</Text>
    </View>
  );
}

export function GourmeatPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  testID,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  testID?: string;
  style?: object;
}) {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => ({
        backgroundColor: isOutline
          ? gourmeatColors.surface
          : disabled
            ? gourmeatColors.textMuted
            : pressed
              ? gourmeatColors.primaryDark
              : gourmeatColors.primary,
        borderRadius: gourmeatRadii.md,
        paddingVertical: 14,
        paddingHorizontal: shcSpacing.lg,
        alignItems: 'center',
        borderWidth: isOutline ? 1 : 0,
        borderColor: gourmeatColors.border,
        opacity: disabled ? 0.6 : 1,
        ...gourmeatShadows.soft,
        ...(style || {}),
      })}
    >
      <Text style={{ fontSize: 15, fontWeight: '800', color: isOutline ? gourmeatColors.text : gourmeatColors.onPrimary }}>
        {loading ? 'Please wait…' : label}
      </Text>
    </Pressable>
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
  addLabel = 'Add',
  addingLabel = 'Adding…',
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
  addLabel?: string;
  addingLabel?: string;
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
        style={({ pressed }) => ({
          backgroundColor: disabled ? gourmeatColors.textMuted : pressed ? gourmeatColors.primaryDark : gourmeatColors.primary,
          borderRadius: gourmeatRadii.md,
          paddingVertical: 12,
          paddingHorizontal: shcSpacing.md,
          opacity: disabled ? 0.6 : 1,
        })}
      >
        <Text style={{ fontSize: 14, fontWeight: '800', color: gourmeatColors.onPrimary }}>
          {loading ? addingLabel : addLabel}
        </Text>
      </Pressable>
    </View>
  );
}

export function GourmeatCookHeader({
  title,
  subtitle,
  badges,
  testID,
}: {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ marginBottom: shcSpacing.md }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: gourmeatColors.text, letterSpacing: -0.5 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 13, color: gourmeatColors.textLight, marginTop: 4 }}>{subtitle}</Text>
      ) : null}
      {badges ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: shcSpacing.sm }}>{badges}</View> : null}
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
        {actions ? <View style={{ paddingHorizontal: shcSpacing.sm, marginTop: -shcSpacing.xs, marginBottom: shcSpacing.sm }}>{actions}</View> : null}
      </View>
    );
  }
  return (
    <View>
      {inner}
      {actions ? <View style={{ paddingHorizontal: shcSpacing.sm, paddingBottom: shcSpacing.sm }}>{actions}</View> : null}
    </View>
  );
}

export function GourmeatEmptyState({
  title,
  body,
  ctaLabel,
  onCta,
  testID,
}: {
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ alignItems: 'center', paddingVertical: shcSpacing.xl, gap: shcSpacing.sm }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: gourmeatColors.text }}>{title}</Text>
      {body ? <Text style={{ fontSize: 13, color: gourmeatColors.textLight, textAlign: 'center' }}>{body}</Text> : null}
      {ctaLabel && onCta ? (
        <GourmeatPrimaryButton label={ctaLabel} onPress={onCta} testID="gourmeat-empty-cta" style={{ marginTop: shcSpacing.sm, minWidth: 200 }} />
      ) : null}
    </View>
  );
}