'use client';

/**
 * Cook: Post / manage Cooking soon batches.
 */
import { useState } from 'react';
import {
  defaultCookDateTomorrow,
  defaultOrderByTonight,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useCreateDrop, useMyDrops, usePatchDrop } from '../../../lib/useCookPortal';
import { GourmeatCookHeader, SHCBadge, SHCButton, SHCCard } from '../../components/SHCWebComponents';

export default function CookBatchesPage() {
  const { user } = useCookAuth();
  const { data: drops = [], isLoading } = useMyDrops();
  const createMut = useCreateDrop();
  const patchMut = usePatchDrop();
  const [form, setForm] = useState({
    title: '',
    note: '',
    price: '1.20',
    min_qty: '10',
    max_qty: '40',
    cook_date: defaultCookDateTomorrow(),
    collection_slot: '18:00-19:00',
    order_by: defaultOrderByTonight(10),
  });
  const [error, setError] = useState('');

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createMut.mutateAsync({
        title: form.title.trim(),
        note: form.note.trim() || undefined,
        price: Number(form.price),
        min_qty: Number(form.min_qty) || 0,
        max_qty: Number(form.max_qty) || 1,
        cook_date: form.cook_date,
        collection_slot: form.collection_slot,
        order_by: new Date(form.order_by).toISOString(),
        visibility: 'marketplace',
      });
      setForm((f) => ({ ...f, title: '', note: '' }));
    } catch (err: any) {
      setError(err?.message || 'Could not post batch');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4" data-testid="cook-batches-page">
      <GourmeatCookHeader
        title="Cooking soon"
        subtitle={`${user?.name || 'Kitchen'} · Post a batch customers can join`}
        testID="cook-batches-hero"
      />

      <SHCCard className="mb-6 p-5">
        <h2 className="font-black">Post a batch</h2>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          e.g. frying samosas tomorrow — set max trays, order-by deadline, collection window.
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onCreate}>
          <input
            className="rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold sm:col-span-2"
            placeholder="Dish name (e.g. Samosas)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            data-testid="batch-title"
          />
          <input
            className="rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold sm:col-span-2"
            placeholder="Note (chutney, mild spice…)"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            data-testid="batch-note"
          />
          <label className="text-xs font-bold">
            Price (S$)
            <input
              type="number"
              step="0.10"
              min="0.5"
              className="mt-1 w-full rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              data-testid="batch-price"
            />
          </label>
          <label className="text-xs font-bold">
            Max qty
            <input
              type="number"
              min="1"
              className="mt-1 w-full rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
              value={form.max_qty}
              onChange={(e) => setForm((f) => ({ ...f, max_qty: e.target.value }))}
              data-testid="batch-max"
            />
          </label>
          <label className="text-xs font-bold">
            Min to fire
            <input
              type="number"
              min="0"
              className="mt-1 w-full rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
              value={form.min_qty}
              onChange={(e) => setForm((f) => ({ ...f, min_qty: e.target.value }))}
              data-testid="batch-min"
            />
          </label>
          <label className="text-xs font-bold">
            Cook / collect date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
              value={form.cook_date}
              onChange={(e) => setForm((f) => ({ ...f, cook_date: e.target.value }))}
              data-testid="batch-date"
            />
          </label>
          <label className="text-xs font-bold">
            Collection window
            <input
              className="mt-1 w-full rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
              value={form.collection_slot}
              onChange={(e) => setForm((f) => ({ ...f, collection_slot: e.target.value }))}
              data-testid="batch-slot"
            />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Order by (local)
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border-2 border-[var(--shc-border-brutal)] px-3 py-2 text-sm font-semibold"
              value={form.order_by.slice(0, 16)}
              onChange={(e) => setForm((f) => ({ ...f, order_by: e.target.value }))}
              data-testid="batch-order-by"
            />
          </label>
          {error && <p className="text-sm font-bold text-red-700 sm:col-span-2">{error}</p>}
          <SHCButton type="submit" disabled={createMut.isPending} testID="batch-submit" className="sm:col-span-2">
            {createMut.isPending ? 'Posting…' : 'Post to marketplace'}
          </SHCButton>
        </form>
      </SHCCard>

      <h2 className="mb-3 font-black">My batches</h2>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="space-y-3" data-testid="cook-batches-list">
        {(drops as any[]).length === 0 && !isLoading && (
          <p className="text-sm font-semibold text-muted-foreground">No batches yet — post one above.</p>
        )}
        {(drops as any[]).map((d) => (
          <SHCCard key={d.id} className="p-4" data-testid={`cook-batch-${d.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-black">{d.title}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {formatDropCookDate(d.cook_date)} · {d.collection_slot} · order by{' '}
                  {formatDropOrderBy(d.order_by)}
                </p>
                <p className="mt-1 text-sm font-extrabold text-primary">
                  {formatDropPrice(d.price_cents, d.price)} · {d.ordered_qty}/{d.max_qty} ordered
                  {d.remaining_qty != null ? ` · ${d.remaining_qty} left` : ''}
                </p>
              </div>
              <SHCBadge variant={d.status === 'open' ? 'success' : 'warning'}>
                {String(d.status).replace(/_/g, ' ')}
              </SHCBadge>
            </div>
            {d.status === 'open' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <SHCButton
                  size="sm"
                  variant="outline"
                  disabled={patchMut.isPending}
                  onClick={() => patchMut.mutate({ id: d.id, input: { status: 'paused' } })}
                >
                  Pause
                </SHCButton>
                <SHCButton
                  size="sm"
                  variant="outline"
                  disabled={patchMut.isPending}
                  onClick={() => patchMut.mutate({ id: d.id, input: { status: 'closed' } })}
                >
                  End early
                </SHCButton>
              </div>
            )}
            {d.status === 'paused' && (
              <SHCButton
                size="sm"
                className="mt-3"
                variant="outline"
                disabled={patchMut.isPending}
                onClick={() => patchMut.mutate({ id: d.id, input: { status: 'open' } })}
              >
                Resume
              </SHCButton>
            )}
          </SHCCard>
        ))}
      </div>
    </div>
  );
}
