// Domain components per 12-shared-components.md: CookCard, OrderCard, OrderStatusBadge, PayNowPanel, CollectionSlotPicker, ListingWizardStep etc.
// Singapore taste: HDB, heritage, occasions. All components use SHC tokens + testID for Maestro.
// @ts-nocheck -- RN JSX types resolution for shared lib (consumed by Expo mobile only); runtime correct.
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Switch } from 'react-native';
import { getDishImageUrl, getCookAvatarUrl, getCookKitchenHeroUrl } from '@shc/utils';
import { SHCZomatoAddButton, SHCZomatoRatingPill } from './visuals';
import { SHCIcon } from './icons';
import {
  SHCCard,
  SHCBadge,
  SHCButton,
  SHCButtonText,
  SHCSectionTitle,
} from './primitives';
import { SHCFoodImage } from './visuals';
import { SHCFavoriteButton } from './delivery-ux';
import { shcColors as colors, shcSpacing, shcRadii, shcBorders, shcShadows, shcTypography } from './theme';
import { RequestDishExperience } from './request-ux';

export type SHCDishCardData = {
  id: string;
  name: string;
  cook_name: string;
  price: number;
  rating?: number;
  cuisine?: string;
  collection_slot?: string;
  area?: string;
  image_url?: string;
  calories?: number;
  halal?: boolean;
};

/** Swiggy/Zomato-style: large food photo, minimal text, ADD chip. */
export function SHCDishCard({
  dish,
  onPress,
  onAddPress,
  compact = false,
  testID,
  isFavorite,
  onFavoritePress,
}: {
  dish: SHCDishCardData;
  onPress?: () => void;
  onAddPress?: () => void;
  compact?: boolean;
  testID?: string;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}) {
  const cardTestID = testID ?? `dish-card-${dish.id}`;
  const imageUri =
    dish.image_url || getDishImageUrl({ id: dish.id, cuisine: dish.cuisine, name: dish.name });
  const imageHeight = compact ? 128 : 168;
  const rating = dish.rating ?? 4.8;
  const handleAdd = onAddPress ?? onPress;

  return (
    <Pressable onPress={onPress} testID={cardTestID} style={{ marginBottom: shcSpacing.sm, flex: compact ? 1 : undefined }}>
      <View
        style={{
          borderRadius: shcRadii.lg,
          overflow: 'hidden',
          borderWidth: shcBorders.brutal,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          ...shcShadows.brutalSm,
        }}
      >
        <View style={{ position: 'relative' }}>
          <SHCFoodImage
            uri={imageUri}
            height={imageHeight}
            rounded={0}
            testID={`${cardTestID}-image`}
            overlay={
              <View style={{ flex: 1, justifyContent: 'space-between', padding: shcSpacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {dish.halal ? (
                    <View style={{ backgroundColor: colors.bentoMint, paddingHorizontal: 6, paddingVertical: 2, borderRadius: shcRadii.sm, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: colors.success }}>HALAL</Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {onFavoritePress ? (
                      <SHCFavoriteButton active={!!isFavorite} onPress={onFavoritePress} testID={`${cardTestID}-favorite`} />
                    ) : null}
                    <SHCZomatoRatingPill rating={rating} testID={`${cardTestID}-rating`} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', backgroundColor: 'rgba(36,24,18,0.42)', marginHorizontal: -shcSpacing.xs, marginBottom: -shcSpacing.xs, padding: shcSpacing.sm }}>
                  <View style={{ flex: 1, paddingRight: shcSpacing.xs }}>
                    <Text style={{ color: colors.onPrimary, fontWeight: '800', fontSize: compact ? 13 : 15 }} numberOfLines={2} testID={`${cardTestID}-name`}>
                      {dish.name}
                    </Text>
                    <Text style={{ ...shcTypography.mono, color: colors.accent, fontSize: 13, fontWeight: '800', marginTop: 4 }} testID={`${cardTestID}-price`}>
                      S${dish.price}
                    </Text>
                  </View>
                  <SHCZomatoAddButton onPress={handleAdd} testID={`${cardTestID}-add`} />
                </View>
              </View>
            }
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: shcSpacing.sm, paddingVertical: 6, gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textLight, flex: 1 }} numberOfLines={1} testID={`${cardTestID}-cook`}>
            {dish.cook_name}
          </Text>
          {dish.cuisine && <SHCBadge variant="heritage">{dish.cuisine}</SHCBadge>}
        </View>
      </View>
    </Pressable>
  );
}

/** Zomato-style cart / checkout page hero */
export function SHCCartPageHero({
  title = 'Your Cart',
  subtitle,
  imageUri,
  testID = 'cart-page-hero',
}: {
  title?: string;
  subtitle?: string;
  imageUri: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ marginBottom: shcSpacing.md }}>
      <View style={{ borderRadius: shcRadii.lg, overflow: 'hidden', borderWidth: shcBorders.brutal, borderColor: colors.border, ...shcShadows.brutalSm }}>
        <SHCFoodImage
          uri={imageUri}
          height={100}
          rounded={0}
          overlay={
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(36,24,18,0.45)', padding: shcSpacing.md }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.onPrimary }}>{title}</Text>
              {subtitle && <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>{subtitle}</Text>}
            </View>
          }
        />
      </View>
    </View>
  );
}

/** Zomato-style cart line with dish thumbnail */
export function SHCCartLineItem({
  name,
  qty,
  price,
  productId,
  testID,
}: {
  name: string;
  qty: number;
  price: number;
  productId?: string;
  testID?: string;
}) {
  const imageUri = getDishImageUrl({ id: productId, name });
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: shcSpacing.sm,
        gap: shcSpacing.sm,
      }}
    >
      <SHCFoodImage uri={imageUri} width={56} height={56} rounded={shcRadii.md} testID={testID ? `${testID}-image` : undefined} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: colors.text, fontSize: 14 }} numberOfLines={2}>
          {name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 2, fontWeight: '600' }}>
          {qty} × S${price.toFixed(2)}
        </Text>
      </View>
      <Text style={{ ...shcTypography.mono, fontWeight: '800', color: colors.text, fontSize: 14 }}>
        S${(qty * price).toFixed(2)}
      </Text>
    </View>
  );
}

/** Zomato-style profile hero with avatar photo */
export function SHCProfileHero({
  name,
  subtitle,
  avatarUri,
  tier,
  testID = 'profile-hero',
}: {
  name: string;
  subtitle?: string;
  avatarUri?: string;
  tier?: string;
  testID?: string;
}) {
  const uri = avatarUri || getCookAvatarUrl(undefined, name);
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: shcSpacing.md,
        marginBottom: shcSpacing.md,
        padding: shcSpacing.md,
        backgroundColor: colors.surface,
        borderRadius: shcRadii.lg,
        borderWidth: shcBorders.brutal,
        borderColor: colors.border,
        ...shcShadows.brutalSm,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          overflow: 'hidden',
          borderWidth: shcBorders.brutal,
          borderColor: colors.primary,
        }}
      >
        <SHCFoodImage uri={uri} height={64} width={64} rounded={0} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{name}</Text>
        {subtitle && <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 2 }}>{subtitle}</Text>}
        {tier && (
          <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
            <SHCBadge variant="heritage">{tier} tier</SHCBadge>
          </View>
        )}
      </View>
    </View>
  );
}

/** Cook storefront hero — full-bleed kitchen photo + overlay */
export function SHCCookStoreHero({
  name,
  area,
  rating,
  orders,
  avatarUri,
  testID = 'cook-store-hero',
}: {
  name: string;
  area?: string;
  rating?: number;
  orders?: number;
  avatarUri?: string;
  testID?: string;
}) {
  const heroUri = getCookKitchenHeroUrl(name);
  const avatar = avatarUri || getCookAvatarUrl(undefined, name);
  return (
    <View testID={testID} style={{ marginBottom: shcSpacing.md, borderRadius: shcRadii.lg, overflow: 'hidden', borderWidth: shcBorders.brutal, borderColor: colors.border, ...shcShadows.brutalSm }}>
      <SHCFoodImage
        uri={heroUri}
        height={140}
        rounded={0}
        overlay={
          <View style={{ flex: 1, backgroundColor: 'rgba(36,24,18,0.5)', padding: shcSpacing.md, justifyContent: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: shcSpacing.sm }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: colors.onPrimary }}>
                <SHCFoodImage uri={avatar} height={56} width={56} rounded={0} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.onPrimary, fontWeight: '900', fontSize: 20 }}>{name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 }}>
                  {area ? `${area} · ` : ''}HDB collection
                  {rating ? ` · ★ ${rating}` : ''}
                  {orders ? ` · ${orders}+ orders` : ''}
                </Text>
              </View>
            </View>
          </View>
        }
      />
    </View>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const v = (['paid','ready_for_collection','accepted'].includes(status) ? 'warning' : status === 'completed' || status === 'collected' ? 'success' : 'default') as any;
  return <SHCBadge variant={v}>{status.replace(/_/g, ' ')}</SHCBadge>;
}

export function CookCard({ cook, onPress }: { cook: any; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} testID="cook-card">
      <SHCCard style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{cook.display_name || cook.name}</Text>
        <Text style={{ color: colors.textLight, fontSize: 13 }}>{cook.area} • {cook.rating ? `${cook.rating}★` : ''} ({cook.orders || 0} orders)</Text>
        {cook.story && <Text style={{ color: colors.heritage, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>{cook.story.slice(0, 72)}...</Text>}
        {cook.cuisine && <Text style={{ marginTop: 4, fontSize: 11, color: colors.primary }}>{cook.cuisine}</Text>}
      </SHCCard>
    </Pressable>
  );
}

/** Zomato-style order row — dish thumbnail, status, collection meta, optional actions */
export function SHCZomatoOrderRow({
  orderId,
  dishName,
  productId,
  status,
  collectionDate,
  collectionSlot,
  total,
  qty,
  onPress,
  actions,
  testID,
}: {
  orderId: string;
  dishName?: string;
  productId?: string;
  status: string;
  collectionDate?: string;
  collectionSlot?: string;
  total?: number;
  qty?: number;
  onPress?: () => void;
  actions?: React.ReactNode;
  testID?: string;
}) {
  const imageUri = getDishImageUrl({ id: productId, name: dishName });
  const inner = (
    <View
      testID={testID ?? `order-row-${orderId}`}
      style={{
        borderRadius: shcRadii.lg,
        overflow: 'hidden',
        borderWidth: shcBorders.brutal,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        ...shcShadows.brutalSm,
        marginBottom: shcSpacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', padding: shcSpacing.sm, gap: shcSpacing.sm }}>
        <SHCFoodImage uri={imageUri} width={72} height={72} rounded={shcRadii.md} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
            <Text style={{ fontWeight: '800', fontSize: 15, color: colors.text, flex: 1 }} numberOfLines={1}>
              {dishName}
              {qty ? ` ×${qty}` : ''}
            </Text>
            <OrderStatusBadge status={status} />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textLight }}>{orderId}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {collectionDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <SHCIcon name="clock" size={11} color={colors.textLight} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textLight }}>
                  {collectionDate} {collectionSlot || ''}
                </Text>
              </View>
            )}
            {total != null && (
              <Text style={{ ...shcTypography.mono, fontSize: 12, fontWeight: '800', color: colors.primary }}>S${total}</Text>
            )}
          </View>
        </View>
      </View>
      {actions && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            paddingHorizontal: shcSpacing.sm,
            paddingBottom: shcSpacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: shcSpacing.sm,
          }}
        >
          {actions}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} testID={testID}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

export function OrderCard({ order, onPress, onAction, actionLabel }: { order: any; onPress?: () => void; onAction?: () => void; actionLabel?: string }) {
  return (
    <Pressable onPress={onPress} testID={`order-card-${order.id}`}>
      <SHCCard style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '600' }}>{order.id}</Text>
          <OrderStatusBadge status={order.shc_status || order.status} />
        </View>
        <Text style={{ marginTop: 4 }}>{order.dish || order.items?.[0]?.name} ×{order.qty || 1} • S${order.amount || order.total}</Text>
        <Text style={{ color: colors.textLight, fontSize: 12 }}>{order.collection_date} {order.collection_slot} • {order.customer || order.cook_name}</Text>
        {onAction && actionLabel && (
          <SHCButton size="sm" onPress={onAction} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <SHCButtonText>{actionLabel}</SHCButtonText>
          </SHCButton>
        )}
      </SHCCard>
    </Pressable>
  );
}

export function PayNowPanel({ orderId, total, uen = '202612345A', onConfirmPay }: { orderId: string; total: number; uen?: string; onConfirmPay: (ref: string) => void }) {
  const [ref, setRef] = useState('');
  const suggested = `${orderId}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  return (
    <SHCCard>
      <SHCSectionTitle>PayNow to Singapore Home Cooks</SHCSectionTitle>
      <Text>UEN: {uen} (Corporate)</Text>
      <Text>Amount: S${total.toFixed(2)}</Text>
      <Text style={{ color: colors.accent, marginVertical: 8 }}>Scan QR (stub) or transfer exact. Use reference below for auto-match.</Text>
      <TextInput
        placeholder={`e.g. ${suggested}`}
        value={ref}
        onChangeText={setRef}
        style={{
          borderWidth: shcBorders.brutal,
          borderColor: colors.borderLight,
          borderRadius: shcRadii.md,
          padding: shcSpacing.sm,
          backgroundColor: colors.surface,
          ...shcTypography.mono,
          color: colors.text,
        }}
        testID="paynow-ref-input"
      />
      <SHCButton
        onPress={() => onConfirmPay(ref || suggested)}
        disabled={!ref && !suggested}
        style={{ marginTop: 12 }}
        testID="confirm-paynow"
      >
        <SHCButtonText>I have paid via PayNow — Confirm</SHCButtonText>
      </SHCButton>
      <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 8 }}>Cook earnings (est): S${Math.floor(total * 0.85)} (after 15% platform). Weekly payout Mon.</Text>
    </SHCCard>
  );
}

export function CollectionSlotPicker({ availableSlots, onSelect, selected }: { availableSlots: Array<{ date: string; slot: string }>; onSelect: (d: string, s: string) => void; selected?: { date: string; slot: string } }) {
  return (
    <View testID="collection-slot-picker">
      <SHCSectionTitle>Choose Collection Date &amp; Slot (HDB / estate)</SHCSectionTitle>
      {availableSlots.length === 0 && <Text style={{ color: colors.error }}>No slots available — check cook calendar</Text>}
      {availableSlots.map((s, idx) => {
        const isSel = selected && selected.date === s.date && selected.slot === s.slot;
        return (
          <Pressable
            key={idx}
            onPress={() => onSelect(s.date, s.slot)}
            style={{ padding: 12, backgroundColor: isSel ? colors.bentoMint : colors.surfaceAlt, borderRadius: 8, marginBottom: 6, borderWidth: 2, borderColor: isSel ? colors.primary : colors.border }}
            testID={`slot-${s.date}-${s.slot}`}
          >
            <Text style={{ fontWeight: isSel ? '600' : '400' }}>{s.date} • {s.slot} (Singapore time)</Text>
            <Text style={{ fontSize: 11, color: colors.textLight }}>Collect from cook's HDB unit. Address released 2h prior.</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Zomato-style segmented wizard progress bar */
export function SHCWizardProgress({
  step,
  total = 4,
  testID = 'wizard-progress',
}: {
  step: number;
  total?: number;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ flexDirection: 'row', gap: 6, marginBottom: shcSpacing.sm }}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const active = n <= step;
        return (
          <View
            key={n}
            style={{
              flex: 1,
              height: 6,
              borderRadius: shcRadii.pill,
              backgroundColor: active ? colors.primary : colors.bentoYellow,
              borderWidth: shcBorders.brutal,
              borderColor: colors.border,
              opacity: active ? 1 : 0.55,
            }}
          />
        );
      })}
    </View>
  );
}

/** Cook portal page hero — full-bleed food photo + title overlay */
export function SHCCookPageHero({
  title,
  subtitle,
  imageUri,
  badges,
  testID,
}: {
  title: string;
  subtitle?: string;
  imageUri: string;
  badges?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ marginBottom: shcSpacing.md }}>
      <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontSize: 13, color: colors.textLight, marginTop: 4, marginBottom: shcSpacing.sm }}>{subtitle}</Text>
      )}
      <View style={{ borderRadius: shcRadii.lg, overflow: 'hidden', borderWidth: shcBorders.brutal, borderColor: colors.border, ...shcShadows.brutalSm }}>
        <SHCFoodImage
          uri={imageUri}
          height={156}
          rounded={0}
          overlay={
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(36,24,18,0.42)', padding: shcSpacing.md, gap: shcSpacing.sm }}>
              {badges}
            </View>
          }
        />
      </View>
    </View>
  );
}

export function ListingWizardStep({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <SHCCard testID={`listing-wizard-step-${step}`}>
      <Text style={{ fontSize: 12, color: colors.primary }} testID={`listing-wizard-step-label-${step}`}>Step {step} / 4 — {title}</Text>
      <SHCSectionTitle>{title}</SHCSectionTitle>
      {children}
    </SHCCard>
  );
}

export function AllergenAckCheckbox({ checked, onChange, allergens, tier1 }: { checked: boolean; onChange: (v: boolean) => void; allergens?: string[]; tier1?: string[] }) {
  const list = (tier1 || allergens || []).join(', ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: shcSpacing.sm, backgroundColor: colors.surfaceWarning, borderRadius: shcRadii.md, borderWidth: shcBorders.brutal, borderColor: colors.border }} testID="allergen-ack">
      <View testID="allergen-ack-switch" style={{ marginRight: shcSpacing.sm, padding: 4 }}>
        <Switch
          value={checked}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.surface}
          accessibilityLabel="Acknowledge allergens"
          accessibilityRole="switch"
        />
      </View>
      <Pressable onPress={() => onChange(!checked)} style={{ flex: 1 }} accessibilityRole="checkbox" accessibilityState={{ checked }}>
        <Text style={{ color: colors.text, fontSize: 13 }}>
          ⚠️ MANDATORY ALLERGEN ACKNOWLEDGMENT (per 08-marketplace-rules): I confirm no one in my party has undisclosed allergies to: {list || 'listed ingredients'}. This protects our home cooks.
        </Text>
      </Pressable>
    </View>
  );
}

// Growth + Differentiation components (Phase 7-9 Mobile): SG delight, testIDs, a11y, SHC tokens. Home Credits, requests, heritage, AI stubs.
export function CreditBadge({ balance, tier = 'Bronze', expiryMonths = 12 }: { balance: number; tier?: 'Bronze' | 'Silver' | 'Gold'; expiryMonths?: number }) {
  const tierColor = tier === 'Gold' ? colors.tierGold : tier === 'Silver' ? colors.tierSilver : colors.tierBronze;
  return (
    <View style={{ backgroundColor: colors.surfaceWarning, borderRadius: shcRadii.pill, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border }} testID="credit-badge" accessible accessibilityLabel={`Home Credits balance ${balance}, ${tier} tier, expires in ${expiryMonths} months`}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>🍃 {balance} Home Credits</Text>
      <View style={{ backgroundColor: tierColor, borderRadius: shcRadii.sm, paddingHorizontal: 6, paddingVertical: 1 }}>
        <Text style={{ color: colors.onPrimary, fontSize: 10, fontWeight: '600' }}>{tier}</Text>
      </View>
      <Text style={{ fontSize: 10, color: colors.textLight }}>exp {expiryMonths}m</Text>
    </View>
  );
}

export function WalletCard({ balance, lifetimeSpend = 0, onRedeem, redeemable = 0 }: { balance: number; lifetimeSpend?: number; onRedeem?: (amount: number) => void; redeemable?: number }) {
  const tier = lifetimeSpend > 1200 ? 'Gold' : lifetimeSpend > 450 ? 'Silver' : 'Bronze';
  const tierLabel = lifetimeSpend > 1200 ? 'Gold (5% bonus earn)' : lifetimeSpend > 450 ? 'Silver (unlock more)' : 'Bronze — earn on every completed order';
  return (
    <SHCCard variant="bento-mint" testID="wallet-card">
      <SHCSectionTitle>🏠 Home Credits Wallet (SG Family Feasts)</SHCSectionTitle>
      <CreditBadge balance={balance} tier={tier as any} />
      <Text style={{ marginTop: 6, fontSize: 12, color: colors.textLight }}>{tierLabel} • Lifetime spend S${lifetimeSpend} • 5% of order total earned on 'collected'</Text>
      {onRedeem && redeemable > 0 && (
        <SHCButton onPress={() => onRedeem(Math.min(redeemable, balance))} style={{ marginTop: 8 }} testID="redeem-credits-btn">
          <SHCButtonText>Redeem S${(Math.min(redeemable, balance) / 4).toFixed(0)} (apply {Math.min(redeemable, balance)} credits)</SHCButtonText>
        </SHCButton>
      )}
      <Text style={{ fontSize: 10, color: colors.textLight, marginTop: 4 }}>Credits = S$0.25 each. Auto/manual at checkout for Raya spreads &amp; HDB parties. 12-month expiry.</Text>
    </SHCCard>
  );
}

export function AICalorieBadge({ calories, confidence = 'category', source = 'AI stub from ingredients' }: { calories: number; confidence?: 'full' | 'category'; source?: string }) {
  const isFull = confidence === 'full';
  return (
    <View style={{ backgroundColor: isFull ? colors.surfaceSuccess : colors.surfaceWarning, borderRadius: shcRadii.sm, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border }} testID="ai-calorie-badge" accessible accessibilityLabel={`Calories ${calories}, ${confidence} confidence via ${source}`}>
      <Text style={{ fontSize: 11, color: isFull ? colors.trafficGreen : colors.trafficYellow, fontWeight: '600' }}>🔥 AI: ~{calories} cal ({confidence})</Text>
      <Text style={{ fontSize: 9, color: colors.textLight, marginLeft: 4 }}>• {source}</Text>
    </View>
  );
}

export function PhotoTipsModalContent({ onClose }: { onClose?: () => void }) {
  // 3 actionable SG-specific photo quality tips stub (AI assessment later)
  return (
    <SHCCard variant="bento-peach" style={{ backgroundColor: colors.surfaceHeritage }} testID="photo-tips-card">
      <SHCSectionTitle>📸 Quick Photo Quality Tips (for listings)</SHCSectionTitle>
      <Text style={{ fontSize: 13, marginBottom: 4 }}>1. Natural HDB kitchen light (window, no flash) — shows real steam &amp; rempah colour.</Text>
      <Text style={{ fontSize: 13, marginBottom: 4 }}>2. Plate on banana leaf or traditional Peranakan bowl; include 1-2 props (cucumber, egg) for scale &amp; heritage feel.</Text>
      <Text style={{ fontSize: 13, marginBottom: 4 }}>3. Close-up of key texture (sambal gloss, buah keluak paste) + full plated hero shot. 3+ photos boost search rank.</Text>
      <Text style={{ fontSize: 10, color: colors.textLight, marginTop: 6 }}>AI will score on upload in future wave. Good photos = more orders for your Hari Raya &amp; CNY spreads.</Text>
      {onClose && <SHCButton variant="outline" onPress={onClose} style={{ marginTop: 8 }}><SHCButtonText>Got it — back to wizard</SHCButtonText></SHCButton>}
    </SHCCard>
  );
}

/** @deprecated Use RequestDishExperience on /request route. Thin wrapper for legacy callers. */
export function RequestDishForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: { body: string; youtube_url?: string; party_size?: number; budget_cents?: number; date?: string }) => void;
  onClose?: () => void;
}) {
  return (
    <RequestDishExperience
      onSubmit={onSubmit}
      onBack={onClose}
      testID="request-dish-form"
    />
  );
}
