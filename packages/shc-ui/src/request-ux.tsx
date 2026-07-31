// Immersive recipe-request wizard — occasion story → inspiration → gathering → review.
// @ts-nocheck
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { BENTO_ACTION_IMAGES, getOccasionImageUrl, defaultListingOccasionTagOptions, newRequestDishLine, buildRequestBodyFromItems } from '@shc/utils';
import { shcColors, shcSpacing, shcBorders, shcRadii, shcShadows, shcSectionStack, gourmeatColors } from './theme';
import { SHCFoodImage } from './visuals';
import { SHCIcon } from './icons';
import { SHCButton, SHCButtonText, SHCCard } from './primitives';
import { SHCCheckoutStepper } from './food-ux';
import { SHCWizardPane, SHCFadeIn } from './motion';
import { OccasionTagPicker } from './occasion-picker';

export type RequestDishPayload = {
  body: string;
  items: Array<{ id: string; name: string; servings: number; notes?: string; youtube_url?: string }>;
  youtube_url?: string;
  party_size?: number;
  guest_count?: number;
  budget_cents?: number;
  date?: string;
  occasion?: string;
};

const STEPS = [
  { id: 'occasion', label: 'Occasion' },
  { id: 'dishes', label: 'Dishes' },
  { id: 'gathering', label: 'Gathering' },
  { id: 'review', label: 'Review' },
];

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
  occasionOptions = defaultListingOccasionTagOptions(),
  defaultOccasion = defaultListingOccasionTagOptions()[0] || 'Hari Raya',
}: {
  onSubmit: (data: RequestDishPayload) => void | Promise<void>;
  onBack?: () => void;
  busy?: boolean;
  /** Safe area + tab bar clearance for bottom CTAs */
  bottomInset?: number;
  testID?: string;
  /** Admin-managed occasion labels from customer browse config */
  occasionOptions?: string[];
  defaultOccasion?: string;
}) {
  const [step, setStep] = React.useState(1);
  const [occasion, setOccasion] = React.useState(defaultOccasion);
  const [context, setContext] = React.useState('Family gathering — mix of mains and sides.');
  const [dishLines, setDishLines] = React.useState(() => [
    newRequestDishLine({ name: 'Nasi lemak with sambal prawns', servings: 8 }),
  ]);
  const [youtube, setYoutube] = React.useState('');
  const [guestCount, setGuestCount] = React.useState(8);
  const [budget, setBudget] = React.useState(120);
  const [date, setDate] = React.useState(defaultDate);

  React.useEffect(() => {
    if (!occasion && defaultOccasion) setOccasion(defaultOccasion);
  }, [defaultOccasion, occasion]);

  const heroUri = occasion ? getOccasionImageUrl(occasion) : BENTO_ACTION_IMAGES.request;
  const stepMeta = STEPS[step - 1];

  const body = buildRequestBodyFromItems(occasion, dishLines, context);
  const totalServings = dishLines.reduce((s, l) => s + Math.max(1, l.servings), 0);

  const canNext =
    step === 1
      ? Boolean(occasion)
      : step === 2
        ? dishLines.some((l) => l.name.trim().length >= 2)
        : step === 3
          ? guestCount >= 2 && budget >= 20 && /^\d{4}-\d{2}-\d{2}$/.test(date)
          : body.length >= 10;

  const goNext = () => {
    if (step < 4 && canNext) setStep((s) => s + 1);
    else if (step === 4 && canNext && !busy) {
      onSubmit({
        body,
        items: dishLines
          .filter((l) => l.name.trim().length >= 2)
          .map((l) => ({
            id: l.id,
            name: l.name.trim(),
            servings: Math.max(1, l.servings),
            notes: l.notes,
            youtube_url: l.youtube_url,
          })),
        youtube_url: youtube.trim() || undefined,
        party_size: dishLines[0]?.servings,
        guest_count: guestCount,
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
                STEP {step} OF 4
              </Text>
            </View>
            <SHCFadeIn key={stepMeta.id}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 34 }}>
                Request a custom dish
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 6 }}>
                {step === 1 && 'Pick an occasion and optional context'}
                {step === 2 && 'Add each dish with servings — cooks quote per line'}
                {step === 3 && 'Guest count, budget, date, and optional YouTube'}
                {step === 4 && 'Review before cooks send quotes'}
              </Text>
            </SHCFadeIn>
          </View>
        </View>

        <View style={{ paddingHorizontal: shcSpacing.md, marginTop: shcSpacing.md }}>
          <SHCCheckoutStepper steps={STEPS} currentStep={step} testID="request-stepper" />
        </View>

        <View style={{ paddingHorizontal: shcSpacing.md }}>
          <SHCWizardPane stepKey={step}>
            {step === 1 && (
              <View testID="request-step-occasion">
                <Text style={labelStyle}>What&apos;s the occasion?</Text>
                <OccasionTagPicker
                  selected={[occasion]}
                  onToggle={(tag) => setOccasion(tag)}
                  options={occasionOptions}
                />
                <Text style={[labelStyle, { marginTop: shcSpacing.md }]}>Context (optional)</Text>
                <TextInput
                  value={context}
                  onChangeText={setContext}
                  multiline
                  placeholder="e.g. Hari Raya open house, halal-friendly, medium spice…"
                  placeholderTextColor={shcColors.textLight}
                  style={inputMultiline}
                  testID="request-context"
                />
              </View>
            )}

            {step === 2 && (
              <View testID="request-step-dishes">
                <Text style={labelStyle}>Dishes you want</Text>
                <Text style={[hintStyle, { marginTop: 0, marginBottom: shcSpacing.sm }]}>
                  Add each dish separately — cooks can quote per item.
                </Text>
                {dishLines.map((line, idx) => (
                  <View key={line.id} style={{ marginBottom: shcSpacing.md }}>
                    <TextInput
                      value={line.name}
                      onChangeText={(t) =>
                        setDishLines((rows) => rows.map((r) => (r.id === line.id ? { ...r, name: t } : r)))
                      }
                      placeholder={`Dish ${idx + 1} name`}
                      placeholderTextColor={shcColors.textLight}
                      style={inputSingle}
                      testID={`request-dish-name-${idx}`}
                    />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {PARTY_PRESETS.map((n) => (
                        <Pressable
                          key={`${line.id}-${n}`}
                          onPress={() =>
                            setDishLines((rows) => rows.map((r) => (r.id === line.id ? { ...r, servings: n } : r)))
                          }
                          style={chipStyle(line.servings === n)}
                          testID={`request-dish-servings-${idx}-${n}`}
                        >
                          <Text style={chipText(line.servings === n)}>{n} servings</Text>
                        </Pressable>
                      ))}
                    </View>
                    {dishLines.length > 1 ? (
                      <Pressable
                        onPress={() => setDishLines((rows) => rows.filter((r) => r.id !== line.id))}
                        style={{ marginTop: 6 }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.error }}>Remove dish</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
                {dishLines.length < 8 ? (
                  <Pressable
                    onPress={() => setDishLines((rows) => [...rows, newRequestDishLine()])}
                    testID="request-add-dish"
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: shcColors.primary }}>+ Add another dish</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {step === 3 && (
              <View testID="request-step-gathering">
                <Text style={labelStyle}>Guest count</Text>
                <Text style={[hintStyle, { marginTop: 0, marginBottom: shcSpacing.sm }]}>
                  How many people are eating — not the same as per-dish servings.
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: shcSpacing.md }}>
                  {PARTY_PRESETS.map((n) => (
                    <Pressable
                      key={`g-${n}`}
                      onPress={() => setGuestCount(n)}
                      style={chipStyle(guestCount === n)}
                      testID={`request-guests-${n}`}
                    >
                      <Text style={chipText(guestCount === n)}>{n} guests</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={labelStyle}>YouTube URL (optional)</Text>
                <TextInput
                  value={youtube}
                  onChangeText={setYoutube}
                  autoCapitalize="none"
                  keyboardType="url"
                  placeholder="https://youtube.com/watch?v=…"
                  placeholderTextColor={shcColors.textLight}
                  style={inputSingle}
                  testID="request-yt"
                />
                <Text style={labelStyle}>Budget (S$)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: shcSpacing.md }}>
                  {BUDGET_PRESETS.map((b) => (
                    <Pressable key={b} onPress={() => setBudget(b)} style={chipStyle(budget === b)} testID={`request-budget-${b}`}>
                      <Text style={chipText(budget === b)}>S${b}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={labelStyle}>Collection date</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={shcColors.textLight}
                  style={inputSingle}
                  testID="request-date"
                />
                <Text style={hintStyle}>HDB collection only — exact block released 2h before slot.</Text>
              </View>
            )}

            {step === 4 && (
              <View testID="request-step-review">
                <SHCCard variant="bento-mint" style={{ marginBottom: shcSpacing.md }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.textLight, letterSpacing: 0.5 }}>YOUR REQUEST</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: shcColors.text, marginTop: 6, lineHeight: 22 }}>{body}</Text>
                  {dishLines.map((line) => (
                    <Text key={line.id} style={{ fontSize: 13, fontWeight: '700', color: shcColors.text, marginTop: 6 }}>
                      · {line.name} ({line.servings} servings)
                    </Text>
                  ))}
                  {youtube.trim() ? (
                    <Text style={{ fontSize: 12, color: shcColors.primary, marginTop: 8, fontWeight: '600' }} numberOfLines={1}>
                      📺 {youtube.trim()}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: shcSpacing.md }}>
                    <View style={reviewPill}>
                      <SHCIcon name="people" size={14} color={shcColors.text} />
                      <Text style={reviewPillText}>{dishLines.length} dishes · {totalServings} servings · {guestCount} guests</Text>
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
                  <Text style={{ fontSize: 13, fontWeight: '700', color: shcColors.text, lineHeight: 20 }}>
                    Cooks will send quotes with price and a personal note. Accept a quote to create your order — same trust layers as regular checkout.
                  </Text>
                </SHCCard>
              </View>
            )}
          </SHCWizardPane>
        </View>

        <View style={{ paddingHorizontal: shcSpacing.md, marginTop: shcSpacing.lg, gap: shcSpacing.sm, alignSelf: 'stretch' }}>
          <SHCButton onPress={goNext} disabled={!canNext || busy} size="lg" testID="submit-request-btn" style={{ alignSelf: 'stretch', width: '100%' }}>
            <SHCButtonText>{busy ? 'Posting…' : step === 4 ? 'Post request — cooks will quote' : 'Continue'}</SHCButtonText>
          </SHCButton>
          {step > 1 && (
            <SHCButton variant="outline" onPress={goBack} disabled={busy}>
              <SHCButtonText variant="outline">Back</SHCButtonText>
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
  borderWidth: shcBorders.brutal,
  borderColor: shcColors.border,
  borderRadius: shcRadii.md,
  padding: shcSpacing.md,
  backgroundColor: shcColors.surface,
  fontSize: 15,
  color: shcColors.text,
  ...shcShadows.brutalSm,
};
const inputMultiline = { ...inputSingle, minHeight: 120, textAlignVertical: 'top' as const };
const reviewPill = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: shcRadii.pill,
  borderWidth: shcBorders.brutal,
  borderColor: shcColors.border,
  backgroundColor: shcColors.surface,
};
const reviewPillText = { fontSize: 12, fontWeight: '700', color: shcColors.text };
function chipStyle(active: boolean) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: shcRadii.pill,
    borderWidth: shcBorders.brutal,
    borderColor: active ? gourmeatColors.primary : shcColors.border,
    backgroundColor: active ? gourmeatColors.primary : shcColors.surface,
    ...shcShadows.brutalSm,
  };
}
function chipText(active: boolean) {
  return { fontSize: 13, fontWeight: '800', color: active ? '#fff' : shcColors.text };
}

/** Discover/home footer CTA — drives users to the request wizard. */
export function SHCRequestDishHomeCTA({
  onPress,
  testID = 'open-request-page-btn',
}: {
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable onPress={onPress} testID={testID} style={shcSectionStack}>
      <View
        style={{
          minHeight: 168,
          borderRadius: shcRadii.lg,
          overflow: 'hidden',
          borderWidth: shcBorders.brutal,
          borderColor: shcColors.border,
          ...shcShadows.brutalSm,
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
                  backgroundColor: shcColors.bentoPeach,
                  borderWidth: shcBorders.brutal,
                  borderColor: shcColors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SHCIcon name="request" size={24} color={shcColors.primary} active />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: shcColors.text }}>Request a custom dish</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 2, lineHeight: 16 }}>
                  4-step wizard — occasion, inspiration, gathering, review
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
}: {
  requestId?: string;
  onViewProfile?: () => void;
  onDiscover?: () => void;
  testID?: string;
}) {
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
            backgroundColor: shcColors.bentoMint,
            borderWidth: shcBorders.brutal,
            borderColor: shcColors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: shcSpacing.lg,
            ...shcShadows.brutal,
          }}
        >
          <SHCIcon name="checkmark" size={36} color={shcColors.success} active />
        </View>
        <Text style={{ fontSize: 26, fontWeight: '900', color: shcColors.text, textAlign: 'center' }}>Request posted!</Text>
        <Text style={{ fontSize: 14, color: shcColors.textLight, textAlign: 'center', marginTop: shcSpacing.sm, lineHeight: 20, maxWidth: 300 }}>
          {requestId
            ? `Request ${requestId} is live. Home cooks will send quotes — check Orders → Custom requests for updates.`
            : 'Home cooks will quote soon. Check Orders → Custom requests for offers.'}
        </Text>
        <View style={{ marginTop: shcSpacing.xl, gap: shcSpacing.sm, width: '100%', maxWidth: 320 }}>
          {onDiscover && (
            <SHCButton size="lg" onPress={onDiscover} testID="request-success-discover">
              <SHCButtonText>Browse dishes while you wait</SHCButtonText>
            </SHCButton>
          )}
          {onViewProfile && (
            <SHCButton variant="outline" onPress={onViewProfile} testID="request-success-profile">
              <SHCButtonText variant="outline">Back to profile</SHCButtonText>
            </SHCButton>
          )}
        </View>
      </SHCFadeIn>
    </View>
  );
}