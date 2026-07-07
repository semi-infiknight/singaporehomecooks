// Immersive recipe-request wizard — occasion story → inspiration → gathering → review.
// @ts-nocheck
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { BENTO_ACTION_IMAGES, getOccasionImageUrl } from '@shc/utils';
import { shcColors, shcSpacing, shcRadii, gourmeatColors, gourmeatShadows } from './theme';
import { SHCFoodImage } from './visuals';
import { SHCIcon } from './icons';
import { SHCButton, SHCButtonText, SHCCard } from './primitives';
import { SHCCheckoutStepper } from './food-ux';
import { SHCWizardPane, SHCFadeIn } from './motion';
import { OccasionTagPicker } from './occasion-picker';

export type RequestDishPayload = {
  body: string;
  youtube_url?: string;
  party_size?: number;
  budget_cents?: number;
  date?: string;
  occasion?: string;
};

const STEPS = [
  { id: 'occasion', label: 'Your story' },
  { id: 'inspiration', label: 'Inspiration' },
  { id: 'gathering', label: 'Gathering' },
  { id: 'review', label: 'Review' },
];

export type RequestDishCopyInput = {
  stepOf: string;
  title: string;
  heroSteps: [string, string, string, string];
  steps: Array<{ id: string; label: string }>;
  occasionTitle: string;
  describeLabel: string;
  describePlaceholder: string;
  storyHint: string;
  interpretationTitle: string;
  interpretationBody: string;
  youtubeLabel: string;
  youtubePlaceholder: string;
  skipVideo: string;
  partySize: string;
  budget: string;
  collectionDate: string;
  datePlaceholder: string;
  collectionHint: string;
  yourRequest: string;
  guests: string;
  reviewBoardBody: string;
  posting: string;
  postBtn: string;
  continue: string;
  back: string;
  occasionValues: string[];
  occasionLabels: Record<string, string>;
  successTitle: string;
  successWithId: string;
  successBody: string;
  successBrowseWait: string;
  backProfile: string;
  homeCtaTitle: string;
  homeCtaSubtitle: string;
};

const DEFAULT_COPY: RequestDishCopyInput = {
  stepOf: 'STEP {step} OF 4',
  title: 'Request a custom dish',
  heroSteps: [
    'Tell home cooks your occasion and what you crave',
    'Share a recipe video — cooks bring their HDB interpretation',
    'How many guests, budget, and when you need it',
    'Review before cooks bid on the Collaboration Board',
  ],
  steps: STEPS,
  occasionTitle: "What's the occasion?",
  describeLabel: 'Describe the dish & vibe',
  describePlaceholder: 'e.g. Ayam buah keluak for 6, Peranakan-style, medium spice…',
  storyHint: 'Min 10 characters — cooks use this to craft their bid.',
  interpretationTitle: "Cook's interpretation",
  interpretationBody: 'Paste a YouTube recipe — verified HDB cooks adapt it to their kitchen, not a carbon copy.',
  youtubeLabel: 'YouTube URL (optional)',
  youtubePlaceholder: 'https://youtube.com/watch?v=…',
  skipVideo: 'Skip — no video needed',
  partySize: 'Party size',
  budget: 'Budget (S$)',
  collectionDate: 'Collection date',
  datePlaceholder: 'YYYY-MM-DD',
  collectionHint: 'HDB collection only — exact block released 2h before slot.',
  yourRequest: 'YOUR REQUEST',
  guests: '{n} guests',
  reviewBoardBody:
    'Cooks on the Collaboration Board will bid with price and a personal note. Accept a bid to create your order — same trust layers as regular checkout.',
  posting: 'Posting…',
  postBtn: 'Post request — cooks will bid',
  continue: 'Continue',
  back: 'Back',
  occasionValues: ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Birthday', 'Family Gathering', 'Wedding'],
  occasionLabels: {},
  successTitle: 'Request posted!',
  successWithId:
    "Request {id} is live. Home cooks will bid on the Collaboration Board — we'll notify you when offers arrive.",
  successBody: 'Home cooks will bid soon. Check notifications for offers.',
  successBrowseWait: 'Browse dishes while you wait',
  backProfile: 'Back to profile',
  homeCtaTitle: 'Request a custom dish',
  homeCtaSubtitle: '4-step wizard — occasion, inspiration, gathering, review',
};

const PARTY_PRESETS = [4, 6, 8, 10, 12];
const BUDGET_PRESETS = [80, 120, 150, 200];

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function RequestDishExperience({
  onSubmit,
  onBack,
  busy = false,
  bottomInset = 32,
  testID = 'request-dish-experience',
  copy: copyProp,
}: {
  onSubmit: (data: RequestDishPayload) => void | Promise<void>;
  onBack?: () => void;
  busy?: boolean;
  /** Safe area + tab bar clearance for bottom CTAs */
  bottomInset?: number;
  testID?: string;
  copy?: RequestDishCopyInput;
}) {
  const copy = copyProp ?? DEFAULT_COPY;
  const STEPS_LOCAL = copy.steps;
  const [step, setStep] = React.useState(1);
  const [occasion, setOccasion] = React.useState('Hari Raya');
  const [story, setStory] = React.useState(
    'Nasi lemak with sambal prawns for our Hari Raya open house — spicy, halal-friendly, enough for the whole family.',
  );
  const [youtube, setYoutube] = React.useState('');
  const [partySize, setPartySize] = React.useState(8);
  const [budget, setBudget] = React.useState(120);
  const [date, setDate] = React.useState(defaultDate);

  const heroUri = occasion ? getOccasionImageUrl(occasion) : BENTO_ACTION_IMAGES.request;
  const stepMeta = STEPS_LOCAL[step - 1];

  const body = [occasion ? `${occasion}:` : '', story.trim()].filter(Boolean).join(' ').trim();

  const canNext =
    step === 1
      ? story.trim().length >= 10
      : step === 2
        ? true
        : step === 3
          ? partySize >= 2 && budget >= 20 && /^\d{4}-\d{2}-\d{2}$/.test(date)
          : body.length >= 10;

  const goNext = () => {
    if (step < 4 && canNext) setStep((s) => s + 1);
    else if (step === 4 && canNext && !busy) {
      onSubmit({
        body,
        youtube_url: youtube.trim() || undefined,
        party_size: partySize,
        budget_cents: Math.round(budget * 100),
        date,
        occasion,
      });
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else onBack?.();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: gourmeatColors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID={testID}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomInset + shcSpacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Immersive hero */}
        <View style={{ position: 'relative' }}>
          <SHCFoodImage uri={heroUri} height={220} rounded={0} testID="request-hero-image" />
          <View
            style={{
              ...StyleSheet.absoluteFill,
              backgroundColor: 'rgba(28,28,28,0.55)',
              paddingTop: shcSpacing.lg,
              paddingHorizontal: shcSpacing.md,
              paddingBottom: shcSpacing.lg,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable
                onPress={goBack}
                testID="request-back-btn"
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>←</Text>
              </Pressable>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 }}>
                {copy.stepOf.replace('{step}', String(step))}
              </Text>
            </View>
            <SHCFadeIn key={stepMeta.id}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 34 }}>
                {copy.title}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 6 }}>
                {copy.heroSteps[step - 1]}
              </Text>
            </SHCFadeIn>
          </View>
        </View>

        <View style={{ paddingHorizontal: shcSpacing.md, marginTop: shcSpacing.md }}>
          <SHCCheckoutStepper steps={STEPS_LOCAL} currentStep={step} testID="request-stepper" />
        </View>

        <View style={{ paddingHorizontal: shcSpacing.md }}>
          <SHCWizardPane stepKey={step}>
            {step === 1 && (
              <View testID="request-step-occasion">
                <Text style={labelStyle}>{copy.occasionTitle}</Text>
                <OccasionTagPicker
                  selected={[occasion]}
                  onToggle={(tag) => setOccasion(tag)}
                  options={copy.occasionValues}
                  optionLabels={copy.occasionLabels}
                />
                <Text style={[labelStyle, { marginTop: shcSpacing.md }]}>{copy.describeLabel}</Text>
                <TextInput
                  value={story}
                  onChangeText={setStory}
                  multiline
                  placeholder={copy.describePlaceholder}
                  placeholderTextColor={shcColors.textLight}
                  style={inputMultiline}
                  testID="request-desc"
                />
                <Text style={hintStyle}>{copy.storyHint}</Text>
              </View>
            )}

            {step === 2 && (
              <View testID="request-step-inspiration">
                <SHCCard variant="bento-peach" style={{ marginBottom: shcSpacing.md }}>
                  <View style={{ flexDirection: 'row', gap: shcSpacing.sm, alignItems: 'flex-start' }}>
                    <SHCIcon name="discover" size={22} color={shcColors.heritage} active />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', color: shcColors.text, fontSize: 14 }}>{copy.interpretationTitle}</Text>
                      <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 4, lineHeight: 18 }}>
                        {copy.interpretationBody}
                      </Text>
                    </View>
                  </View>
                </SHCCard>
                <Text style={labelStyle}>{copy.youtubeLabel}</Text>
                <TextInput
                  value={youtube}
                  onChangeText={setYoutube}
                  autoCapitalize="none"
                  keyboardType="url"
                  placeholder={copy.youtubePlaceholder}
                  placeholderTextColor={shcColors.textLight}
                  style={inputSingle}
                  testID="request-yt"
                />
                <Pressable onPress={() => setYoutube('')} style={{ marginTop: shcSpacing.sm }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.primary }}>{copy.skipVideo}</Text>
                </Pressable>
              </View>
            )}

            {step === 3 && (
              <View testID="request-step-gathering">
                <Text style={labelStyle}>{copy.partySize}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: shcSpacing.md }}>
                  {PARTY_PRESETS.map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setPartySize(n)}
                      style={chipStyle(partySize === n)}
                      testID={`request-party-${n}`}
                    >
                      <Text style={chipText(partySize === n)}>{copy.guests.replace('{n}', String(n))}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={labelStyle}>{copy.budget}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: shcSpacing.md }}>
                  {BUDGET_PRESETS.map((b) => (
                    <Pressable key={b} onPress={() => setBudget(b)} style={chipStyle(budget === b)} testID={`request-budget-${b}`}>
                      <Text style={chipText(budget === b)}>S${b}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={labelStyle}>{copy.collectionDate}</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder={copy.datePlaceholder}
                  placeholderTextColor={shcColors.textLight}
                  style={inputSingle}
                  testID="request-date"
                />
                <Text style={hintStyle}>{copy.collectionHint}</Text>
              </View>
            )}

            {step === 4 && (
              <View testID="request-step-review">
                <SHCCard variant="bento-mint" style={{ marginBottom: shcSpacing.md }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.textLight, letterSpacing: 0.5 }}>{copy.yourRequest}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: shcColors.text, marginTop: 6, lineHeight: 22 }}>{body}</Text>
                  {youtube.trim() ? (
                    <Text style={{ fontSize: 12, color: shcColors.primary, marginTop: 8, fontWeight: '600' }} numberOfLines={1}>
                      📺 {youtube.trim()}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: shcSpacing.md }}>
                    <View style={reviewPill}>
                      <SHCIcon name="people" size={14} color={shcColors.text} />
                      <Text style={reviewPillText}>{copy.guests.replace('{n}', String(partySize))}</Text>
                    </View>
                    <View style={reviewPill}>
                      <SHCIcon name="credits" size={14} color={shcColors.text} />
                      <Text style={reviewPillText}>S${budget}</Text>
                    </View>
                    <View style={reviewPill}>
                      <SHCIcon name="orders" size={14} color={shcColors.text} />
                      <Text style={reviewPillText}>{date}</Text>
                    </View>
                  </View>
                </SHCCard>
                <SHCCard>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: shcColors.text, lineHeight: 20 }}>{copy.reviewBoardBody}</Text>
                </SHCCard>
              </View>
            )}
          </SHCWizardPane>
        </View>

        <View style={{ paddingHorizontal: shcSpacing.md, marginTop: shcSpacing.lg, gap: shcSpacing.sm, alignSelf: 'stretch' }}>
          <SHCButton onPress={goNext} disabled={!canNext || busy} size="lg" appearance="customer" testID="submit-request-btn" style={{ alignSelf: 'stretch', width: '100%' }}>
            <SHCButtonText>{busy ? copy.posting : step === 4 ? copy.postBtn : copy.continue}</SHCButtonText>
          </SHCButton>
          {step > 1 && (
            <SHCButton variant="outline" appearance="customer" onPress={goBack} disabled={busy}>
              <SHCButtonText variant="outline">{copy.back}</SHCButtonText>
            </SHCButton>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const StyleSheet = { absoluteFill: { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 } };

const labelStyle = { fontSize: 13, fontWeight: '800', color: shcColors.text, marginBottom: shcSpacing.sm };
const hintStyle = { fontSize: 11, color: shcColors.textLight, marginTop: shcSpacing.sm, fontWeight: '600' };
const inputSingle = {
  borderWidth: 1,
  borderColor: gourmeatColors.border,
  borderRadius: shcRadii.md,
  padding: shcSpacing.md,
  backgroundColor: gourmeatColors.surface,
  fontSize: 15,
  color: gourmeatColors.text,
  ...gourmeatShadows.soft,
};
const inputMultiline = { ...inputSingle, minHeight: 120, textAlignVertical: 'top' as const };
const reviewPill = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: shcRadii.pill,
  borderWidth: 1,
  borderColor: gourmeatColors.border,
  backgroundColor: gourmeatColors.surface,
};
const reviewPillText = { fontSize: 12, fontWeight: '700', color: gourmeatColors.text };
function chipStyle(active: boolean) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: shcRadii.pill,
    borderWidth: 1,
    borderColor: active ? gourmeatColors.primary : gourmeatColors.border,
    backgroundColor: active ? gourmeatColors.primary : gourmeatColors.surface,
    ...gourmeatShadows.soft,
  };
}
function chipText(active: boolean) {
  return { fontSize: 13, fontWeight: '800', color: active ? '#fff' : shcColors.text };
}

/** Discover/home footer CTA — drives users to the request wizard. */
export function SHCRequestDishHomeCTA({
  onPress,
  testID = 'open-request-page-btn',
  copy: copyProp,
}: {
  onPress: () => void;
  testID?: string;
  copy?: Pick<RequestDishCopyInput, 'homeCtaTitle' | 'homeCtaSubtitle'>;
}) {
  const copy = { ...DEFAULT_COPY, ...copyProp };
  return (
    <Pressable onPress={onPress} testID={testID} style={{ marginTop: shcSpacing.section }}>
      <View
        style={{
          minHeight: 168,
          borderRadius: shcRadii.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: gourmeatColors.border,
          ...gourmeatShadows.soft,
        }}
      >
        <SHCFoodImage uri={BENTO_ACTION_IMAGES.request} height={168} rounded={0} />
        <View
          style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: 'rgba(36,24,18,0.45)',
            justifyContent: 'flex-end',
            padding: shcSpacing.md,
          }}
        >
          <SHCCard style={{ backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: gourmeatColors.primaryLight,
                  borderWidth: 1,
                  borderColor: gourmeatColors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SHCIcon name="request" size={24} color={shcColors.primary} active />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: shcColors.text }}>{copy.homeCtaTitle}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 2, lineHeight: 16 }}>
                  {copy.homeCtaSubtitle}
                </Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: shcColors.primary }}>→</Text>
            </View>
          </SHCCard>
        </View>
      </View>
    </Pressable>
  );
}

/** Success screen after posting */
export function RequestDishSuccess({
  requestId,
  onViewProfile,
  onDiscover,
  testID = 'request-success',
  copy: copyProp,
}: {
  requestId?: string;
  onViewProfile?: () => void;
  onDiscover?: () => void;
  testID?: string;
  copy?: RequestDishCopyInput;
}) {
  const copy = copyProp ?? DEFAULT_COPY;
  return (
    <View
      testID={testID}
      style={{
        flex: 1,
        backgroundColor: gourmeatColors.background,
        padding: shcSpacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <SHCFadeIn>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: gourmeatColors.primaryLight,
            borderWidth: 1,
            borderColor: gourmeatColors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: shcSpacing.lg,
            ...gourmeatShadows.soft,
          }}
        >
          <SHCIcon name="checkmark" size={36} color={shcColors.success} active />
        </View>
        <Text style={{ fontSize: 26, fontWeight: '900', color: shcColors.text, textAlign: 'center' }}>{copy.successTitle}</Text>
        <Text style={{ fontSize: 14, color: shcColors.textLight, textAlign: 'center', marginTop: shcSpacing.sm, lineHeight: 20, maxWidth: 300 }}>
          {requestId ? copy.successWithId.replace('{id}', requestId) : copy.successBody}
        </Text>
        <View style={{ marginTop: shcSpacing.xl, gap: shcSpacing.sm, width: '100%', maxWidth: 320 }}>
          {onDiscover && (
            <SHCButton size="lg" appearance="customer" onPress={onDiscover} testID="request-success-discover">
              <SHCButtonText>{copy.successBrowseWait}</SHCButtonText>
            </SHCButton>
          )}
          {onViewProfile && (
            <SHCButton variant="outline" appearance="customer" onPress={onViewProfile} testID="request-success-profile">
              <SHCButtonText variant="outline">{copy.backProfile}</SHCButtonText>
            </SHCButton>
          )}
        </View>
      </SHCFadeIn>
    </View>
  );
}