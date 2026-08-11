// Custom dish request cards — customer orders tab + detail (tri-platform mobile; web mirror in SHCWebComponents).
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import {
  CUSTOM_REQUEST_COPY,
  customRequestStatusLabel,
  formatQuoteTotal,
  parseCustomRequestDisplay,
  parseCookQuoteDisplay,
  shcGuestCountBadgeLabel,
  shcServingsBadgeLabel,
  buildDefaultQuoteLines,
  buildQuoteLinesFromSaved,
  validateClientQuoteLines,
  sumIncludedQuoteCents,
  defaultCustomerAcceptLineIds,
  sumCustomerAcceptCents,
  validateCustomerAcceptLines,
  toggleCustomerAcceptLine,
  cookIncludedQuoteLines,
  parseBidDollarsToCents,
  formatBidCentsAsDollars,
  getDishImageUrl,
  getOccasionImageUrl,
  type CookQuoteDisplay,
  type CookQuoteLineItem,
  type CustomRequestDisplay,
} from '@shc/utils';
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

/** Cook marketplace — open request card with optional bid-sent badge. */
export function SHCCookOpenRequestCard({
  request,
  bidSent = false,
  bidStatus,
  onPress,
  testID,
}: {
  request: Record<string, unknown>;
  bidSent?: boolean;
  bidStatus?: string;
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
        <View style={{ flexDirection: 'row', minHeight: 96 }}>
          <SHCFoodImage uri={heroUri} width={96} height={96} rounded={0} />
          <View style={{ flex: 1, padding: shcSpacing.sm, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ flex: 1, fontWeight: '800', fontSize: 14, color: shcColors.text }} numberOfLines={2}>
                {firstLine?.name || parsed.summary}
                {moreCount > 0 ? ` +${moreCount} more` : ''}
              </Text>
              {bidSent ? (
                <SHCBadge variant={bidStatus === 'accepted' ? 'success' : 'warning'}>
                  {CUSTOM_REQUEST_COPY.bidSentLabel}
                </SHCBadge>
              ) : (
                <SHCBadge variant="warning">Open</SHCBadge>
              )}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {firstLine ? <SHCMetaBadge kind="portion_min">{shcServingsBadgeLabel(firstLine.servings)}</SHCMetaBadge> : null}
              {parsed.guest_count ? <SHCMetaBadge kind="party_size">{shcGuestCountBadgeLabel(parsed.guest_count)}</SHCMetaBadge> : null}
              {parsed.date ? <SHCMetaBadge kind="date">{parsed.date}</SHCMetaBadge> : null}
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.primary, marginTop: 8 }}>
              {bidSent ? 'View your bid →' : 'Tap to quote dishes →'}
            </Text>
          </View>
        </View>
      </SHCCard>
    </Pressable>
  );
}

/** Cook request detail — one dish row linking to per-dish quote screen. */
export function SHCCookRequestDishRow({
  line,
  quoteLine,
  onPress,
  testID,
}: {
  line: CustomRequestDisplay['lines'][number];
  quoteLine?: CookQuoteLineItem;
  onPress?: () => void;
  testID?: string;
}) {
  const included = quoteLine?.included;
  const priced = included && (quoteLine?.price_cents || 0) > 0;
  const statusLabel = !included ? 'Skipped' : priced ? formatQuoteTotal(quoteLine!.price_cents) : 'Set price';

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={{
        flexDirection: 'row',
        gap: shcSpacing.sm,
        alignItems: 'center',
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        borderRadius: shcRadii.md,
        padding: shcSpacing.sm,
        backgroundColor: included ? shcColors.surface : shcColors.surfaceMuted,
        marginBottom: shcSpacing.sm,
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
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '900',
            color: priced ? shcColors.primary : included ? shcColors.text : shcColors.textLight,
          }}
        >
          {statusLabel}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: shcColors.primary }}>Open →</Text>
      </View>
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
  onAccept?: (acceptedLineIds: string[]) => void | Promise<void>;
  accepting?: boolean;
  requestLines?: CustomRequestDisplay['lines'];
  testID?: string;
}) {
  const parsed =
    quote && (quote as CookQuoteDisplay).line_items
      ? (quote as CookQuoteDisplay)
      : parseCookQuoteDisplay(quote as Record<string, unknown>, requestLines);
  const pending = parsed.status === 'pending';
  const includedLines = cookIncludedQuoteLines(parsed.line_items);
  const partialAccept = includedLines.length > 1;
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() => defaultCustomerAcceptLineIds(parsed.line_items));
  const [acceptError, setAcceptError] = React.useState('');

  React.useEffect(() => {
    setSelectedIds(defaultCustomerAcceptLineIds(parsed.line_items));
    setAcceptError('');
  }, [parsed.id]);

  const displayTotal = partialAccept
    ? sumCustomerAcceptCents(parsed.line_items || [], selectedIds)
    : parsed.price_cents;

  const handleAccept = async () => {
    if (!onAccept) return;
    setAcceptError('');
    const check = validateCustomerAcceptLines(parsed.line_items || [], selectedIds);
    if (!check.ok) {
      setAcceptError(check.message);
      return;
    }
    const ids = partialAccept ? selectedIds : undefined;
    await onAccept(ids?.length ? ids : defaultCustomerAcceptLineIds(parsed.line_items));
  };

  return (
    <SHCCard testID={testID} style={{ marginTop: shcSpacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: shcSpacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '900', fontSize: 15, color: shcColors.text }}>{cookName || parsed.cook_name || 'Home cook'}</Text>
          {parsed.message ? (
            <Text style={{ fontSize: 13, color: shcColors.textLight, marginTop: 4, lineHeight: 18 }}>{parsed.message}</Text>
          ) : null}
        </View>
        <Text style={{ fontWeight: '900', fontSize: 16, color: shcColors.primary }}>{formatQuoteTotal(displayTotal)}</Text>
      </View>
      {includedLines.length > 0 ? (
        <View style={{ marginTop: shcSpacing.sm, gap: 4 }}>
          {includedLines.map((line) => {
            const selected = !partialAccept || selectedIds.includes(line.request_line_id);
            return (
              <Pressable
                key={line.request_line_id}
                onPress={
                  partialAccept && pending
                    ? () => setSelectedIds((prev) => toggleCustomerAcceptLine(prev, line.request_line_id))
                    : undefined
                }
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: partialAccept && !selected ? 0.55 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  {partialAccept && pending ? (
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: shcColors.border,
                        backgroundColor: selected ? shcColors.primary : shcColors.surface,
                      }}
                    />
                  ) : null}
                  <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, flex: 1 }} numberOfLines={1}>
                    {line.name || 'Dish'} · {shcServingsBadgeLabel(line.servings || 1)}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: shcColors.text }}>{formatQuoteTotal(line.price_cents)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {acceptError ? (
        <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.error, marginTop: shcSpacing.sm }}>{acceptError}</Text>
      ) : null}
      {pending && onAccept ? (
        <SHCButton onPress={handleAccept} disabled={accepting} style={{ marginTop: shcSpacing.sm }} testID={testID ? `${testID}-accept` : undefined}>
          <SHCButtonText>
            {accepting ? 'Accepting…' : partialAccept ? CUSTOM_REQUEST_COPY.acceptSelected : CUSTOM_REQUEST_COPY.acceptQuote}
          </SHCButtonText>
        </SHCButton>
      ) : quote.status === 'accepted' ? (
        <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.success, marginTop: shcSpacing.sm }}>
          {CUSTOM_REQUEST_COPY.quoteAccepted}
        </Text>
      ) : null}
    </SHCCard>
  );
}

export function SHCCookSavedQuote({
  quote,
  requestLines,
  onEdit,
  testID,
}: {
  quote: CookQuoteDisplay | Record<string, unknown>;
  requestLines?: CustomRequestDisplay['lines'];
  onEdit?: () => void;
  testID?: string;
}) {
  const parsed =
    quote && (quote as CookQuoteDisplay).line_items
      ? (quote as CookQuoteDisplay)
      : parseCookQuoteDisplay(quote as Record<string, unknown>, requestLines);
  const included = cookIncludedQuoteLines(parsed.line_items || []);

  return (
    <View
      testID={testID}
      style={{
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        borderRadius: shcRadii.md,
        padding: shcSpacing.sm,
        backgroundColor: shcColors.bentoMint,
        marginTop: shcSpacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontWeight: '900', fontSize: 14, color: shcColors.text }}>{CUSTOM_REQUEST_COPY.quoteSaved}</Text>
        <SHCBadge variant={parsed.status === 'accepted' ? 'success' : 'warning'}>
          {parsed.status === 'pending' ? 'Waiting' : parsed.status}
        </SHCBadge>
      </View>
      {included.map((line) => (
        <Text key={line.request_line_id} style={{ fontSize: 13, fontWeight: '700', color: shcColors.text, marginTop: 6 }}>
          · {line.name || 'Dish'} — {formatQuoteTotal(line.price_cents)}
        </Text>
      ))}
      <Text style={{ fontSize: 15, fontWeight: '900', color: shcColors.primary, marginTop: shcSpacing.sm }}>
        Total {formatQuoteTotal(parsed.price_cents)}
      </Text>
      {parsed.message ? (
        <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.text, marginTop: 6 }} numberOfLines={3}>
          “{parsed.message}”
        </Text>
      ) : null}
      {onEdit && parsed.status === 'pending' ? (
        <Pressable onPress={onEdit} style={{ marginTop: shcSpacing.sm }} testID={testID ? `${testID}-edit` : 'cook-saved-quote-edit'}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: shcColors.primary }}>{CUSTOM_REQUEST_COPY.updateQuote}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SHCCookQuoteBuilder({
  request,
  onSubmit,
  busy = false,
  testID,
  initialQuote,
  submitLabel,
  lines: controlledLines,
  message: controlledMessage,
  onLinesChange,
  onMessageChange,
  hideDishRows = false,
}: {
  request: Record<string, unknown>;
  onSubmit: (payload: {
    line_items: CookQuoteLineItem[];
    message?: string;
    price_cents: number;
  }) => void | Promise<void>;
  busy?: boolean;
  testID?: string;
  initialQuote?: CookQuoteDisplay | Record<string, unknown>;
  submitLabel?: string;
  lines?: CookQuoteLineItem[];
  message?: string;
  onLinesChange?: (lines: CookQuoteLineItem[]) => void;
  onMessageChange?: (message: string) => void;
  /** When true, only message + total + send (dish prices edited on per-dish screens). */
  hideDishRows?: boolean;
}) {
  const parsed = parseCustomRequestDisplay(request);
  const savedParsed = initialQuote
    ? (initialQuote as CookQuoteDisplay).line_items
      ? (initialQuote as CookQuoteDisplay)
      : parseCookQuoteDisplay(initialQuote as Record<string, unknown>, parsed.lines)
    : null;
  const [internalLines, setInternalLines] = React.useState<CookQuoteLineItem[]>(() =>
    savedParsed ? buildQuoteLinesFromSaved(savedParsed, parsed.lines) : buildDefaultQuoteLines(parsed.lines)
  );
  const [internalMessage, setInternalMessage] = React.useState(savedParsed?.message || '');
  const [error, setError] = React.useState('');

  const lines = controlledLines ?? internalLines;
  const message = controlledMessage ?? internalMessage;
  const setLines = onLinesChange ?? setInternalLines;
  const setMessage = onMessageChange ?? setInternalMessage;

  React.useEffect(() => {
    if (controlledLines) return;
    const nextParsed = parseCustomRequestDisplay(request);
    if (initialQuote) {
      const saved = (initialQuote as CookQuoteDisplay).line_items
        ? (initialQuote as CookQuoteDisplay)
        : parseCookQuoteDisplay(initialQuote as Record<string, unknown>, nextParsed.lines);
      setInternalLines(buildQuoteLinesFromSaved(saved, nextParsed.lines));
      setInternalMessage(saved.message || '');
    } else {
      setInternalLines(buildDefaultQuoteLines(nextParsed.lines));
      setInternalMessage('');
    }
  }, [request.id, initialQuote, controlledLines]);

  const total = sumIncludedQuoteCents(lines);

  const updateLine = (id: string, patch: Partial<CookQuoteLineItem>) => {
    setLines(lines.map((l) => (l.request_line_id === id ? { ...l, ...patch } : l)));
  };

  const handlePriceInput = (id: string, raw: string) => {
    const parsedPrice = parseBidDollarsToCents(raw);
    updateLine(id, {
      price_cents: parsedPrice.ok ? parsedPrice.cents : 0,
      included: parsedPrice.ok && parsedPrice.cents > 0,
    });
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
      {!hideDishRows
        ? parsed.lines.map((reqLine) => {
            const qLine = lines.find((l) => l.request_line_id === reqLine.id);
            if (!qLine) return null;
            const priceLabel =
              qLine.included && qLine.price_cents > 0 ? formatBidCentsAsDollars(qLine.price_cents) : '';
            return (
              <View
                key={reqLine.id}
                style={{
                  borderWidth: shcBorders.brutal,
                  borderColor: qLine.included ? shcColors.primary : shcColors.border,
                  borderRadius: shcRadii.md,
                  padding: shcSpacing.sm,
                  marginBottom: shcSpacing.sm,
                  backgroundColor: qLine.included ? shcColors.bentoPeach : shcColors.surfaceMuted,
                }}
                testID={`quote-line-${reqLine.id}`}
              >
                <Text style={{ fontWeight: '800', fontSize: 14, color: shcColors.text }}>{reqLine.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginBottom: shcSpacing.sm }}>
                  {shcServingsBadgeLabel(reqLine.servings)}
                </Text>
                {qLine.included ? (
                  <>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: shcColors.textLight, marginBottom: 4 }}>
                      Your price for this dish
                    </Text>
                    <TextInput
                      placeholder="e.g. 45"
                      placeholderTextColor={shcColors.textLight}
                      keyboardType="decimal-pad"
                      value={priceLabel}
                      onChangeText={(t) => handlePriceInput(reqLine.id, t)}
                      style={{
                        borderWidth: 1,
                        borderColor: shcColors.border,
                        borderRadius: shcRadii.sm,
                        padding: shcSpacing.sm,
                        fontWeight: '800',
                        fontSize: 16,
                        color: shcColors.text,
                        backgroundColor: shcColors.surface,
                      }}
                      testID={`quote-price-${reqLine.id}`}
                    />
                    <Pressable
                      onPress={() => updateLine(reqLine.id, { included: false, price_cents: 0 })}
                      style={{ marginTop: shcSpacing.sm }}
                      testID={`quote-skip-${reqLine.id}`}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: shcColors.textLight }}>
                        Skip this dish
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={() => updateLine(reqLine.id, { included: true })}
                    testID={`quote-include-${reqLine.id}`}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: shcColors.primary }}>+ Quote this dish</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        : null}
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
        Bid total: {formatQuoteTotal(total)}
      </Text>
      {error ? <Text style={{ color: shcColors.error, fontWeight: '700', marginBottom: shcSpacing.sm }}>{error}</Text> : null}
      <SHCButton onPress={handleSend} disabled={busy} testID={testID ? `${testID}-send` : 'quote-send-btn'}>
        <SHCButtonText>{busy ? 'Sending…' : submitLabel || CUSTOM_REQUEST_COPY.sendQuote}</SHCButtonText>
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
