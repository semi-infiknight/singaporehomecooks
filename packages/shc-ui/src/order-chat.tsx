/**
 * Order support chat — Zomato / Redbus-style bubbles, header, quick replies.
 * Tri-platform: mirror in apps/web/app/components/SHCOrderChat.tsx
 */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  buildChatThreadItems,
  chatQuickReplies,
  chatSenderLabel,
  formatChatTime,
  isOutgoingChatMessage,
  isSystemChatActor,
  type ChatMessageRow,
  type ChatViewerRole,
} from '@shc/utils';
import { gourmeatColors, gourmeatRadii, shcBorders, shcColors, shcRadii, shcShadows, shcSpacing } from './theme';
import { Ionicons } from '@expo/vector-icons';
import { GourmeatPrimaryButton } from './gourmeat';
import type { OrderChatContext } from '@shc/utils';

export function SHCOrderChatHeader({
  context,
  viewerRole,
  testID = 'chat-order-title',
}: {
  context: OrderChatContext;
  viewerRole: ChatViewerRole;
  testID?: string;
}) {
  const initial = (context.counterpartyName || '?').charAt(0).toUpperCase();
  const subtitle =
    viewerRole === 'customer'
      ? 'Message your home cook · order-scoped support'
      : 'Message your customer · collection coordination';

  return (
    <View style={styles.headerCard} testID={testID}>
      <View style={styles.headerTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerName}>{context.counterpartyName}</Text>
          <Text style={styles.headerSub}>{subtitle}</Text>
        </View>
        {context.statusLabel ? (
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{context.statusLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Order</Text>
        <Text style={styles.metaValue}>{context.orderRef}</Text>
        {context.dishSummary ? (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {context.dishSummary}
            </Text>
          </>
        ) : null}
      </View>

      {context.collectionDate || context.collectionSlot ? (
        <Text style={styles.collectionLine}>
          Collection {context.collectionDate?.slice(0, 10) || ''} {context.collectionSlot || ''}
        </Text>
      ) : null}

      {context.collectionAddress || context.collectionInstructions ? (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>Collection details</Text>
          {context.collectionAddress ? (
            <Text style={styles.instructionsBody}>{context.collectionAddress}</Text>
          ) : null}
          {context.collectionInstructions ? (
            <Text style={[styles.instructionsBody, context.collectionAddress ? styles.instructionsSub : null]}>
              {context.collectionInstructions}
            </Text>
          ) : null}
        </View>
      ) : null}

      {context.privacyHint ? <Text style={styles.privacyHint}>{context.privacyHint}</Text> : null}
    </View>
  );
}

export function SHCChatBubble({
  message,
  viewerRole,
  counterpartyName,
}: {
  message: ChatMessageRow;
  viewerRole: ChatViewerRole;
  counterpartyName?: string;
}) {
  const actor = message.sender_actor;
  if (isSystemChatActor(actor)) {
    return (
      <View style={styles.systemWrap}>
        <Text style={styles.systemText}>{message.body}</Text>
        {message.created_at ? (
          <Text style={styles.systemTime}>{formatChatTime(message.created_at)}</Text>
        ) : null}
      </View>
    );
  }

  const outgoing = isOutgoingChatMessage(viewerRole, actor);
  const label = outgoing ? 'You' : chatSenderLabel(viewerRole, actor, counterpartyName);

  return (
    <View style={[styles.bubbleRow, outgoing ? styles.bubbleRowOut : styles.bubbleRowIn]}>
      {!outgoing ? <Text style={styles.senderLabel}>{label}</Text> : null}
      <View style={[styles.bubble, outgoing ? styles.bubbleOut : styles.bubbleIn]}>
        <Text style={[styles.bubbleBody, outgoing ? styles.bubbleBodyOut : styles.bubbleBodyIn]}>
          {message.body}
        </Text>
        <Text style={[styles.bubbleTime, outgoing ? styles.bubbleTimeOut : styles.bubbleTimeIn]}>
          {formatChatTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}

export function SHCChatQuickReplies({
  role,
  onPick,
  disabled,
  quickReplies,
}: {
  role: ChatViewerRole;
  onPick: (text: string) => void;
  disabled?: boolean;
  quickReplies?: readonly string[];
}) {
  const replies = quickReplies ?? chatQuickReplies(role);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
      {replies.map((text) => (
        <Pressable
          key={text}
          disabled={disabled}
          onPress={() => onPick(text)}
          style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed, disabled && styles.quickChipDisabled]}
        >
          <Text style={styles.quickChipText}>{text}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function SHCChatComposer({
  value,
  onChangeText,
  onSend,
  sending,
  placeholder,
  testID = 'chat-message-input',
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder?: string;
  testID?: string;
}) {
  const canSend = Boolean(value.trim()) && !sending;
  return (
    <View style={styles.composerWrap}>
      <TextInput
        testID={testID}
        style={styles.composerInput}
        placeholder={placeholder || 'Type a message…'}
        placeholderTextColor={gourmeatColors.textLight}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => {
          if (canSend) onSend();
        }}
        multiline
        maxLength={2000}
      />
      <Pressable
        onPress={onSend}
        disabled={!canSend}
        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        testID="chat-send-btn"
      >
        {sending ? (
          <ActivityIndicator size="small" color={gourmeatColors.onPrimary} />
        ) : (
          <Ionicons name="send" size={18} color={gourmeatColors.onPrimary} />
        )}
      </Pressable>
    </View>
  );
}

export function SHCOrderChatPane({
  viewerRole,
  context,
  messages,
  draft,
  onDraftChange,
  onSend,
  sending,
  isLoading,
  quickReplies,
}: {
  viewerRole: ChatViewerRole;
  context: OrderChatContext;
  messages: ChatMessageRow[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: (body: string) => void;
  sending?: boolean;
  isLoading?: boolean;
  quickReplies?: readonly string[];
}) {
  const scrollRef = useRef<ScrollView>(null);
  const threadItems = useMemo(() => buildChatThreadItems(messages), [messages]);

  useEffect(() => {
    if (!threadItems.length) return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [threadItems.length, messages]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body || sending) return;
    onSend(body);
    onDraftChange('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.threadScroll}
        contentContainerStyle={styles.threadContent}
        keyboardShouldPersistTaps="handled"
        testID="chat-thread"
      >
        <SHCOrderChatHeader context={context} viewerRole={viewerRole} />

        <View style={styles.threadCard}>
          {isLoading && messages.length === 0 ? (
            <Text style={styles.emptyHint}>Loading conversation…</Text>
          ) : null}
          {!isLoading && messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptyHint}>
                Ask about collection time, dietary needs, or HDB pickup — like Zomato order chat.
              </Text>
            </View>
          ) : null}

          {threadItems.map((item) =>
            item.kind === 'date' ? (
              <View key={item.id} style={styles.dateSepWrap}>
                <Text style={styles.dateSep}>{item.label}</Text>
              </View>
            ) : (
              <SHCChatBubble
                key={item.id}
                message={item.message}
                viewerRole={viewerRole}
                counterpartyName={context.counterpartyName}
              />
            )
          )}
        </View>

        <Text style={styles.supportFooter}>
          Order-scoped chat only · For payment issues contact support@shc.local
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <SHCChatQuickReplies role={viewerRole} onPick={(t) => onSend(t)} disabled={sending} quickReplies={quickReplies} />
        <SHCChatComposer
          value={draft}
          onChangeText={onDraftChange}
          onSend={handleSend}
          sending={sending}
          placeholder={
            viewerRole === 'customer'
              ? 'Message your cook (collection, allergens…)'
              : 'Message your customer (pickup details…)'
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/** Compact CTA row used on order cards. */
export function SHCChatEntryButton({
  label = 'Chat',
  onPress,
  testID,
}: {
  label?: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <GourmeatPrimaryButton label={label} variant="outline" size="sm" onPress={onPress} testID={testID} />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  threadScroll: { flex: 1 },
  threadContent: { padding: shcSpacing.md, paddingBottom: shcSpacing.lg },
  headerCard: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
    ...shcShadows.brutalSm,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: shcColors.bentoPeach,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: gourmeatColors.text },
  headerCopy: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '900', color: gourmeatColors.text },
  headerSub: { fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 2 },
  statusPill: {
    backgroundColor: shcColors.bentoMint,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    borderRadius: gourmeatRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 10, fontWeight: '800', color: gourmeatColors.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: shcSpacing.sm, gap: 4 },
  metaLabel: { fontSize: 11, fontWeight: '800', color: gourmeatColors.textLight },
  metaValue: { fontSize: 11, fontWeight: '700', color: gourmeatColors.text, flexShrink: 1 },
  metaDot: { color: gourmeatColors.textLight, fontWeight: '700' },
  collectionLine: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: gourmeatColors.primary,
  },
  instructionsBox: {
    marginTop: shcSpacing.sm,
    backgroundColor: shcColors.bentoYellow,
    borderRadius: gourmeatRadii.md,
    borderWidth: 1,
    borderColor: shcColors.borderLight,
    padding: shcSpacing.sm,
  },
  instructionsTitle: { fontSize: 11, fontWeight: '800', color: gourmeatColors.text },
  instructionsBody: { fontSize: 12, fontWeight: '600', color: gourmeatColors.text, marginTop: 4, lineHeight: 17 },
  instructionsSub: { marginTop: 6, opacity: 0.9 },
  privacyHint: {
    marginTop: shcSpacing.sm,
    fontSize: 11,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    lineHeight: 16,
  },
  threadCard: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.borderLight,
    padding: shcSpacing.md,
    minHeight: 240,
  },
  emptyState: { alignItems: 'center', paddingVertical: shcSpacing.lg },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: gourmeatColors.text },
  emptyHint: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, textAlign: 'center', marginTop: 6, lineHeight: 17 },
  dateSepWrap: { alignItems: 'center', marginVertical: shcSpacing.sm },
  dateSep: {
    fontSize: 10,
    fontWeight: '800',
    color: gourmeatColors.textLight,
    backgroundColor: gourmeatColors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: shcRadii.pill,
    overflow: 'hidden',
  },
  bubbleRow: { marginBottom: shcSpacing.sm, maxWidth: '88%' },
  bubbleRowOut: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowIn: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderLabel: { fontSize: 10, fontWeight: '800', color: gourmeatColors.textLight, marginBottom: 4, marginLeft: 4 },
  bubble: { borderRadius: gourmeatRadii.lg, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  bubbleOut: {
    backgroundColor: gourmeatColors.primary,
    borderColor: gourmeatColors.border,
    borderTopRightRadius: 4,
  },
  bubbleIn: {
    backgroundColor: gourmeatColors.surfaceAlt,
    borderColor: shcColors.borderLight,
    borderTopLeftRadius: 4,
  },
  bubbleBody: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  bubbleBodyOut: { color: gourmeatColors.onPrimary },
  bubbleBodyIn: { color: gourmeatColors.text },
  bubbleTime: { fontSize: 10, fontWeight: '700', marginTop: 6 },
  bubbleTimeOut: { color: 'rgba(255,255,255,0.85)', textAlign: 'right' },
  bubbleTimeIn: { color: gourmeatColors.textLight },
  systemWrap: {
    alignSelf: 'center',
    maxWidth: '92%',
    backgroundColor: shcColors.bentoMint,
    borderRadius: gourmeatRadii.md,
    borderWidth: 1,
    borderColor: shcColors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: shcSpacing.sm,
  },
  systemText: { fontSize: 11, fontWeight: '700', color: gourmeatColors.text, textAlign: 'center', lineHeight: 16 },
  systemTime: { fontSize: 9, fontWeight: '600', color: gourmeatColors.textLight, textAlign: 'center', marginTop: 4 },
  supportFooter: {
    fontSize: 10,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    textAlign: 'center',
    marginTop: shcSpacing.md,
    lineHeight: 14,
  },
  footer: {
    borderTopWidth: shcBorders.brutal,
    borderTopColor: shcColors.borderLight,
    backgroundColor: gourmeatColors.surface,
    paddingHorizontal: shcSpacing.md,
    paddingTop: shcSpacing.sm,
    paddingBottom: Platform.OS === 'ios' ? shcSpacing.lg : shcSpacing.md,
  },
  quickRow: { gap: 8, paddingBottom: shcSpacing.sm },
  quickChip: {
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.border,
    backgroundColor: shcColors.bentoYellow,
    borderRadius: gourmeatRadii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChipPressed: { opacity: 0.85 },
  quickChipDisabled: { opacity: 0.5 },
  quickChipText: { fontSize: 11, fontWeight: '800', color: gourmeatColors.text },
  composerWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.borderLight,
    borderRadius: gourmeatRadii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: gourmeatColors.background,
    fontSize: 14,
    fontWeight: '600',
    color: gourmeatColors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: gourmeatColors.primary,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
