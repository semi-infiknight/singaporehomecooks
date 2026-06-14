import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, SHCSectionTitle, shcColors } from '@shc/ui';
import { useCart, useClearCart } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';

// Live cart with earnings preview + one-cook enforcement from rules (already enforced in service).
export default function Cart() {
  const { data: cart = { items: [], cookId: null }, isLoading } = useCart();
  const clearMut = useClearCart();
  const router = useRouter();
  const { user } = useAuth();

  const total = (cart.items || []).reduce((s: number, i: any) => s + i.price * i.qty, 0);
  const earnings = Math.floor(total * 0.85);

  if (isLoading) return <Text style={{ padding: 16 }}>Loading cart...</Text>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: shcColors.text }}>Cart — {cart.cookId ? 'One Cook Enforced' : 'Empty'} (SG home cooks)</Text>

      {(!cart.items || cart.items.length === 0) ? (
        <SHCCard><Text>No items. Browse discovery and add heritage dishes (min qty enforced).</Text></SHCCard>
      ) : (
        <SHCCard style={{ marginVertical: 12 }}>
          {(cart.items || []).map((item: any, i: number) => (
            <Text key={i} style={{ marginBottom: 4 }}>{item.qty}x {item.name} @ S${item.price} = S${(item.qty * item.price).toFixed(2)}</Text>
          ))}
          <Text style={{ fontWeight: '700', marginTop: 10, fontSize: 16 }}>Total S${total}</Text>
          <Text style={{ color: shcColors.success }}>Cook earnings preview: S${earnings} (after 15% platform fee — see commission rule)</Text>
        </SHCCard>
      )}

      {cart.items?.length > 0 && (
        <>
          <SHCButton onPress={() => router.push('/(customer)/checkout' as any)} testID="proceed-checkout">
            <SHCButtonText>Proceed to Checkout (PayNow + Allergen Gate + Slots)</SHCButtonText>
          </SHCButton>

          <SHCButton variant="outline" onPress={() => clearMut.mutate()} style={{ marginTop: 8 }}>
            <SHCButtonText>Clear Cart</SHCButtonText>
          </SHCButton>
        </>
      )}

      <Text style={{ marginTop: 16, fontSize: 12, color: shcColors.textLight }}>Rules: one-cook per cart, min-qty, allergen ack mandatory before payment. HDB collection address released post-PayNow confirmation. See content/trust-and-safety.md + paynow-flow.md for full copy.</Text>
    </ScrollView>
  );
}
