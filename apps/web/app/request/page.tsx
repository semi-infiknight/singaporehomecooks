'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Users, Wallet, Calendar } from 'lucide-react';
import {
  BENTO_ACTION_IMAGES,
  getOccasionImageUrl,
  defaultListingOccasionTag,
  listingOccasionTagOptions,
  newRequestDishLine,
  buildRequestBodyFromItems,
  shcGuestCountBadgeLabel,
  shcServingsBadgeLabel,
  type CustomRequestLine,
} from '@shc/utils';
import { useCreateRequest } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { useCustomerConfig } from '../../lib/useCustomerConfig';
import { SHCButton, SHCCard, SHCSectionTitle, SHCSkeletonList } from '../components/SHCWebComponents';

const PARTY_PRESETS = [4, 6, 8, 10, 12];
const BUDGET_PRESETS = [80, 120, 150, 200];
const STEPS = ['Occasion', 'Dishes', 'Gathering', 'Review'];

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function RequestDishPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { config: browseConfig } = useCustomerConfig();
  const occasionOptions = useMemo(() => listingOccasionTagOptions(browseConfig), [browseConfig]);
  const defaultOccasion = useMemo(() => defaultListingOccasionTag(browseConfig), [browseConfig]);
  const createReq = useCreateRequest();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [occasion, setOccasion] = useState('');
  const [context, setContext] = useState('Family gathering — mix of mains and sides.');
  const [dishLines, setDishLines] = useState<CustomRequestLine[]>(() => [
    newRequestDishLine({ name: 'Nasi lemak with sambal prawns', servings: 8 }),
  ]);
  const [youtube, setYoutube] = useState('');
  const [guestCount, setGuestCount] = useState(8);
  const [budget, setBudget] = useState(120);
  const [date, setDate] = useState(defaultDate);
  const [featureLoading, setFeatureLoading] = useState(true);
  const [requestDishEnabled, setRequestDishEnabled] = useState(true);

  useEffect(() => {
    if (!occasion && defaultOccasion) setOccasion(defaultOccasion);
  }, [defaultOccasion, occasion]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/request');
  }, [authLoading, user, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { isFeatureEnabled } = await import('../../lib/api-client');
        const enabled = await isFeatureEnabled('request_dish');
        if (!cancelled) setRequestDishEnabled(enabled);
      } catch {
        if (!cancelled) setRequestDishEnabled(true);
      } finally {
        if (!cancelled) setFeatureLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroUri = getOccasionImageUrl(occasion) || BENTO_ACTION_IMAGES.request;
  const body = buildRequestBodyFromItems(occasion, dishLines, context);
  const canNext =
    step === 1
      ? Boolean(occasion)
      : step === 2
        ? dishLines.some((l) => l.name.trim().length >= 2)
        : step === 3
          ? guestCount >= 2 && budget >= 20
          : body.length >= 10;

  const handlePost = async () => {
    const items = dishLines
      .filter((l) => l.name.trim().length >= 2)
      .map((l) => ({
        id: l.id,
        name: l.name.trim(),
        servings: Math.max(1, l.servings),
        notes: l.notes,
        youtube_url: l.youtube_url,
      }));
    const req = await createReq.mutateAsync({
      body,
      items,
      youtube_url: youtube.trim() || undefined,
      party_size: items[0]?.servings,
      guest_count: guestCount,
      budget_cents: Math.round(budget * 100),
      date,
    });
    setRequestId((req as { id?: string })?.id);
    setDone(true);
  };

  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10" data-testid="request-page-loading">
        <SHCSkeletonList count={4} rowHeight={72} />
      </div>
    );
  }

  if (!user) return null;

  if (!featureLoading && !requestDishEnabled) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-black">Request a dish is paused</h1>
        <p className="mt-3 text-muted-foreground font-medium">
          Browse existing home-cooked listings for now — we&apos;ll reopen custom requests soon.
        </p>
        <SHCButton className="mt-6" onClick={() => router.push('/')}>
          Browse dishes
        </SHCButton>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 max-w-lg mx-auto text-center" data-testid="request-success">
        <CheckCircle2 className="w-16 h-16 text-[var(--shc-success)] mb-6" aria-hidden />
        <h1 className="text-3xl font-black text-foreground">Request posted!</h1>
        <p className="text-muted-foreground mt-3 font-medium leading-relaxed">
          {requestId
            ? `Request ${requestId} is live. Home cooks will send quotes on Custom requests.`
            : 'Home cooks will quote soon — check Orders → Custom requests.'}
        </p>
        <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
          <SHCButton size="lg" onClick={() => router.push(requestId ? `/requests/${requestId}` : '/orders')}>
            View request
          </SHCButton>
          <SHCButton variant="outline" onClick={() => router.push('/')}>
            Browse dishes
          </SHCButton>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16" data-testid="request-dish-screen">
      <div className="relative h-52 md:h-64 overflow-hidden">
        <Image src={heroUri} alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/90 via-[#1C1C1C]/50 to-[#1C1C1C]/30" />
        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
              className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
              aria-label="Go back"
              data-testid="request-back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-white/85 tracking-wide">STEP {step} OF 4</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Request a custom dish</h1>
            <p className="text-sm md:text-base font-semibold text-white/90 mt-2 max-w-xl">
              {step === 1 && 'Pick an occasion and optional context'}
              {step === 2 && 'Add each dish with servings — cooks quote per line'}
              {step === 3 && 'Guest count, budget, date, and optional YouTube'}
              {step === 4 && 'Review before cooks send quotes'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10">
        <div className="flex gap-1 mb-6">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const complete = n < step;
            return (
              <div key={label} className="flex-1 text-center">
                <div
                  className={`h-2 rounded-full border-2 border-[var(--shc-border-brutal)] ${
                    complete || active ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                <span className={`text-[10px] font-bold mt-1 block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div data-testid="request-step-occasion">
            <SHCSectionTitle>What&apos;s the occasion?</SHCSectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {occasionOptions.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOccasion(o)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] transition-colors ${
                    occasion === o ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <label className="block text-sm font-bold mb-2">Context (optional)</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="shc-input min-h-[100px] resize-y"
              placeholder="e.g. Hari Raya open house, halal-friendly, medium spice…"
              data-testid="request-context"
            />
          </div>
        )}

        {step === 2 && (
          <div data-testid="request-step-dishes">
            <SHCSectionTitle>Dishes you want</SHCSectionTitle>
            <p className="text-sm text-muted-foreground font-semibold mb-4">
              Add each dish separately — cooks can quote per item.
            </p>
            {dishLines.map((line, idx) => (
              <div key={line.id} className="mb-4 rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 bg-card">
                <input
                  value={line.name}
                  onChange={(e) =>
                    setDishLines((rows) => rows.map((r) => (r.id === line.id ? { ...r, name: e.target.value } : r)))
                  }
                  className="shc-input w-full"
                  placeholder={`Dish ${idx + 1} name`}
                  data-testid={`request-dish-name-${idx}`}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {PARTY_PRESETS.map((n) => (
                    <button
                      key={`${line.id}-${n}`}
                      type="button"
                      onClick={() =>
                        setDishLines((rows) => rows.map((r) => (r.id === line.id ? { ...r, servings: n } : r)))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[var(--shc-border-brutal)] ${
                        line.servings === n ? 'bg-primary text-primary-foreground' : 'bg-card'
                      }`}
                      data-testid={`request-dish-servings-${idx}-${n}`}
                    >
                      {shcServingsBadgeLabel(n)}
                    </button>
                  ))}
                </div>
                {dishLines.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600 mt-2"
                    onClick={() => setDishLines((rows) => rows.filter((r) => r.id !== line.id))}
                  >
                    Remove dish
                  </button>
                ) : null}
              </div>
            ))}
            {dishLines.length < 8 ? (
              <button
                type="button"
                className="text-sm font-black text-primary"
                onClick={() => setDishLines((rows) => [...rows, newRequestDishLine()])}
                data-testid="request-add-dish"
              >
                + Add another dish
              </button>
            ) : null}
          </div>
        )}

        {step === 3 && (
          <div data-testid="request-step-gathering">
            <SHCSectionTitle>Guest count</SHCSectionTitle>
            <p className="text-sm text-muted-foreground font-semibold mb-3">
              How many people are eating — not the same as per-dish servings.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {PARTY_PRESETS.map((n) => (
                <button
                  key={`g-${n}`}
                  type="button"
                  onClick={() => setGuestCount(n)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 border-[var(--shc-border-brutal)] ${
                    guestCount === n ? 'bg-primary text-primary-foreground' : 'bg-card'
                  }`}
                  data-testid={`request-guests-${n}`}
                >
                  {shcGuestCountBadgeLabel(n)}
                </button>
              ))}
            </div>
            <SHCSectionTitle>Budget (S$)</SHCSectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {BUDGET_PRESETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 border-[var(--shc-border-brutal)] ${
                    budget === b ? 'bg-primary text-primary-foreground' : 'bg-card'
                  }`}
                >
                  S${b}
                </button>
              ))}
            </div>
            <label className="block text-sm font-bold mb-2">YouTube URL (optional)</label>
            <input
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              className="shc-input w-full mb-4"
              placeholder="https://youtube.com/watch?v=…"
              data-testid="request-yt"
            />
            <label className="block text-sm font-bold mb-2">Collection date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="shc-input w-full"
              data-testid="request-date"
            />
          </div>
        )}

        {step === 4 && (
          <div data-testid="request-step-review">
            <SHCCard className="bg-[var(--shc-bento-mint)]">
              <p className="text-xs font-black text-muted-foreground tracking-wide">YOUR REQUEST</p>
              <p className="text-lg font-black mt-2 leading-snug">{body}</p>
              <ul className="mt-3 space-y-1">
                {dishLines
                  .filter((l) => l.name.trim())
                  .map((line) => (
                    <li key={line.id} className="text-sm font-semibold">
                      {line.name} · {shcServingsBadgeLabel(line.servings)}
                    </li>
                  ))}
              </ul>
              {youtube.trim() ? (
                <p className="text-sm text-primary font-semibold mt-2 truncate">📺 {youtube}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-[var(--shc-border-brutal)] bg-card text-xs font-bold">
                  <Users className="w-3.5 h-3.5" /> {shcGuestCountBadgeLabel(guestCount)}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-[var(--shc-border-brutal)] bg-card text-xs font-bold">
                  <Wallet className="w-3.5 h-3.5" /> S${budget}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-[var(--shc-border-brutal)] bg-card text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5" /> {date}
                </span>
              </div>
            </SHCCard>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <SHCButton
            size="lg"
            disabled={!canNext || createReq.isPending}
            onClick={() => {
              if (step < 4) setStep((s) => s + 1);
              else void handlePost();
            }}
            testID="submit-request-btn"
          >
            {createReq.isPending ? 'Posting…' : step === 4 ? 'Post request — cooks will quote' : 'Continue'}
          </SHCButton>
          {step > 1 ? (
            <SHCButton variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </SHCButton>
          ) : (
            <Link href="/orders" className="text-center text-sm font-bold text-primary">
              View custom requests
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
