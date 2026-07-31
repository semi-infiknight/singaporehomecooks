// Custom dish request cards — customer orders tab + detail (tri-platform mobile; web mirror in SHCWebComponents).
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, TextInput, Switch } from 'react-native';
import {
  CUSTOM_REQUEST_COPY,
  customRequestStatusLabel,
  formatQuoteTotal,
  parseCustomRequestDisplay,
  parseCookQuoteDisplay,
  shcGuestCountBadgeLabel,
  shcServingsBadgeLabel,
  buildDefaultQuoteLines,
  validateClientQuoteLines,
  sumIncludedQuoteCents,
  type CookQuoteDisplay,
  type CookQuoteLineItem,
  type CustomRequestDisplay,
  parseBidDollarsToCents,
} from '@shc/utils';
import { getDishImageUrl, getOccasionImageUrl } from '@shc/utils';
import { shcColors, shcSpacing, shcBorders, shcRadii, shcShadows, gourmeatColors } from './theme';
import { SHCFoodImage } from './visuals';
import { SHCButton, SHCButtonText, SHCBadge, SHCCard, SHCMetaBadge } from './primitives';

export function SHCCustomRequestCard({
  request,
  quoteCount = 0,
  onPress,
  testID,
}: {
  request: Record<string, unknown>;
  quoteCount?: number;
  onPress?: () => void;
  testID?: string;
}) {
  const parsed = parseCustomRequestDisplay(request);
  const heroUri =
    (parsed.occasion && getOccasionImageUrl(parsed.occasion)) ||
    getDishImageUrl({ name: parsed.lines[0]?.name || parsed.summary });
  const firstLine = parsed.lines[0];
  const moreCount = parsed.lines.length - 1;

  return (
    <Pressable onPress={onPress} testID={testID} disabled={!onPress}>
      <SHCCard style={{ marginBottom: shcSpacing.sm, overflow: 'hidden', padding: 0 }}>
        <View style={{ flexDirection: 'row', minHeight: 88 }}>
          <SHCFoodImage uri={heroUri} width={88} height={88} rounded={0} />
          <View style={{ flex: 1, padding: shcSpacing.sm, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ flex: 1, fontWeight: '800', fontSize: 14, color: shcColors.text }} numberOfLines={2}>
                {firstLine?.name || parsed.summary}
                {moreCount > 0 ? ` +${moreCount} more` : ''}
              </Text>
              <SHCBadge variant={parsed.status === 'matched' ? 'success' : 'warning'}>
                {customRequestStatusLabel(parsed.status)}
              </SHCBadge>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {firstLine ? <SHCMetaBadge kind="portion_min">{shcServingsBadgeLabel(firstLine.servings)}</SHCMetaBadge> : null}
              {parsed.guest_count ? <SHCMetaBadge kind="party_size">{shcGuestCountBadgeLabel(parsed.guest_count)}</SHCMetaBadge> : null}
              {parsed.date ? <SHCMetaBadge kind="date">{parsed.date}</SHCMetaBadge> : null}
            </View>
            {quoteCount > 0 ? (
              <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.primary, marginTop: 6 }}>
                {quoteCount} cook {quoteCount === 1 ? CUSTOM_REQUEST_COPY.quoteNoun : CUSTOM_REQUEST_COPY.quoteNounPlural}
              </Text>
            ) : parsed.status === 'open' || parsed.status === 'bidding' ? (
              <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 6 }}>
                {CUSTOM_REQUEST_COPY.noQuotesYet}
              </Text>
            ) : null}
          </View>
        </View>
      </SHCCard>
    </Pressable>
  );
}

export function SHCCookQuoteCard({
  quote,
  cookName,
  onAccept,
  accepting,
  requestLines,
  testID,
}: {
  quote: CookQuoteDisplay | Record<string, unknown>;
  cookName?: string;
  onAccept?: () => void;
  accepting?: boolean;
  requestLines?: CustomRequestDisplay['lines'];
  testID?: string;
}) {
  const parsed =
    quote && (quote as CookQuoteDisplay).line_items
      ? (quote as CookQuoteDisplay)
      : parseCookQuoteDisplay(quote as Record<string, unknown>, requestLines);
  const pending = parsed.status === 'pending';
  const includedLines = (parsed.line_items || []).filter((l) => l.included);
  return (
    <SHCCard testID={testID} style={{ marginTop: shcSpacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: shcSpacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '900', fontSize: 15, color: shcColors.text }}>{cookName || parsed.cook_name || 'Home cook'}</Text>
          {parsed.message ? (
            <Text style={{ fontSize: 13, color: shcColors.textLight, marginTop: 4, lineHeight: 18 }}>{parsed.message}</Text>
          ) : null}
        </View>
        <Text style={{ fontWeight: '900', fontSize: 16, color: shcColors.primary }}>{formatQuoteTotal(parsed.price_cents)}</Text>
      </View>
      {includedLines.length > 0 ? (
        <View style={{ marginTop: shcSpacing.sm, gap: 4 }}>
          {includedLines.map((line) => (
            <View key={line.request_line_id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, flex: 1 }} numberOfLines={1}>
                {line.name || 'Dish'} · {shcServingsBadgeLabel(line.servings || 1)}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: shcColors.text }}>{formatQuoteTotal(line.price_cents)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {pending && onAccept ? (
        <SHCButton onPress={onAccept} disabled={accepting} style={{ marginTop: shcSpacing.sm }} testID={testID ? `${testID}-accept` : undefined}>
          <SHCButtonText>{accepting ? 'Accepting…' : CUSTOM_REQUEST_COPY.acceptQuote}</SHCButtonText>
        </SHCButton>
      ) : quote.status === 'accepted' ? (
        <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.success, marginTop: shcSpacing.sm }}>
          {CUSTOM_REQUEST_COPY.quoteAccepted}
        </Text>
      ) : null}
    </SHCCard>
  );
}

export function SHCCookQuoteBuilder({
  request,
  onSubmit,
  busy = false,
  testID,
}: {
  request: Record<string, unknown>;
  onSubmit: (payload: {
    line_items: CookQuoteLineItem[];
    message?: string;
    price_cents: number;
  }) => void | Promise<void>;
  busy?: boolean;
  testID?: string;
}) {
  const parsed = parseCustomRequestDisplay(request);
  const [lines, setLines] = React.useState<CookQuoteLineItem[]>(() => buildDefaultQuoteLines(parsed.lines));
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setLines(buildDefaultQuoteLines(parseCustomRequestDisplay(request).lines));
  }, [request.id]);

  const total = sumIncludedQuoteCents(lines);

  const updateLine = (id: string, patch: Partial<CookQuoteLineItem>) => {
    setLines((prev) => prev.map((l) => (l.request_line_id === id ? { ...l, ...patch } : l)));
  };

  const handlePriceInput = (id: string, raw: string) => {
    const parsedPrice = parseBidDollarsToCents(raw);
    updateLine(id, { price_cents: parsedPrice.ok ? parsedPrice.cents : 0 });
  };

  const handleSend = async () => {
    setError('');
    const check = validateClientQuoteLines(lines);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    await onSubmit({
      line_items: lines,
      message: message.trim() || undefined,
      price_cents: total,
    });
  };

  return (
    <View testID={testID}>
      {parsed.lines.map((reqLine) => {
        const qLine = lines.find((l) => l.request_line_id === reqLine.id);
        if (!qLine) return null;
        return (
          <View
            key={reqLine.id}
            style={{
              borderWidth: shcBorders.brutal,
              borderColor: shcColors.border,
              borderRadius: shcRadii.md,
              padding: shcSpacing.sm,
              marginBottom: shcSpacing.sm,
              backgroundColor: qLine.included ? shcColors.surface : shcColors.surfaceMuted,
            }}
            testID={`quote-line-${reqLine.id}`}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 14, color: shcColors.text }}>{reqLine.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight }}>{shcServingsBadgeLabel(reqLine.servings)}</Text>
              </View>
              <Switch
                value={qLine.included}
                onValueChange={(v) => updateLine(reqLine.id, { included: v })}
                testID={`quote-include-${reqLine.id}`}
              />
            </View>
            {qLine.included ? (
              <TextInput
                placeholder="Price S$ (e.g. 45)"
                placeholderTextColor={shcColors.textLight}
                keyboardType="decimal-pad"
                onChangeText={(t) => handlePriceInput(reqLine.id, t)}
                style={{
                  marginTop: shcSpacing.sm,
                  borderWidth: 1,
                  borderColor: shcColors.border,
                  borderRadius: shcRadii.sm,
                  padding: shcSpacing.sm,
                  fontWeight: '700',
                  color: shcColors.text,
                }}
                testID={`quote-price-${reqLine.id}`}
              />
            ) : (
              <Text style={{ fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginTop: 6 }}>Not included in quote</Text>
            )}
          </View>
        );
      })}
      <TextInput
        placeholder="Message to customer (optional)"
        placeholderTextColor={shcColors.textLight}
        value={message}
        onChangeText={setMessage}
        multiline
        style={{
          borderWidth: shcBorders.brutal,
          borderColor: shcColors.border,
          borderRadius: shcRadii.md,
          padding: shcSpacing.sm,
          minHeight: 64,
          textAlignVertical: 'top',
          fontWeight: '600',
          color: shcColors.text,
          marginBottom: shcSpacing.sm,
        }}
        testID="quote-message"
      />
      <Text style={{ fontWeight: '900', fontSize: 15, color: shcColors.text, marginBottom: shcSpacing.sm }}>
        Quote total: {formatQuoteTotal(total)}
      </Text>
      {error ? <Text style={{ color: shcColors.error, fontWeight: '700', marginBottom: shcSpacing.sm }}>{error}</Text> : null}
      <SHCButton onPress={handleSend} disabled={busy} testID={testID ? `${testID}-send` : 'quote-send-btn'}>
        <SHCButtonText>{busy ? 'Sending…' : CUSTOM_REQUEST_COPY.sendQuote}</SHCButtonText>
      </SHCButton>
    </View>
  );
}

export function SHCCustomRequestDetailHeader({ parsed, testID }: { parsed: CustomRequestDisplay; testID?: string }) {
  const heroUri =
    (parsed.occasion && getOccasionImageUrl(parsed.occasion)) ||
    getDishImageUrl({ name: parsed.lines[0]?.name || parsed.summary });
  return (
    <View testID={testID}>
      <SHCFoodImage uri={heroUri} height={180} rounded={shcRadii.lg} testID="request-detail-hero" />
      <View style={{ marginTop: shcSpacing.md }}>
        <SHCBadge variant={parsed.status === 'matched' ? 'success' : 'warning'}>{customRequestStatusLabel(parsed.status)}</SHCBadge>
        <Text style={{ fontSize: 20, fontWeight: '900', color: shcColors.text, marginTop: shcSpacing.sm }}>
          {CUSTOM_REQUEST_COPY.customerSectionTitle}
        </Text>
        {parsed.occasion ? (
          <Text style={{ fontSize: 13, fontWeight: '700', color: shcColors.textLight, marginTop: 4 }}>{parsed.occasion}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function SHCCustomRequestLineList({ lines, testID }: { lines: CustomRequestDisplay['lines']; testID?: string }) {
  return (
    <View testID={testID} style={{ marginTop: shcSpacing.md, gap: shcSpacing.sm }}>
      {lines.map((line) => (
        <View
          key={line.id}
          style={{
            flexDirection: 'row',
            gap: shcSpacing.sm,
            alignItems: 'center',
            borderWidth: shcBorders.brutal,
            borderColor: shcColors.border,
            borderRadius: shcRadii.md,
            padding: shcSpacing.sm,
            backgroundColor: shcColors.surface,
            ...shcShadows.brutalSm,
          }}
        >
          <SHCFoodImage uri={getDishImageUrl({ name: line.name })} width={56} height={56} rounded={shcRadii.md} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: shcColors.text }} numberOfLines={2}>
              {line.name}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 2 }}>
              {shcServingsBadgeLabel(line.servings)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
