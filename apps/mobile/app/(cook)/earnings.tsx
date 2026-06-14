// Cook earnings (enhanced per Integration): uses getEarnings from mock (completed orders * 0.85 commission rule), previews everywhere.
import React from 'react';
import { Text, ScrollView } from 'react-native';
import { shcColors, SHCCard, SHCButton, SHCButtonText } from '@shc/ui';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getEarnings } from '../../lib/api-client';
import { Link } from 'expo-router';

export default function Earnings() {
  const { user } = useAuth();
  const { data: earnings = { thisWeek: 0, projectedPayout: 0, orders: 0 } } = useQuery({ queryKey: ['earnings'], queryFn: getEarnings });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: shcColors.text }}>Earnings • {user.name}</Text>
      <Text style={{ color: shcColors.textLight }}>85% of order value (commission rule enforced in @shc/business-rules). Weekly PayNow batch.</Text>

      <SHCCard style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: shcColors.success }}>S${earnings.thisWeek}</Text>
        <Text>This week (completed orders)</Text>
        <Text style={{ marginTop: 8 }}>Projected payout: S${earnings.projectedPayout} • {earnings.orders} completed orders</Text>
        <Text style={{ fontSize: 11, color: shcColors.textLight, marginTop: 6 }}>Full ledger, GST, invoices in Phase 6. Earnings preview shown in product/cart/checkout too.</Text>
      </SHCCard>

      <SHCCard style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: '600' }}>Quick actions</Text>
        <Link href="/(cook)/listings" asChild><SHCButton style={{ marginTop: 8 }}><SHCButtonText>Create more listings for earnings</SHCButtonText></SHCButton></Link>
        <Link href="/(cook)/orders" asChild><SHCButton variant="outline" style={{ marginTop: 8 }}><SHCButtonText>Manage orders to complete &amp; earn</SHCButtonText></SHCButton></Link>
      </SHCCard>

      <Text style={{ marginTop: 16, fontSize: 11, color: shcColors.textLight }}>All earnings calc live from mock-service using calculateCookEarnings(). Matches contracts.</Text>
    </ScrollView>
  );
}