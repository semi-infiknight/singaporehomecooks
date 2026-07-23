// Gourmeat food-app UI (Orbix Studio / Behance) — customer discover, cart, checkout.
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Image } from 'react-native';
import { gourmeatColors, gourmeatLayout, gourmeatRadii, gourmeatShadows, shcSpacing, contentPadForTabBar, contentPadForStickyFooter, contentPadSafe } from './theme';

export { gourmeatLayout, contentPadForTabBar, contentPadForStickyFooter, contentPadSafe };
import { SHCIcon, type SHCTabIconKey } from './icons';
import { SHCOrdersTabCookingIcon } from './orders-tab-cue';
import { SHCFoodImage } from './visuals';
import { SHCSharedDishImage, SharedDishNavSurface } from './family-values-ui';
import { SHCFavoriteButton } from './delivery-ux';
import { getDishImageUrl } from '@shc/utils';
import type { SHCDishCardData } from './domain';
import type { SHCBottomTab } from './primitives';
import { EmptyIllustration } from './empty-illustrations';

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
  edgeInset = true,
  testID = 'gourmeat-home-header',
}: {
  headline?: string;
  locationLabel?: string;
  locationHint?: string;
  avatarUri?: string;
  onLocationPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  /** When false, parent already applies horizontal padding (e.g. FlashList content). */
  edgeInset?: boolean;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ paddingHorizontal: edgeInset ? shcSpacing.md : 0, paddingBottom: shcSpacing.sm }}>
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
  marginBottom = shcSpacing.md,
  edgeInset = true,
  testID = 'search-input',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
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
      {categories.map((cat) => {
        const active = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id || 'all'}
            onPress={() => onSelect(cat.id)}
            testID={`gourmeat-cat-${cat.id || 'all'}`}
            style={{ alignItems: 'center', width: 72 }}
          >
            <GourmeatCategoryCircle cat={cat} active={active} />
            <Text
              style={{
                marginTop: gap,
                fontSize: 11,
                lineHeight: 14,
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
      style={{ marginTop: gap, marginBottom: gap }}
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
            borderWidth: 3,
            borderColor: gourmeatColors.borderDark,
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
                borderWidth: 2,
                borderColor: gourmeatColors.borderDark,
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
                borderWidth: 2,
                borderColor: gourmeatColors.borderDark,
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