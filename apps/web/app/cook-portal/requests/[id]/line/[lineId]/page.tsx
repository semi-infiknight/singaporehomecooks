'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  formatBidCentsAsDollars,
  getDishImageUrl,
  parseBidDollarsToCents,
  parseCustomRequestDisplay,
  shcServingsBadgeLabel,
} from '@shc/utils';
import { useCookRequestQuoteDraft } from '../../../../../../lib/cook-request-quote-draft';
import { useCookCustomRequest } from '../../../../../../lib/useCookPortal';
import { GourmeatCookHeader, GourmeatPrimaryButton, SHCMetaBadge } from '../../../../../components/SHCWebComponents';

export default function CookCustomRequestDishPage() {
  const params = useParams<{ id: string; lineId: string }>();
  const router = useRouter();
  const requestId = String(params.id || '');
  const dishLineId = String(params.lineId || '');
  const { data: raw } = useCookCustomRequest(requestId);
  const { lines, updateLine } = useCookRequestQuoteDraft();

  const parsed = useMemo(
    () => (raw ? parseCustomRequestDisplay(raw as Record<string, unknown>) : null),
    [raw]
  );
  const line = parsed?.lines.find((l) => l.id === dishLineId);
  const qLine = lines.find((l) => l.request_line_id === dishLineId);
  const priceLabel =
    qLine?.included && (qLine.price_cents || 0) > 0 ? formatBidCentsAsDollars(qLine.price_cents) : '';

  if (!line) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Link href={`/cook-portal/requests/${encodeURIComponent(requestId)}`} className="text-sm font-black text-primary">
          ← Request
        </Link>
        <p className="font-bold mt-4">Dish not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid={`cook-request-dish-screen-${dishLineId}`}>
      <Link
        href={`/cook-portal/requests/${encodeURIComponent(requestId)}`}
        className="text-sm font-black text-primary"
      >
        ← Request
      </Link>
      <GourmeatCookHeader title={line.name} subtitle="Set your price for this dish" />

      <img
        src={getDishImageUrl({ name: line.name })}
        alt=""
        className="w-full h-48 object-cover rounded-2xl border-2 border-[var(--shc-border-brutal)] mt-3"
      />
      <div className="flex flex-wrap gap-2 mt-3">
        <SHCMetaBadge kind="portion_min">{shcServingsBadgeLabel(line.servings)}</SHCMetaBadge>
      </div>
      {line.notes ? <p className="text-sm font-semibold text-muted-foreground mt-3">{line.notes}</p> : null}

      <label className="block text-xs font-extrabold text-foreground mt-6 mb-2">Your price (S$)</label>
      <input
        className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] px-4 py-3 text-2xl font-black"
        placeholder="e.g. 45"
        inputMode="decimal"
        value={priceLabel}
        onChange={(e) => {
          const parsedPrice = parseBidDollarsToCents(e.target.value);
          updateLine(dishLineId, {
            price_cents: parsedPrice.ok ? parsedPrice.cents : 0,
            included: parsedPrice.ok && parsedPrice.cents > 0,
            name: line.name,
            servings: line.servings,
          });
        }}
        data-testid={`quote-price-${dishLineId}`}
      />

      {qLine?.included ? (
        <button
          type="button"
          className="text-sm font-extrabold text-muted-foreground mt-4"
          onClick={() => updateLine(dishLineId, { included: false, price_cents: 0 })}
          data-testid={`quote-skip-${dishLineId}`}
        >
          Skip this dish in my bid
        </button>
      ) : (
        <button
          type="button"
          className="text-sm font-extrabold text-primary mt-4"
          onClick={() => updateLine(dishLineId, { included: true, name: line.name, servings: line.servings })}
        >
          Include in my bid
        </button>
      )}

      <GourmeatPrimaryButton
        label="Done — back to request"
        className="w-full mt-8"
        testID="cook-request-dish-done"
        onClick={() => router.push(`/cook-portal/requests/${encodeURIComponent(requestId)}`)}
      />
    </div>
  );
}
