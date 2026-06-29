'use client';

import { useState } from 'react';
import { SHCButton, SHCCard, SHCPageHeader, SHCBadge } from '../components/SHCWebComponents';

const API_BASE = process.env.NEXT_PUBLIC_SHC_API_BASE || 'http://localhost:9000';
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

const COOK_TRANSITIONS = ['accepted', 'preparing', 'ready_for_collection', 'collected', 'completed'] as const;

export default function CookPortal() {
  const [email, setEmail] = useState('rose@shc.local');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busyOrder, setBusyOrder] = useState<string | null>(null);

  async function loadOrders(cookToken: string) {
    const orderRes = await fetch(`${API_BASE}/store/shc/orders?role=cook`, {
      headers: { Authorization: `Bearer ${cookToken}`, 'x-publishable-api-key': PUB_KEY },
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData?.error?.message || 'Failed to load orders');
    setOrders(orderData.orders || []);
  }

  async function login() {
    setError('');
    const res = await fetch(`${API_BASE}/store/shc/auth/cook/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUB_KEY },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || 'Cook login failed');
      return;
    }
    setToken(data.token);
    await loadOrders(data.token);
  }

  async function transition(orderId: string, to: string) {
    if (!token) return;
    setBusyOrder(orderId);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/store/shc/orders/${encodeURIComponent(orderId)}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-publishable-api-key': PUB_KEY,
        },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `Transition to ${to} failed`);
      await loadOrders(token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <SHCPageHeader
        title="Cook Portal"
        subtitle="Web fallback for cooks — review orders and advance status while mobile remains primary."
      />
      <SHCCard className="mt-6 p-6 space-y-4">
        {!token ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border-2 border-[#241812] px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cook@example.com" />
              <input className="rounded-xl border-2 border-[#241812] px-4 py-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            </div>
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            <SHCButton onClick={login}>Sign in as cook</SHCButton>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Orders</h2>
              <SHCButton size="sm" variant="outline" onClick={() => loadOrders(token)}>
                Refresh
              </SHCButton>
            </div>
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            {orders.length === 0 && <p className="text-sm text-[#5C5144]">No cook orders yet.</p>}
            {orders.map((order) => {
              const status = order.shc_status || order.status;
              const next = COOK_TRANSITIONS[COOK_TRANSITIONS.indexOf(status as typeof COOK_TRANSITIONS[number]) + 1];
              return (
                <div key={order.id} className="rounded-xl border-2 border-[#241812] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black">{order.id}</p>
                    <SHCBadge variant={status === 'completed' ? 'success' : 'warning'}>{status}</SHCBadge>
                  </div>
                  <p className="mt-2 text-sm text-[#5C5144]">
                    {order.collection_date} {order.collection_slot}
                  </p>
                  <p className="mt-1 text-sm text-[#5C5144]">
                    {order.items?.map((item: any) => `${item.qty}x ${item.name}`).join(', ') || 'Order details pending'}
                  </p>
                  {next && (
                    <SHCButton
                      className="mt-3"
                      size="sm"
                      disabled={busyOrder === order.id}
                      onClick={() => transition(order.id, next)}
                    >
                      {busyOrder === order.id ? 'Updating…' : `Mark ${next.replace(/_/g, ' ')}`}
                    </SHCButton>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SHCCard>
    </div>
  );
}
