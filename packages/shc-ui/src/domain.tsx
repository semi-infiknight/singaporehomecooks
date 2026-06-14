// Domain components per 12-shared-components.md: CookCard, OrderCard, OrderStatusBadge, PayNowPanel, CollectionSlotPicker, ListingWizardStep etc.
// Singapore taste: HDB, heritage, occasions. All components use SHC tokens + testID for Maestro.
// @ts-nocheck -- RN JSX types resolution for shared lib (consumed by Expo mobile only); runtime correct.
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { SHCCard, SHCBadge, SHCButton, SHCButtonText, SHCSectionTitle } from './primitives';
import { shcColors as colors } from './theme';

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
        style={{ borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 10, backgroundColor: '#fff' }}
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
            style={{ padding: 12, backgroundColor: isSel ? '#E6F4F0' : '#F5F0E6', borderRadius: 8, marginBottom: 6, borderWidth: isSel ? 2 : 0, borderColor: colors.primary }}
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

export function ListingWizardStep({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <SHCCard>
      <Text style={{ fontSize: 12, color: colors.primary }}>Step {step} / 4</Text>
      <SHCSectionTitle>{title}</SHCSectionTitle>
      {children}
    </SHCCard>
  );
}

export function AllergenAckCheckbox({ checked, onChange, allergens, tier1 }: { checked: boolean; onChange: (v: boolean) => void; allergens?: string[]; tier1?: string[] }) {
  const list = (tier1 || allergens || []).join(', ');
  return (
    <Pressable onPress={() => onChange(!checked)} style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 8, backgroundColor: '#FEF3C7', borderRadius: 8 }} testID="allergen-ack">
      <View style={{ width: 24, height: 24, borderWidth: 2, borderColor: colors.accent, marginRight: 8, borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: checked ? colors.accent : 'white' }}>
        {checked && <Text style={{ color: 'white', fontWeight: '700' }}>✓</Text>}
      </View>
      <Text style={{ flex: 1, color: colors.text, fontSize: 13 }}>
        ⚠️ MANDATORY ALLERGEN ACKNOWLEDGMENT (per 08-marketplace-rules): I confirm no one in my party has undisclosed allergies to: {list || 'listed ingredients'}. This protects our home cooks.
      </Text>
    </Pressable>
  );
}

// Growth + Differentiation components (Phase 7-9 Mobile): SG delight, testIDs, a11y, SHC tokens. Home Credits, requests, heritage, AI stubs.
export function CreditBadge({ balance, tier = 'Bronze', expiryMonths = 12 }: { balance: number; tier?: 'Bronze' | 'Silver' | 'Gold'; expiryMonths?: number }) {
  const tierColor = tier === 'Gold' ? '#F59E0B' : tier === 'Silver' ? '#6B7280' : '#92400E';
  return (
    <View style={{ backgroundColor: '#FEF3C7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }} testID="credit-badge" accessible accessibilityLabel={`Home Credits balance ${balance}, ${tier} tier, expires in ${expiryMonths} months`}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: shcColors.primary }}>🍃 {balance} Home Credits</Text>
      <View style={{ backgroundColor: tierColor, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{tier}</Text>
      </View>
      <Text style={{ fontSize: 10, color: colors.textLight }}>exp {expiryMonths}m</Text>
    </View>
  );
}

export function WalletCard({ balance, lifetimeSpend = 0, onRedeem, redeemable = 0 }: { balance: number; lifetimeSpend?: number; onRedeem?: (amount: number) => void; redeemable?: number }) {
  const tier = lifetimeSpend > 1200 ? 'Gold' : lifetimeSpend > 450 ? 'Silver' : 'Bronze';
  const tierLabel = lifetimeSpend > 1200 ? 'Gold (5% bonus earn)' : lifetimeSpend > 450 ? 'Silver (unlock more)' : 'Bronze — earn on every completed order';
  return (
    <SHCCard style={{ backgroundColor: '#F0FDF4' }} testID="wallet-card">
      <SHCSectionTitle>🏠 Home Credits Wallet (SG Family Feasts)</SHCSectionTitle>
      <CreditBadge balance={balance} tier={tier as any} />
      <Text style={{ marginTop: 6, fontSize: 12, color: colors.textLight }}>{tierLabel} • Lifetime spend S${lifetimeSpend} • 5% of order total earned on 'collected'</Text>
      {onRedeem && redeemable > 0 && (
        <SHCButton onPress={() => onRedeem(Math.min(redeemable, balance))} style={{ marginTop: 8, backgroundColor: '#166B52' }} testID="redeem-credits-btn">
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
    <View style={{ backgroundColor: isFull ? '#DCFCE7' : '#FEF3C7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center' }} testID="ai-calorie-badge" accessible accessibilityLabel={`Calories ${calories}, ${confidence} confidence via ${source}`}>
      <Text style={{ fontSize: 11, color: isFull ? '#15803D' : '#CA8A04', fontWeight: '600' }}>🔥 AI: ~{calories} cal ({confidence})</Text>
      <Text style={{ fontSize: 9, color: colors.textLight, marginLeft: 4 }}>• {source}</Text>
    </View>
  );
}

export function PhotoTipsModalContent({ onClose }: { onClose?: () => void }) {
  // 3 actionable SG-specific photo quality tips stub (AI assessment later)
  return (
    <SHCCard style={{ backgroundColor: '#FDF2E9' }} testID="photo-tips-card">
      <SHCSectionTitle>📸 Quick Photo Quality Tips (for listings)</SHCSectionTitle>
      <Text style={{ fontSize: 13, marginBottom: 4 }}>1. Natural HDB kitchen light (window, no flash) — shows real steam &amp; rempah colour.</Text>
      <Text style={{ fontSize: 13, marginBottom: 4 }}>2. Plate on banana leaf or traditional Peranakan bowl; include 1-2 props (cucumber, egg) for scale &amp; heritage feel.</Text>
      <Text style={{ fontSize: 13, marginBottom: 4 }}>3. Close-up of key texture (sambal gloss, buah keluak paste) + full plated hero shot. 3+ photos boost search rank.</Text>
      <Text style={{ fontSize: 10, color: colors.textLight, marginTop: 6 }}>AI will score on upload in future wave. Good photos = more orders for your Hari Raya &amp; CNY spreads.</Text>
      {onClose && <SHCButton variant="outline" onPress={onClose} style={{ marginTop: 8 }}><SHCButtonText>Got it — back to wizard</SHCButtonText></SHCButton>}
    </SHCCard>
  );
}

export function RequestDishForm({ onSubmit, onClose }: { onSubmit: (data: { description: string; youtube_url?: string; party_size?: number; budget?: number; date?: string }) => void; onClose?: () => void }) {
  // Stub form for Phase 8 Request Custom Dish (customer) — posts to shc_request. SG terms.
  const [desc, setDesc] = React.useState('Nasi lemak for 8 people, spicy, for Hari Raya open house this weekend');
  const [yt, setYt] = React.useState('');
  const [size, setSize] = React.useState(8);
  const [budget, setBudget] = React.useState(120);
  const [date, setDate] = React.useState('2026-06-28');
  return (
    <SHCCard testID="request-dish-form">
      <SHCSectionTitle>Request Custom Dish (Recipe Bidding)</SHCSectionTitle>
      <Text style={{ fontSize: 12, color: colors.textLight }}>Tell cooks your family story or YouTube inspo. They bid — accept to match.</Text>
      <TextInput value={desc} onChangeText={setDesc} multiline placeholder="Describe the dish, occasion (e.g. nasi lemak for Hari Raya...)" style={{ borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 8, marginVertical: 6, backgroundColor: '#fff', minHeight: 60 }} testID="request-desc" />
      <TextInput value={yt} onChangeText={setYt} placeholder="Optional YouTube recipe URL (e.g. for cook interpretation)" style={{ borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 8, marginBottom: 6, backgroundColor: '#fff' }} testID="request-yt" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput value={String(size)} onChangeText={t => setSize(parseInt(t)||4)} keyboardType="numeric" placeholder="Party size" style={{ flex: 1, borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 8, backgroundColor: '#fff' }} />
        <TextInput value={String(budget)} onChangeText={t => setBudget(parseInt(t)||50)} keyboardType="numeric" placeholder="Budget S$" style={{ flex: 1, borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 8, backgroundColor: '#fff' }} />
        <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" style={{ flex: 1, borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 8, backgroundColor: '#fff' }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <SHCButton onPress={() => onSubmit({ description: desc, youtube_url: yt || undefined, party_size: size, budget: Math.round(budget * 100), date })} testID="submit-request-btn"><SHCButtonText>Post Request (cooks will bid)</SHCButtonText></SHCButton>
        {onClose && <SHCButton variant="outline" onPress={onClose}><SHCButtonText>Cancel</SHCButtonText></SHCButton>}
      </View>
      <Text style={{ fontSize: 10, color: colors.textLight, marginTop: 6 }}>Mock: creates shc_request. On cook side see Collaboration Board. Matches Phase 8 differentiation.</Text>
    </SHCCard>
  );
}
