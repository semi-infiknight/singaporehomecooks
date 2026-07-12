'use client';

/**
 * Ops / Admin dashboard — monitor customer + cook marketplace activity,
 * manage catalog presets (categories), feature flags, disputes, payouts.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { resolveRailwayMedusaBase, getOrderStatusLabel } from '@shc/utils';
import { SHCButton, SHCCard, SHCPageHeader, SHCBadge } from '../components/SHCWebComponents';

const API_BASE = resolveRailwayMedusaBase(process.env.NEXT_PUBLIC_SHC_API_BASE);
const OPS_TOKEN_KEY = 'shc_ops_admin_token';

type Tab = 'overview' | 'orders' | 'catalog' | 'controls';

function readOpsToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(OPS_TOKEN_KEY);
}

async function fetchJson(path: string, init?: RequestInit) {
  const token = readOpsToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || body?.message || `HTTP ${res.status}`);
  return body;
}

export default function OpsDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [adminEmail, setAdminEmail] = useState('admin@shc.local');
  const [adminPass, setAdminPass] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [cookExpenses, setCookExpenses] = useState<any[]>([]);
  const [searchSynonyms, setSearchSynonyms] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busyFlag, setBusyFlag] = useState<string | null>(null);
  const [busyDispute, setBusyDispute] = useState<string | null>(null);
  const [busyPayout, setBusyPayout] = useState<string | null>(null);
  const [busyCat, setBusyCat] = useState(false);
  const [catForm, setCatForm] = useState({ id: '', label: '', imageUrl: '', sort_order: 60 });
  const [loading, setLoading] = useState(true);

  const loadCore = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [
        healthRes,
        overviewRes,
        ordersRes,
        catRes,
        ledgerRes,
        payoutRes,
        flagRes,
        disputeRes,
        commissionRes,
        expenseRes,
        synonymRes,
        statRes,
      ] = await Promise.all([
        fetchJson('/admin/shc/health').catch(() => ({ status: 'unknown' })),
        fetchJson('/admin/shc/overview').catch(() => null),
        fetchJson('/admin/shc/orders?limit=80').catch(() => ({ orders: [] })),
        fetchJson('/admin/shc/categories').catch(() => ({ categories: [] })),
        fetchJson('/admin/shc/ledger').catch(() => ({ entries: [] })),
        fetchJson('/admin/shc/payouts').catch(() => ({ batches: [] })),
        fetchJson('/admin/shc/feature-flags').catch(() => ({ flags: [] })),
        fetchJson('/admin/shc/disputes?status=open').catch(() => ({ disputes: [] })),
        fetchJson('/admin/shc/commission-rules').catch(() => ({ rules: [] })),
        fetchJson('/admin/shc/cook-expenses').catch(() => ({ expenses: [] })),
        fetchJson('/admin/shc/search-synonyms').catch(() => ({ synonyms: [] })),
        fetchJson('/admin/shc/platform-stats').catch(() => ({ stats: [] })),
      ]);
      setHealth(healthRes);
      setOverview(overviewRes?.overview || null);
      setOrders(ordersRes.orders || []);
      setCategories(catRes.categories || []);
      setLedger(ledgerRes.entries || ledgerRes.ledger || []);
      setPayouts(payoutRes.payouts || payoutRes.batches || []);
      setFlags(flagRes.flags || []);
      setDisputes(disputeRes.disputes || []);
      setCommissionRules(commissionRes.rules || []);
      setCookExpenses(expenseRes.expenses || []);
      setSearchSynonyms(synonymRes.synonyms || []);
      setPlatformStats(statRes.stats || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (readOpsToken()) {
      setAuthed(true);
      loadCore();
    }
  }, [loadCore]);

  async function loginAdmin(e: React.FormEvent) {
    e.preventDefault();
    setLoginBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/user/emailpass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPass }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.token) {
        throw new Error(body?.message || body?.error?.message || `Login failed (${res.status})`);
      }
      sessionStorage.setItem(OPS_TOKEN_KEY, body.token);
      setAuthed(true);
      setAdminPass('');
      await loadCore();
    } catch (err) {
      setError((err as Error).message);
      setAuthed(false);
    } finally {
      setLoginBusy(false);
    }
  }

  function logoutAdmin() {
    sessionStorage.removeItem(OPS_TOKEN_KEY);
    setAuthed(false);
    setOrders([]);
    setOverview(null);
  }

  const filteredOrders = useMemo(() => {
    if (!orderStatusFilter) return orders;
    return orders.filter((o) => String(o.shc_status) === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const statusOptions = useMemo(() => {
    const set = new Set(orders.map((o) => String(o.shc_status || 'unknown')));
    return Array.from(set).sort();
  }, [orders]);

  async function toggleFlag(flag: any) {
    setBusyFlag(flag.key);
    setError('');
    try {
      await fetchJson('/admin/shc/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: flag.key,
          enabled: !flag.enabled,
          cohort_filter: flag.cohort_filter || {},
        }),
      });
      await loadCore();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyFlag(null);
    }
  }

  async function resolveDispute(dispute: any) {
    setBusyDispute(dispute.id);
    setError('');
    try {
      await fetchJson(`/admin/shc/disputes/${encodeURIComponent(dispute.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolution: 'Resolved by ops from launch dashboard.',
        }),
      });
      await loadCore();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyDispute(null);
    }
  }

  async function approvePayout(batch: any) {
    setBusyPayout(batch.id);
    setError('');
    try {
      await fetchJson(`/admin/shc/payouts/${encodeURIComponent(batch.id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'ops-dashboard' }),
      });
      await loadCore();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyPayout(null);
    }
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catForm.id.trim() || !catForm.label.trim()) return;
    setBusyCat(true);
    setError('');
    try {
      await fetchJson('/admin/shc/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: catForm.id.trim(),
          label: catForm.label.trim(),
          imageUrl: catForm.imageUrl.trim(),
          sort_order: Number(catForm.sort_order) || 60,
          enabled: true,
        }),
      });
      setCatForm({ id: '', label: '', imageUrl: '', sort_order: 60 });
      await loadCore();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyCat(false);
    }
  }

  async function toggleCategory(cat: any) {
    setBusyCat(true);
    setError('');
    try {
      await fetchJson('/admin/shc/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cat.id,
          label: cat.label,
          imageUrl: cat.imageUrl || '',
          sort_order: cat.sort_order,
          enabled: !cat.enabled,
        }),
      });
      await loadCore();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyCat(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm(`Remove category “${id}” from browse presets?`)) return;
    setBusyCat(true);
    setError('');
    try {
      await fetchJson(`/admin/shc/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadCore();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyCat(false);
    }
  }

  const ov = overview || {};
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'controls', label: 'Controls' },
  ];

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16" data-testid="ops-login">
        <SHCPageHeader title="Admin / Ops" subtitle="Sign in with Medusa admin to monitor the marketplace." />
        <SHCCard className="mt-6 p-5">
          <form className="space-y-3" onSubmit={loginAdmin}>
            <label className="block text-xs font-bold text-muted-foreground">Admin email</label>
            <input
              className="w-full rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              autoComplete="username"
              data-testid="ops-login-email"
            />
            <label className="block text-xs font-bold text-muted-foreground">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              autoComplete="current-password"
              data-testid="ops-login-password"
              required
            />
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            <SHCButton type="submit" disabled={loginBusy} testID="ops-login-submit" className="w-full">
              {loginBusy ? 'Signing in…' : 'Sign in'}
            </SHCButton>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">Demo: admin@shc.local · supersecret</p>
        </SHCCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" data-testid="ops-dashboard">
      <SHCPageHeader
        title="Admin / Ops"
        subtitle="Monitor customer & cook apps · live orders · catalog presets · launch controls"
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted-foreground">API: {API_BASE}</p>
        <div className="flex gap-2">
          <Link href="/" className="text-sm font-bold text-primary underline">
            Customer app
          </Link>
          <Link href="/cook-portal" className="text-sm font-bold text-primary underline">
            Cook portal
          </Link>
          <SHCButton size="sm" variant="outline" onClick={logoutAdmin} testID="ops-logout">
            Log out
          </SHCButton>
          <SHCButton size="sm" onClick={loadCore} disabled={loading} testID="ops-refresh">
            {loading ? 'Loading…' : 'Refresh'}
          </SHCButton>
        </div>
      </div>
      {error && (
        <p className="mt-4 rounded-xl border-2 border-red-700 bg-red-50 p-3 text-sm font-bold text-red-700" data-testid="ops-error">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-b-2 border-[var(--shc-border-brutal)]/30 pb-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            data-testid={`ops-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-extrabold transition-colors ${
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border-2 border-[var(--shc-border-brutal)] text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="mt-6 space-y-6" data-testid="ops-panel-overview">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SHCCard className="p-5" data-testid="ops-kpi-active-orders">
              <p className="text-xs font-black uppercase text-muted-foreground">Active orders</p>
              <p className="mt-1 text-3xl font-black">{ov.orders_active ?? '—'}</p>
              <p className="text-xs text-muted-foreground">paid → ready_for_collection</p>
            </SHCCard>
            <SHCCard className="p-5">
              <p className="text-xs font-black uppercase text-muted-foreground">GMV (sample)</p>
              <p className="mt-1 text-3xl font-black">
                S${((ov.gmv_cents_sample || 0) / 100).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">recent {ov.orders_total_sample ?? orders.length} orders</p>
            </SHCCard>
            <SHCCard className="p-5">
              <p className="text-xs font-black uppercase text-muted-foreground">Cooks</p>
              <p className="mt-1 text-3xl font-black">{ov.cooks_active ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{ov.cooks_pending ?? 0} pending verification</p>
            </SHCCard>
            <SHCCard className="p-5">
              <p className="text-xs font-black uppercase text-muted-foreground">Open issues</p>
              <p className="mt-1 text-3xl font-black">
                {(ov.open_disputes ?? disputes.length) + (ov.open_requests ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {ov.open_disputes ?? disputes.length} disputes · {ov.open_requests ?? 0} collab requests
              </p>
            </SHCCard>
          </div>

          <SHCCard className="p-5">
            <h2 className="font-black">Orders by status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(ov.orders_by_status || {}).length === 0 ? (
                <p className="text-sm text-muted-foreground">No status breakdown yet.</p>
              ) : (
                Object.entries(ov.orders_by_status || {}).map(([status, n]) => (
                  <button
                    key={status}
                    type="button"
                    className="rounded-lg border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2 text-left"
                    onClick={() => {
                      setOrderStatusFilter(status);
                      setTab('orders');
                    }}
                  >
                    <span className="text-xs font-bold text-muted-foreground">{getOrderStatusLabel(status)}</span>
                    <p className="text-lg font-black">{n as number}</p>
                  </button>
                ))
              )}
            </div>
          </SHCCard>

          <SHCCard className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-black">Recent marketplace activity</h2>
              <SHCButton size="sm" variant="outline" onClick={() => setTab('orders')}>
                Full order board
              </SHCButton>
            </div>
            <div className="mt-3 space-y-2">
              {(overview?.recent_orders || orders.slice(0, 8)).map((o: any) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-sm font-black">{o.id}</p>
                    <p className="text-xs text-muted-foreground">
                      cook {o.cook_id || '—'} · {o.collection_date || 'no date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SHCBadge variant="default">{getOrderStatusLabel(String(o.shc_status || ''))}</SHCBadge>
                    <span className="text-sm font-extrabold text-primary">S${o.total ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </SHCCard>

          <SHCCard className="p-5">
            <h2 className="font-black">System health</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {health?.status || health?.ok ? 'API OK' : 'Unknown'} · service {health?.service || 'admin-shc'}
            </p>
          </SHCCard>
        </div>
      )}

      {/* ── Orders ── */}
      {tab === 'orders' && (
        <div className="mt-6 space-y-4" data-testid="ops-panel-orders">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold">
              Live orders ({filteredOrders.length}
              {orderStatusFilter ? ` · ${orderStatusFilter}` : ''})
            </p>
            <select
              className="rounded-lg border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2 text-sm font-bold"
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              data-testid="ops-order-status-filter"
            >
              <option value="">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {getOrderStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Cross-app feed: customer checkout + cook fulfilment. Use for tracking what is happening right now.
          </p>
          <div className="space-y-2" data-testid="ops-orders-list">
            {filteredOrders.length === 0 ? (
              <SHCCard className="p-5">
                <p className="text-sm font-semibold text-muted-foreground">No orders match this filter.</p>
              </SHCCard>
            ) : (
              filteredOrders.map((o) => (
                <SHCCard key={o.id} className="p-4" data-testid={`ops-order-${o.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-black">{o.id}</p>
                      <p className="mt-1 text-sm font-semibold">{o.item_summary || '—'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cook: <span className="font-mono">{o.cook_id || '—'}</span>
                        {' · '}
                        Customer: <span className="font-mono">{o.customer_id || '—'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Collection {o.collection_date || '—'} {o.collection_slot || ''}
                        {o.paynow_reference ? ` · PayNow ${o.paynow_reference}` : ''}
                        {o.is_corporate ? ' · Corporate' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <SHCBadge variant="default">{getOrderStatusLabel(String(o.shc_status || ''))}</SHCBadge>
                      <p className="mt-2 text-lg font-black text-primary">S${o.total ?? 0}</p>
                    </div>
                  </div>
                </SHCCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Catalog ── */}
      {tab === 'catalog' && (
        <div className="mt-6 space-y-6" data-testid="ops-panel-catalog">
          <SHCCard className="p-5">
            <h2 className="font-black">Browse categories</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preset cuisine chips on Discover (not set by cooks). Changes apply via{' '}
              <code className="text-xs">GET /store/shc/categories</code>.
            </p>
            <form className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" onSubmit={saveCategory}>
              <input
                className="rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
                placeholder="id (e.g. Korean)"
                value={catForm.id}
                onChange={(e) => setCatForm((f) => ({ ...f, id: e.target.value }))}
                data-testid="ops-cat-id"
                required
              />
              <input
                className="rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
                placeholder="Label (e.g. Korean)"
                value={catForm.label}
                onChange={(e) => setCatForm((f) => ({ ...f, label: e.target.value }))}
                data-testid="ops-cat-label"
                required
              />
              <input
                className="rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
                placeholder="Image URL (optional)"
                value={catForm.imageUrl}
                onChange={(e) => setCatForm((f) => ({ ...f, imageUrl: e.target.value }))}
                data-testid="ops-cat-image"
              />
              <SHCButton type="submit" disabled={busyCat} testID="ops-cat-save">
                {busyCat ? 'Saving…' : 'Add / update'}
              </SHCButton>
            </form>
          </SHCCard>

          <div className="grid gap-3 sm:grid-cols-2" data-testid="ops-categories-list">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories — defaults will show until you save one.</p>
            ) : (
              categories.map((cat) => (
                <SHCCard key={cat.id} className="p-4" data-testid={`ops-cat-${cat.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black">{cat.label}</p>
                      <p className="font-mono text-xs text-muted-foreground">id={cat.id}</p>
                      <p className="text-xs text-muted-foreground">sort {cat.sort_order}</p>
                    </div>
                    <SHCBadge variant={cat.enabled ? 'success' : 'warning'}>
                      {cat.enabled ? 'on' : 'off'}
                    </SHCBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SHCButton size="sm" variant="outline" disabled={busyCat} onClick={() => toggleCategory(cat)}>
                      {cat.enabled ? 'Disable' : 'Enable'}
                    </SHCButton>
                    <SHCButton size="sm" variant="outline" disabled={busyCat} onClick={() => deleteCategory(cat.id)}>
                      Delete
                    </SHCButton>
                    <SHCButton
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCatForm({
                          id: cat.id,
                          label: cat.label,
                          imageUrl: cat.imageUrl || '',
                          sort_order: cat.sort_order || 60,
                        })
                      }
                    >
                      Edit
                    </SHCButton>
                  </div>
                </SHCCard>
              ))
            )}
          </div>

          <SHCCard className="p-5">
            <h2 className="font-black">Other admin presets</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-muted-foreground">
              <li>Search synonyms — Controls tab / Search Ops API</li>
              <li>Commission % — Controls tab</li>
              <li>Feature flags (request dish, tiffin, etc.) — Controls tab</li>
              <li>Platform stats counters — Controls tab</li>
            </ul>
          </SHCCard>
        </div>
      )}

      {/* ── Controls ── */}
      {tab === 'controls' && (
        <div className="mt-6 space-y-6" data-testid="ops-panel-controls">
          <div className="grid gap-4 md:grid-cols-4">
            <SHCCard className="p-5">
              <h2 className="font-black">Ledger</h2>
              <p className="mt-2 text-3xl font-black">{ledger.length}</p>
              <p className="text-sm text-muted-foreground">recent entries</p>
            </SHCCard>
            <SHCCard className="p-5">
              <h2 className="font-black">Payouts</h2>
              <p className="mt-2 text-3xl font-black">{payouts.length}</p>
            </SHCCard>
            <SHCCard className="p-5">
              <h2 className="font-black">Flags</h2>
              <p className="mt-2 text-3xl font-black">{flags.length}</p>
            </SHCCard>
            <SHCCard className="p-5">
              <h2 className="font-black">Disputes</h2>
              <p className="mt-2 text-3xl font-black">{disputes.length}</p>
            </SHCCard>
          </div>

          <SHCCard className="p-5">
            <h2 className="font-black">Launch Gates</h2>
            <p className="mt-1 text-sm text-muted-foreground">Toggle high-risk features without redeploying.</p>
            {flags.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-muted-foreground">No feature flags yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {flags.map((flag) => (
                  <div key={flag.id || flag.key} className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-sm font-black">{flag.key}</p>
                      <SHCBadge variant={flag.enabled ? 'success' : 'warning'}>
                        {flag.enabled ? 'on' : 'off'}
                      </SHCBadge>
                    </div>
                    <SHCButton
                      className="mt-3"
                      size="sm"
                      variant={flag.enabled ? 'outline' : 'primary'}
                      disabled={busyFlag === flag.key}
                      onClick={() => toggleFlag(flag)}
                    >
                      {busyFlag === flag.key ? 'Updating...' : flag.enabled ? 'Pause' : 'Enable'}
                    </SHCButton>
                  </div>
                ))}
              </div>
            )}
          </SHCCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SHCCard className="p-5">
              <h2 className="font-black">Open Disputes</h2>
              <div className="mt-4 space-y-3">
                {disputes.length === 0 ? (
                  <p className="text-sm font-semibold text-muted-foreground">No open disputes.</p>
                ) : (
                  disputes.slice(0, 8).map((dispute) => (
                    <div key={dispute.id} className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3">
                      <p className="font-mono text-sm font-black">{dispute.order_id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {dispute.type} · {dispute.raised_by}
                      </p>
                      <SHCButton
                        className="mt-3"
                        size="sm"
                        variant="outline"
                        disabled={busyDispute === dispute.id}
                        onClick={() => resolveDispute(dispute)}
                      >
                        {busyDispute === dispute.id ? 'Resolving...' : 'Mark resolved'}
                      </SHCButton>
                    </div>
                  ))
                )}
              </div>
            </SHCCard>

            <SHCCard className="p-5">
              <h2 className="font-black">Payout Queue</h2>
              {payouts.length === 0 ? (
                <p className="mt-4 text-sm font-semibold text-muted-foreground">No payout batches yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {payouts.slice(0, 6).map((batch) => (
                    <div key={batch.id} className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-sm font-black">{batch.week_start}</p>
                        <SHCBadge variant={batch.status === 'pending' ? 'warning' : 'success'}>
                          {batch.status}
                        </SHCBadge>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        S${((batch.total_cents || 0) / 100).toFixed(2)}
                      </p>
                      {batch.status === 'pending' && (
                        <SHCButton
                          className="mt-3"
                          size="sm"
                          variant="outline"
                          disabled={busyPayout === batch.id}
                          onClick={() => approvePayout(batch)}
                        >
                          {busyPayout === batch.id ? 'Approving...' : 'Approve'}
                        </SHCButton>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SHCCard>
          </div>

          <SHCCard className="p-5">
            <h2 className="font-black">Commission · Search · Stats</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3">
                <p className="text-xs font-black uppercase text-muted-foreground">Commission</p>
                {commissionRules.length === 0 ? (
                  <p className="mt-1 text-sm">No rules</p>
                ) : (
                  commissionRules.slice(0, 3).map((rule) => (
                    <p key={rule.id || rule.version} className="mt-1 text-sm font-semibold">
                      v{rule.version}: {rule.rate_pct}%
                    </p>
                  ))
                )}
              </div>
              <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3">
                <p className="text-xs font-black uppercase text-muted-foreground">Synonyms</p>
                {searchSynonyms.length === 0 ? (
                  <p className="mt-1 text-sm">None</p>
                ) : (
                  searchSynonyms.slice(0, 3).map((s) => (
                    <p key={s.id || s.term} className="mt-1 text-sm font-semibold">
                      {s.term}
                    </p>
                  ))
                )}
              </div>
              <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3">
                <p className="text-xs font-black uppercase text-muted-foreground">Platform stats</p>
                <p className="mt-1 text-sm font-semibold">{platformStats.length} keys</p>
                <p className="text-xs text-muted-foreground">{cookExpenses.length} cook expenses</p>
              </div>
            </div>
          </SHCCard>
        </div>
      )}
    </div>
  );
}
