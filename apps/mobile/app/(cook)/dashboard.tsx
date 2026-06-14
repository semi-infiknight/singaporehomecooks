import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { Link } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, OrderStatusBadge, SHCSectionTitle, shcColors } from '@shc/ui';
import { useMyOrders, useRequests, useBids, useCreateBid, useAcceptBid } from '../../hooks/useOrder.js';
import { useAuth } from '../../hooks/useAuth.js';
import { getHeritageArchive } from '../../lib/api-client.js'; // for collab + heritage stub

export default function CookDashboard() {
  const { user } = useAuth();
  const { data: orders = [] } = useMyOrders('cook');
  const { data: openReqs = [] } = useRequests();
  const createBidMut = useCreateBid();
  const acceptMut = useAcceptBid();
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [collabMsg, setCollabMsg] = useState('');
  const earnings = orders.filter((o: any) => o.shc_status === 'completed').reduce((s: number, o: any) => s + Math.floor((o.total || 0) * 0.85), 0);

  // Simple collab board: bids on open requests (Phase 8)
  const handleBid = async (reqId: string) => {
    const price = parseInt(bidPrices[reqId] || '1200');
    await createBidMut.mutateAsync({ requestId: reqId, priceCents: price, message: collabMsg || 'Heritage HDB recipe interpretation ready. Flexible for your party size.' });
    setCollabMsg('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }} testID="cook-dashboard">
      <Text style={{ fontSize: 22, fontWeight: '700', color: shcColors.text }}>Cook Dashboard • {user.name}</Text>
      <Text style={{ color: shcColors.success }}>This week earnings: S${earnings || 312} (projected payout Monday • commission rule)</Text>

      <SHCCard style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600' }}>Quick Links</Text>
        <Link href="/(cook)/listings" asChild><SHCButton style={{ marginTop: 8 }}><SHCButtonText>Manage Listings &amp; Wizard (add dish)</SHCButtonText></SHCButton></Link>
        <Link href="/(cook)/orders" asChild><SHCButton><SHCButtonText>Full Orders Management</SHCButtonText></SHCButton></Link>
        <Link href="/(cook)/earnings" asChild><SHCButton variant="outline" style={{ marginTop: 6 }}><SHCButtonText>Earnings &amp; Payouts</SHCButtonText></SHCButton></Link>
        <Link href="/(cook)/compliance/index" asChild><SHCButton variant="outline" style={{ marginTop: 6 }}><SHCButtonText>Compliance Uploads (SFA/WSQ)</SHCButtonText></SHCButton></Link>
        <Link href="/(shared)/chat/SHC-2026-00001" asChild><SHCButton variant="outline" style={{ marginTop: 6 }}><SHCButtonText>Open Demo Chat</SHCButtonText></SHCButton></Link>
      </SHCCard>

      {/* Phase 8 Differentiation: Collaboration Board (bids on customer recipe requests). Accept to create order stub. SG heritage focus. */}
      <SHCSectionTitle style={{ marginTop: 16 }}>Collaboration Board (Recipe Requests &amp; Bids)</SHCSectionTitle>
      <SHCCard>
        <Text style={{ fontSize: 12, color: shcColors.textLight }}>Open customer requests (from "Request Custom Dish"). Bid with price (cents) + message. Accept on a bid (as cook) to match &amp; spin order.</Text>
        {openReqs.length === 0 && <Text style={{ marginTop: 6 }}>No open requests. Customers can post from their profile.</Text>}
        {openReqs.map((r: any) => (
          <View key={r.id} style={{ marginTop: 8, padding: 8, backgroundColor: shcColors.surface, borderRadius: 6 }} testID={`collab-req-${r.id}`}>
            <Text style={{ fontWeight: '600' }}>{r.body}</Text>
            <Text style={{ fontSize: 11 }}>Party: {r.party_size || '?'} • Budget S${r.budget_cents ? (r.budget_cents/100).toFixed(0) : '—'} • {r.date}</Text>
            <TextInput placeholder="Your bid S$ e.g. 14" value={bidPrices[r.id] || ''} onChangeText={(t) => setBidPrices(p => ({...p, [r.id]: t}))} keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#E8D5B7', padding: 4, marginVertical: 4, backgroundColor: '#fff', borderRadius: 4 }} />
            <TextInput placeholder="Message (optional, e.g. family HDB recipe)" value={collabMsg} onChangeText={setCollabMsg} style={{ borderWidth: 1, borderColor: '#E8D5B7', padding: 4, backgroundColor: '#fff', borderRadius: 4 }} />
            <SHCButton size="sm" onPress={() => handleBid(r.id)} testID={`bid-btn-${r.id}`}><SHCButtonText>Bid on this request</SHCButtonText></SHCButton>
            <SHCButton size="sm" variant="outline" onPress={() => acceptMut.mutate(r.id)} style={{ marginTop: 4 }}><SHCButtonText>(Demo) Accept a bid on this</SHCButtonText></SHCButton>
          </View>
        ))}
      </SHCCard>

      {/* Phase 8: Heritage Recipe Archive edit (permanent, published even inactive). Add family story + photo stub. Viewable on cook profile too. */}
      <SHCSectionTitle style={{ marginTop: 12 }}>My Heritage Recipe Archive (Permanent)</SHCSectionTitle>
      <SHCCard>
        <Text style={{ fontSize: 11 }}>Stories published forever for NLB/NHB path. Add from here (cook side).</Text>
        {/* Stub quick add for demo */}
        <SHCButton onPress={async () => { const mod: any = await import('../../lib/api-client.js'); if (mod.addHeritageEntry) { await mod.addHeritageEntry(user.id, { title: 'New Family Story ' + Date.now(), story: 'HDB kitchen ritual from 1970s — passed to next gen for Hari Raya & gatherings.', photo_stub: 'hdb-kitchen-stub.jpg' }); } (global as any).alert ? (global as any).alert('Heritage entry added (permanent). View on your cook profile.') : console.log('added'); }} testID="add-heritage-btn" style={{ marginTop: 6 }}><SHCButtonText>+ Add Family Story + Photo Stub (published)</SHCButtonText></SHCButton>
      </SHCCard>

      <Text style={{ marginTop: 16, fontWeight: '600', color: shcColors.primary }}>Recent Orders (state machine live)</Text>
      {orders.length === 0 && <Text>No orders. Create listings to receive paid orders.</Text>}
      {orders.slice(0, 4).map((o: any) => (
        <SHCCard key={o.id} style={{ marginVertical: 6 }}>
          <Text>{o.id} • {o.items?.[0]?.name} • S${o.total}</Text>
          <OrderStatusBadge status={o.shc_status} />
          <Text style={{ fontSize: 12 }}>{o.collection_date} {o.collection_slot}</Text>
          <Link href={`/(cook)/orders/${o.id}` as any}><Text style={{ color: shcColors.primary, marginTop: 4 }}>Manage →</Text></Link>
        </SHCCard>
      ))}

      <Text style={{ marginTop: 16, fontSize: 12, color: shcColors.textLight }}>Compliance docs verified (stub). Toggle availability in listings. SFA/WSQ required for accept per rules.</Text>
    </ScrollView>
  );
}
