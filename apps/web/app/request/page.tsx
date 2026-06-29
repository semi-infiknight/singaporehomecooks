'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Users, Wallet, Calendar } from 'lucide-react';
import { BENTO_ACTION_IMAGES, getOccasionImageUrl } from '@shc/utils';
import { useCreateRequest } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { SHCButton, SHCCard, SHCSectionTitle } from '../components/SHCWebComponents';

const OCCASIONS = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Birthday', 'Family Gathering', 'Wedding'];
const PARTY_PRESETS = [4, 6, 8, 10, 12];
const BUDGET_PRESETS = [80, 120, 150, 200];
const STEPS = ['Your story', 'Inspiration', 'Gathering', 'Review'];

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function RequestDishPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createReq = useCreateRequest();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [occasion, setOccasion] = useState('Hari Raya');
  const [story, setStory] = useState(
    'Nasi lemak with sambal prawns for our Hari Raya open house — spicy, halal-friendly, enough for the whole family.',
  );
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
  const body = [occasion ? `${occasion}:` : '', story.trim()].filter(Boolean).join(' ').trim();
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 max-w-lg mx-auto text-center" test-id="request-success">
        <CheckCircle2 className="w-16 h-16 text-[var(--shc-success)] mb-6" aria-hidden />
        <h1 className="text-3xl font-black text-foreground">Request posted!</h1>
        <p className="text-muted-foreground mt-3 font-medium leading-relaxed">
          {requestId
            ? `Request ${requestId} is live. Home cooks will bid on the Collaboration Board.`
            : 'Home cooks will bid soon — check notifications for offers.'}
        </p>
        <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
          <SHCButton size="lg" onClick={() => router.push('/')}>
            Browse dishes
          </SHCButton>
          <SHCButton variant="outline" onClick={() => router.push('/profile')}>
            Back to profile
          </SHCButton>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16" test-id="request-dish-screen">
      {/* Immersive hero */}
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
            <span className="text-xs font-bold text-white/85 tracking-wide">
              STEP {step} OF 4
            </span>
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Request a custom dish</h1>
            <p className="text-sm md:text-base font-semibold text-white/90 mt-2 max-w-xl">
              {step === 1 && 'Tell home cooks your occasion and what you crave'}
              {step === 2 && 'Share a recipe video — cooks bring their HDB interpretation'}
              {step === 3 && 'How many guests, budget, and when you need it'}
              {step === 4 && 'Review before cooks bid on the Collaboration Board'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10">
        {/* Stepper */}
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
              {OCCASIONS.map((o) => (
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
            <label className="block text-sm font-bold mb-2">Describe the dish & vibe</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="shc-input min-h-[120px] resize-y"
              placeholder="e.g. Ayam buah keluak for 6, Peranakan-style…"
              data-testid="request-desc"
            />
          </div>
        )}

        {step === 2 && (
          <div data-testid="request-step-inspiration">
            <SHCCard className="bg-[var(--shc-bento-peach)] mb-4">
              <p className="font-bold text-sm">Cook&apos;s interpretation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Paste a YouTube recipe — verified HDB cooks adapt it to their kitchen.
              </p>
            </SHCCard>
            <label className="block text-sm font-bold mb-2">YouTube URL (optional)</label>
            <input
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              className="shc-input w-full"
              placeholder="https://youtube.com/watch?v=…"
              data-testid="request-yt"
            />
          </div>
        )}

        {step === 3 && (
          <div data-testid="request-step-gathering">
            <SHCSectionTitle>Party size</SHCSectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {PARTY_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPartySize(n)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 border-[var(--shc-border-brutal)] ${
                    partySize === n ? 'bg-primary text-primary-foreground' : 'bg-card'
                  }`}
                >
                  {n} guests
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
              {youtube.trim() && (
                <p className="text-sm text-primary font-semibold mt-2 truncate">📺 {youtube}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-[var(--shc-border-brutal)] bg-card text-xs font-bold">
                  <Users className="w-3.5 h-3.5" /> {partySize} guests
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
            {createReq.isPending ? 'Posting…' : step === 4 ? 'Post request — cooks will bid' : 'Continue'}
          </SHCButton>
          {step > 1 && (
            <SHCButton variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </SHCButton>
          )}
        </div>
      </div>
    </div>
  );
}