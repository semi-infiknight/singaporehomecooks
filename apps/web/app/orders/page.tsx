'use client';
import Link from 'next/link';
import { useOrders } from '../../lib/useOrder';
import { useAuth } from '../../lib/useAuth';
import { SHCCard, SHCBadge } from '../components/SHCWebComponents';

export default function OrdersList() {
  const { user } = useAuth();
  const role = user.role;
  const { data: orders = [] } = useOrders(role as any);
  return (
    <div>
      <h1 className="text-2xl font-semibold">My Orders ({role})</h1>
      <p className="text-xs mb-3">Same data source as mobile. Use /orders/[id] for track+chat.</p>
      {orders.length === 0 && <p>No orders. Complete a checkout flow first.</p>}
      {(orders||[]).map((o:any) => (
        <SHCCard key={o.id} className="mb-2">
          <Link href={`/orders/${o.id}`} className="block">
            <div className="font-medium">{o.id} • {o.shc_status} • S${o.total}</div>
            <div className="text-sm">{o.collection_date} {o.collection_slot} • {o.items?.[0]?.name}</div>
          </Link>
          <SHCBadge>{o.shc_status}</SHCBadge>
        </SHCCard>
      ))}
      <Link href="/cook-portal">Cook dashboard →</Link>
    </div>
  );
}
