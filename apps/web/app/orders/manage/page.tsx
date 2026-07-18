'use client';

/**
 * Manage an upcoming order (HomelyEats):
 * Skip · Add items (extras/addons + pay) · change collection slot · instructions · success.
 */
import React, { useMemo, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  canSkipManageOrder,
  canAddItemsToOrder,
  collectionSlotOptions,
  formatSlotLabel,
  manageOrderActionLabels,
  menuUpdatedSuccessCopy,
  computeAddItemsExtraTotal,
  describeAddedExtras,
  describeAddedExtraLines,
  mergeMenuLinesWithAdd,
  formatMenuLineDisplay,
  isExtraMenuLine,
  addItemsProceedLabel,
  defaultAddItemDishFromMenu,
  dayOrderStatusChip,
  buildCustomizeDraft,
  kitchenMealExtraOptions,
  kitchenMealAddonOptions,
  kitchenMealMetaChips,
  adjustMealQty,
  toggleAddonId,
  type KitchenMealCustomizeDraft,
  type DayOrderCardStatus,
} from '@shc/utils';
import { useSkipTiffinMeal, useCustomizeTiffinMeal } from '../../../lib/useTiffin';
import { useQuery } from '@tanstack/react-query';
import { getOrderDisputes, getOrderInvoiceDownloadUrl, submitOrderDispute } from '../../../lib/api-client';
import { OrderManageSupportWeb } from '../../components/OrderManageSupportWeb';
import { SHCButton, SHCCard, SHCLoading } from '../../components/SHCWebComponents';

function ManageOrderInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const kind = (sp.get('kind') || 'one_off') as 'one_off' | 'tiffin';
  const id = sp.get('id') || '';
  const cookName = sp.get('cook') || 'Home kitchen';
  const planTitle = sp.get('title') || 'Daily meal';
  const status = (sp.get('status') || 'scheduled') as DayOrderCardStatus;
  const date = sp.get('date') || '';
  const slotParam = sp.get('slot') || '18:00-19:00';
  const menuParam = sp.get('menu') || '';
  const customizable = sp.get('customizable') !== '0';
  const menuPending = sp.get('menuPending') === '1';

  const [timeslot, setTimeslot] = useState(slotParam);
  const [instructions, setInstructions] = useState('');
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [menuLines, setMenuLines] = useState(() =>
    menuParam ? menuParam.split('|').filter(Boolean) : []
  );
  const [showAddItems, setShowAddItems] = useState(false);
  const [success, setSuccess] = useState<{ title: string; subtitle: string } | null>(null);
  const [actionError, setActionError] = useState('');
  const [draft, setDraft] = useState<KitchenMealCustomizeDraft | null>(null);
  const [skipped, setSkipped] = useState(status === 'skipped');

  const skipMut = useSkipTiffinMeal();
  const customizeMut = useCustomizeTiffinMeal();
  const effectiveStatus = skipped ? 'skipped' : status;
  const trackingOrderId = kind === 'one_off' ? id : '';
  const invoiceEnabled = trackingOrderId.length > 0 && !['skipped', 'cancelled'].includes(effectiveStatus);
  const { data: disputesRaw } = useQuery({
    queryKey: ['order-disputes', trackingOrderId],
    queryFn: () => getOrderDisputes(trackingOrderId),
    enabled: !!trackingOrderId,
  });
  const disputes = ((disputesRaw as Array<{ status?: string; type?: string; notes?: string }>) ?? []);
  const labels = manageOrderActionLabels(skipped ? 'skipped' : status);
  const chip = dayOrderStatusChip(skipped ? 'skipped' : status);

  const dish = useMemo(
    () => defaultAddItemDishFromMenu(menuLines, cookName),
    [menuLines, cookName]
  );
  const extras = useMemo(() => kitchenMealExtraOptions(dish), [dish]);
  const addons = useMemo(() => kitchenMealAddonOptions(dish), [dish]);
  const chips = useMemo(() => kitchenMealMetaChips(dish), [dish]);

  const openAddItems = () => {
    if (!canAddItemsToOrder(effectiveStatus, customizable)) return;
    setDraft(buildCustomizeDraft(dish));
    setShowAddItems(true);
  };

  const confirmAddItems = useCallback(async () => {
    if (!draft) return;
    setActionError('');
    const extraTotal = computeAddItemsExtraTotal(draft, extras, addons);
    const addedLines = describeAddedExtraLines(draft, extras, addons);
    const added = describeAddedExtras(draft, extras, addons);
    const nextLines = addedLines.length ? addedLines : added ? [added] : [];
    if (kind === 'tiffin' && date) {
      try {
        await customizeMut.mutateAsync({
          collectionDate: date,
          collectionSlot: timeslot,
          extraLines: nextLines.map((l) => (l.startsWith('extra:') ? l : `extra:${l}`)),
          amountCents: Math.round(extraTotal * 100),
          paynowRef: extraTotal > 0 ? `EXTRA-${date}` : null,
        });
      } catch (e: unknown) {
        const err = e as { message?: string };
        setActionError(err?.message || 'Could not save extras. Try again.');
        return;
      }
    }
    setMenuLines((prev) => mergeMenuLinesWithAdd(prev, nextLines.length ? nextLines : added));
    setShowAddItems(false);
    setDraft(null);
    setSuccess(menuUpdatedSuccessCopy(added));
  }, [draft, extras, addons, kind, date, timeslot, customizeMut]);

  const handleSkip = async () => {
    if (!canSkipManageOrder(effectiveStatus)) return;
    setActionError('');
    if (kind === 'tiffin' && date) {
      try {
        await skipMut.mutateAsync({ collectionDate: date, collectionSlot: timeslot });
      } catch (e: unknown) {
        const err = e as { message?: string };
        setActionError(err?.message || 'Could not skip this meal.');
        return;
      }
    }
    setSkipped(true);
  };

  if (success) {
    return (
      <div
        className="max-w-md mx-auto min-h-[70vh] flex flex-col items-center justify-center px-6 text-center"
        data-testid="order-menu-updated-screen"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 text-4xl">
          ✓
        </div>
        <h1 className="text-2xl font-black mb-2">{success.title}</h1>
        <p className="text-sm font-semibold text-muted-foreground mb-8">{success.subtitle}</p>
        <SHCButton
          className="w-full"
          testID="order-menu-updated-done"
          onClick={() => {
            setSuccess(null);
          }}
        >
          Back to order
        </SHCButton>
        <button
          type="button"
          className="mt-3 text-sm font-bold text-primary"
          onClick={() => router.push('/orders')}
        >
          All orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 shc-safe-bottom-pad" data-testid="order-manage-screen">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/orders" className="text-2xl font-light w-10" aria-label="Back">
          ‹
        </Link>
        <h1 className="flex-1 text-center font-black text-lg truncate" data-testid="order-manage-title">
          {cookName}
        </h1>
        <span className="w-10" />
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className="text-[11px] font-extrabold px-2 py-1 rounded-md"
          style={{ background: chip.bg, color: chip.color }}
          data-testid="order-manage-status"
        >
          {chip.label}
        </span>
        <span className="text-xs font-bold text-muted-foreground">{formatSlotLabel(timeslot)}</span>
      </div>

      <p className="font-black text-xl" data-testid="order-manage-cook">
        {cookName}
      </p>
      <p className="text-sm font-semibold text-muted-foreground mb-4">{planTitle}</p>
      {actionError ? (
        <p className="text-sm font-bold text-red-600 mb-3" data-testid="order-manage-error">
          {actionError}
        </p>
      ) : null}

      {canSkipManageOrder(effectiveStatus) || canAddItemsToOrder(effectiveStatus, customizable) ? (
        <div className="flex gap-2 mb-4">
          {canSkipManageOrder(effectiveStatus) && (
            <SHCButton
              variant="outline"
              className="flex-1"
              testID="order-manage-skip"
              onClick={handleSkip}
              disabled={skipMut.isPending}
            >
              {labels.skip}
            </SHCButton>
          )}
          {canAddItemsToOrder(effectiveStatus, customizable) && (
            <SHCButton className="flex-1" testID="order-manage-add-items" onClick={openAddItems}>
              {labels.addItems}
            </SHCButton>
          )}
        </div>
      ) : null}

      <SHCCard className="mb-3" data-testid="order-manage-menu">
        <p className="text-[11px] font-extrabold text-muted-foreground mb-2">Today&apos;s menu</p>
        {menuPending && menuLines.length === 0 ? (
          <p className="text-sm font-semibold text-muted-foreground italic">Menu yet to be updated</p>
        ) : (
          <ul className="space-y-2" data-testid="order-manage-menu-list">
            {menuLines.map((line, idx) => {
              const extra = isExtraMenuLine(line);
              const label = formatMenuLineDisplay(line);
              return (
                <li
                  key={`${line}-${idx}`}
                  className={`flex items-center justify-between gap-2 text-sm font-semibold ${
                    extra ? 'rounded-lg border border-green-200 bg-green-50 px-2 py-1.5' : ''
                  }`}
                  data-testid={extra ? 'order-menu-extra-line' : 'order-menu-base-line'}
                >
                  <span>· {label}</span>
                  {extra ? (
                    <span
                      className="shrink-0 text-[10px] font-black uppercase tracking-wide text-green-700 bg-green-100 px-2 py-0.5 rounded"
                      data-testid="order-menu-extra-tag"
                    >
                      Extra item
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {customizable && effectiveStatus === 'scheduled' && (
          <p className="text-[10px] font-black text-primary uppercase mt-2">Customizable</p>
        )}
      </SHCCard>

      <button
        type="button"
        className="w-full text-left rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-4 py-3 mb-2"
        data-testid="order-manage-change-slot"
        onClick={() => setShowSlotPicker((v) => !v)}
      >
        <p className="text-xs font-bold text-muted-foreground">{labels.changeSlot}</p>
        <p className="font-bold text-sm mt-0.5">{formatSlotLabel(timeslot)}</p>
      </button>
      {showSlotPicker && (
        <ul className="mb-3 space-y-1" data-testid="order-manage-slot-list">
          {collectionSlotOptions().map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm font-semibold ${
                  timeslot === s.id || timeslot === s.label
                    ? 'border-primary bg-primary/5'
                    : 'border-[var(--shc-border-brutal)]'
                }`}
                onClick={() => {
                  setTimeslot(s.id);
                  setShowSlotPicker(false);
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="w-full text-left rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-4 py-3 mb-2"
        data-testid="order-manage-instructions-toggle"
        onClick={() => setShowInstructions((v) => !v)}
      >
        <p className="text-xs font-bold text-muted-foreground">{labels.instructions}</p>
        {instructions ? (
          <p className="text-sm font-semibold mt-1">{instructions}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">Optional note for the cook / lobby</p>
        )}
      </button>
      {showInstructions && (
        <textarea
          className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 text-sm font-semibold mb-3 min-h-[88px]"
          placeholder="e.g. Call when ready · leave at unit 12-34"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          data-testid="order-manage-instructions-input"
        />
      )}

      <button
        type="button"
        className="w-full text-left rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-4 py-3 mb-4 text-sm font-bold text-primary"
        data-testid="order-manage-help"
        onClick={() => {
          if (kind === 'one_off' && id) router.push(`/orders/${id}`);
          else router.push('/tiffin/manage');
        }}
      >
        {labels.help}
      </button>

      {kind === 'one_off' && id && (
        <Link href={`/orders/${id}`} className="block text-center text-sm font-bold text-muted-foreground">
          Full order tracking →
        </Link>
      )}

      <OrderManageSupportWeb
        orderId={trackingOrderId}
        invoiceEnabled={invoiceEnabled}
        onDownloadInvoice={async (oid) => {
          const res = await getOrderInvoiceDownloadUrl(oid);
          if (!res.download_url) throw new Error('No invoice download URL from server');
          window.open(res.download_url, '_blank', 'noopener,noreferrer');
        }}
        onChat={(oid) => router.push(`/orders/${oid}#order-chat-section`)}
        submitOrderDispute={submitOrderDispute}
        disputes={disputes}
      />

      {/* Add items sheet */}
      {showAddItems && draft && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          data-testid="order-add-items-sheet"
        >
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setShowAddItems(false)} />
          <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 pb-6">
            <p className="font-black text-lg mb-1">{draft.productName}</p>
            <p className="text-xs font-semibold text-muted-foreground mb-3">
              Select extras for this collection
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {chips.map((c) => (
                <span key={c.id} className="text-[11px] font-bold px-2 py-1 rounded-full border">
                  {c.label}
                </span>
              ))}
            </div>
            <p className="text-xs font-extrabold text-muted-foreground uppercase mb-2">Extra · one</p>
            {extras.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`w-full flex justify-between rounded-xl border-2 px-3 py-2.5 mb-2 text-sm font-bold ${
                  draft.extraId === e.id ? 'border-primary bg-primary/5' : 'border-[var(--shc-border-brutal)]'
                }`}
                onClick={() => setDraft((d) => (d ? { ...d, extraId: e.id } : d))}
              >
                <span>{e.label}</span>
                <span>{e.priceDelta > 0 ? `+S$${e.priceDelta}` : 'S$0'}</span>
              </button>
            ))}
            <p className="text-xs font-extrabold text-muted-foreground uppercase mb-2 mt-2">Add-on</p>
            {addons.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`w-full flex justify-between rounded-xl border-2 px-3 py-2.5 mb-2 text-sm font-bold ${
                  draft.addonIds.includes(a.id) ? 'border-primary bg-primary/5' : 'border-[var(--shc-border-brutal)]'
                }`}
                onClick={() =>
                  setDraft((d) => (d ? { ...d, addonIds: toggleAddonId(d.addonIds, a.id) } : d))
                }
              >
                <span>{a.label}</span>
                <span>+S${a.priceDelta}</span>
              </button>
            ))}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center border-2 rounded-xl px-2">
                <button
                  type="button"
                  className="w-9 h-9 font-black"
                  onClick={() => setDraft((d) => (d ? { ...d, qty: adjustMealQty(d.qty, -1) } : d))}
                >
                  −
                </button>
                <span className="font-black w-6 text-center">{draft.qty}</span>
                <button
                  type="button"
                  className="w-9 h-9 font-black"
                  onClick={() => setDraft((d) => (d ? { ...d, qty: adjustMealQty(d.qty, 1) } : d))}
                >
                  +
                </button>
              </div>
              <SHCButton className="flex-1" testID="order-add-items-pay" onClick={confirmAddItems}>
                {addItemsProceedLabel(computeAddItemsExtraTotal(draft, extras, addons))}
              </SHCButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManageOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-10">
          <SHCLoading label="Loading order…" />
        </div>
      }
    >
      <ManageOrderInner />
    </Suspense>
  );
}
