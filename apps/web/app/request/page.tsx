'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Users, Wallet, Calendar } from 'lucide-react';
import { BENTO_ACTION_IMAGES, getOccasionImageUrl } from '@shc/utils';
import { useCreateRequest } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { useShcI18n, getRequestDishCopy, getLocalizedOccasions } from '@shc/i18n';
import { SHCButton, GourmeatCard, SHCSectionTitle } from '../components/SHCWebComponents';

const PARTY_PRESETS = [4, 6, 8, 10, 12];
const BUDGET_PRESETS = [80, 120, 150, 200];

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

const chipClass = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-sm font-bold border border-border shadow-[var(--shc-shadow-soft)] transition-colors ${
    active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
  }`;

const presetClass = (active: boolean) =>
  `px-4 py-2 rounded-full text-sm font-bold border border-border shadow-[var(--shc-shadow-soft)] ${
    active ? 'bg-primary text-primary-foreground' : 'bg-card'
  }`;

export default function RequestDishPage() {
  const { locale } = useShcI18n();
  const copy = useMemo(() => getRequestDishCopy(locale), [locale]);
  const router = useRouter();
  const { user } = useAuth();
  const createReq = useCreateRequest();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [occasion, setOccasion] = useState(copy.occasionValues[0]);
  const [story, setStory] = useState(() => copy.defaultStory(copy.occasionValues[0]));
  const [youtube, setYoutube] = useState('');
  const [partySize, setPartySize] = useState(8);
  const [budget, setBudget] = useState(120);
  const [date, setDate] = useState(defaultDate);
  const [featureLoading, setFeatureLoading] = useState(true);
  const [requestDishEnabled, setRequestDishEnabled] = useState(true);

  useEffect(() => {
    if (!user) router.replace('/login?next=/request');
  }, [user, router]);

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

  const heroUri = getOccasionImageUrl(occasion);
  const occasionLabel = copy.occasionLabels[occasion] || occasion;
  const body = [occasionLabel ? `${occasionLabel}:` : '', story.trim()].filter(Boolean).join(' ').trim();
  const canNext =
    step === 1
      ? story.trim().length >= 10
      : step === 3
        ? partySize >= 2 && budget >= 20
        : step === 4
          ? body.length >= 10
          : true;

  const handlePost = async () => {
    const req = await createReq.mutateAsync({
      body,
      youtube_url: youtube.trim() || undefined,
      party_size: partySize,
      budget_cents: Math.round(budget * 100),
      date,
    });
    setRequestId((req as { id?: string })?.id);
    setDone(true);
  };

  const occasions = getLocalizedOccasions(locale).filter((o) => copy.occasionValues.includes(o.id));

  if (!user) return null;

  if (!featureLoading && !requestDishEnabled) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-black">{copy.pausedTitle}</h1>
        <p className="mt-3 text-muted-foreground font-medium">{copy.pausedBody}</p>
        <SHCButton className="mt-6" onClick={() => router.push('/')}>
          {copy.browseCta}
        </SHCButton>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 max-w-lg mx-auto text-center" test-id="request-success">
        <CheckCircle2 className="w-16 h-16 text-[var(--shc-success)] mb-6" aria-hidden />
        <h1 className="text-3xl font-black text-foreground">{copy.successTitle}</h1>
        <p className="text-muted-foreground mt-3 font-medium leading-relaxed">
          {requestId ? copy.successWithIdWeb.replace('{id}', requestId) : copy.successBody}
        </p>
        <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
          <SHCButton size="lg" onClick={() => router.push('/')}>
            {copy.browseCta}
          </SHCButton>
          <SHCButton variant="outline" onClick={() => router.push('/profile')}>
            {copy.backProfile}
          </SHCButton>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16" test-id="request-dish-screen">
      <div className="relative h-52 md:h-64 overflow-hidden">
        <Image src={heroUri} alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-foreground/30" />
        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
              className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
              aria-label={copy.backA11y}
              data-testid="request-back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-white/85 tracking-wide">
              {copy.stepOf.replace('{step}', String(step))}
            </span>
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">{copy.title}</h1>
            <p className="text-sm md:text-base font-semibold text-white/90 mt-2 max-w-xl">{copy.heroSteps[step - 1]}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10">
        <div className="flex gap-1 mb-6">
          {copy.steps.map((s, i) => {
            const n = i + 1;
            const active = n === step;
            const complete = n < step;
            return (
              <div key={s.id} className="flex-1 text-center">
                <div
                  className={`h-2 rounded-full border border-border ${
                    complete || active ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                <span className={`text-[10px] font-bold mt-1 block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div data-testid="request-step-occasion">
            <SHCSectionTitle>{copy.occasionTitle}</SHCSectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {occasions.map((o) => (
                <button key={o.id} type="button" onClick={() => setOccasion(o.id)} className={chipClass(occasion === o.id)}>
                  {o.chipLabel}
                </button>
              ))}
            </div>
            <label className="block text-sm font-bold mb-2">{copy.describeLabel}</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="shc-input min-h-[120px] resize-y"
              placeholder={copy.describePlaceholder}
              data-testid="request-desc"
            />
            <p className="text-xs text-muted-foreground mt-2 font-medium">{copy.storyHint}</p>
          </div>
        )}

        {step === 2 && (
          <div data-testid="request-step-inspiration">
            <GourmeatCard className="bg-[var(--shc-bento-peach)] mb-4">
              <p className="font-bold text-sm">{copy.interpretationTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">{copy.interpretationBody}</p>
            </GourmeatCard>
            <label className="block text-sm font-bold mb-2">{copy.youtubeLabel}</label>
            <input
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              className="shc-input w-full"
              placeholder={copy.youtubePlaceholder}
              data-testid="request-yt"
            />
          </div>
        )}

        {step === 3 && (
          <div data-testid="request-step-gathering">
            <SHCSectionTitle>{copy.partySize}</SHCSectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {PARTY_PRESETS.map((n) => (
                <button key={n} type="button" onClick={() => setPartySize(n)} className={presetClass(partySize === n)}>
                  {copy.guestsCount(n)}
                </button>
              ))}
            </div>
            <SHCSectionTitle>{copy.budget}</SHCSectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {BUDGET_PRESETS.map((b) => (
                <button key={b} type="button" onClick={() => setBudget(b)} className={presetClass(budget === b)}>
                  {copy.budgetBadge(b)}
                </button>
              ))}
            </div>
            <label className="block text-sm font-bold mb-2">{copy.collectionDate}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="shc-input w-full"
              data-testid="request-date"
            />
            <p className="text-xs text-muted-foreground mt-2 font-medium">{copy.collectionHint}</p>
          </div>
        )}

        {step === 4 && (
          <div data-testid="request-step-review">
            <GourmeatCard className="bg-[var(--shc-bento-mint)]">
              <p className="text-xs font-black text-muted-foreground tracking-wide">{copy.yourRequest}</p>
              <p className="text-lg font-black mt-2 leading-snug">{body}</p>
              {youtube.trim() && (
                <p className="text-sm text-primary font-semibold mt-2 truncate">📺 {youtube}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-card text-xs font-bold shadow-[var(--shc-shadow-soft)]">
                  <Users className="w-3.5 h-3.5" /> {copy.guestsCount(partySize)}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-card text-xs font-bold shadow-[var(--shc-shadow-soft)]">
                  <Wallet className="w-3.5 h-3.5" /> {copy.budgetBadge(budget)}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-card text-xs font-bold shadow-[var(--shc-shadow-soft)]">
                  <Calendar className="w-3.5 h-3.5" /> {date}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">{copy.reviewBoardBody}</p>
            </GourmeatCard>
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
            {createReq.isPending ? copy.posting : step === 4 ? copy.postBtn : copy.continue}
          </SHCButton>
          {step > 1 && (
            <SHCButton variant="outline" onClick={() => setStep((s) => s - 1)}>
              {copy.back}
            </SHCButton>
          )}
        </div>
      </div>
    </div>
  );
}
