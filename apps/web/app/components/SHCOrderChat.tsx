'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildChatThreadItems,
  chatSenderLabel,
  cookChatQuickReplies,
  formatChatTime,
  isOutgoingChatMessage,
  isSystemChatActor,
  type ChatMessageRow,
  type ChatViewerRole,
} from '@shc/utils';
import type { OrderChatContext } from '@shc/utils';
import { SHCButton } from './SHCWebComponents';
import { useCookConfig } from '../../lib/useCookConfig';

export type { OrderChatContext as SHCOrderChatContext };

export function SHCOrderChatPanel({
  viewerRole,
  context,
  messages,
  onSend,
  sending,
  isLoading,
  testID = 'order-chat-panel',
  quickReplies,
}: {
  viewerRole: ChatViewerRole;
  context: OrderChatContext;
  messages: ChatMessageRow[];
  onSend: (body: string) => void;
  sending?: boolean;
  isLoading?: boolean;
  testID?: string;
  quickReplies?: readonly string[];
}) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { config } = useCookConfig();
  const resolvedQuickReplies = quickReplies ?? cookChatQuickReplies(viewerRole, config);
  const threadItems = useMemo(() => buildChatThreadItems(messages), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadItems.length, messages]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body || sending) return;
    onSend(body);
    setDraft('');
  };

  return (
    <div className="border-2 border-[var(--shc-border-brutal)] bg-card rounded-2xl overflow-hidden shadow-[var(--shc-shadow-brutal-sm)]" data-testid={testID}>
      <div className="p-4 border-b-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-peach)]">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-[var(--shc-border-brutal)] bg-card flex items-center justify-center font-black text-lg shrink-0">
            {(context.counterpartyName || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-foreground truncate">{context.counterpartyName}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              {viewerRole === 'customer' ? 'Order support with your home cook' : 'Coordinate collection with customer'}
            </p>
            <p className="text-xs font-bold text-foreground mt-1">
              {context.orderRef}
              {context.dishSummary ? ` · ${context.dishSummary}` : ''}
            </p>
            {context.collectionDate || context.collectionSlot ? (
              <p className="text-xs font-bold text-primary mt-1">
                Collection {context.collectionDate?.slice(0, 10)} {context.collectionSlot}
              </p>
            ) : null}
          </div>
          {context.statusLabel ? (
            <span className="text-[10px] font-extrabold px-2 py-1 rounded-full border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-mint)] shrink-0">
              {context.statusLabel}
            </span>
          ) : null}
        </div>
        {context.collectionAddress || context.collectionInstructions ? (
          <div className="mt-3 p-3 rounded-xl border border-[var(--shc-border-brutal)] bg-[var(--shc-bento-yellow)]">
            <p className="text-[11px] font-extrabold">Collection details</p>
            {context.collectionAddress ? (
              <p className="text-xs font-semibold mt-1">{context.collectionAddress}</p>
            ) : null}
            {context.collectionInstructions ? (
              <p className={`text-xs font-semibold ${context.collectionAddress ? 'mt-2 opacity-90' : 'mt-1'}`}>
                {context.collectionInstructions}
              </p>
            ) : null}
          </div>
        ) : null}
        {context.privacyHint ? (
          <p className="text-[11px] font-semibold text-muted-foreground mt-2">{context.privacyHint}</p>
        ) : null}
      </div>

      <div className="h-72 overflow-y-auto p-4 space-y-3 bg-background" data-testid="chat-thread">
        {isLoading && messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading conversation…</p>
        ) : null}
        {!isLoading && messages.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="font-extrabold">Start the conversation</p>
            <p className="text-sm text-muted-foreground font-semibold mt-2">
              Quick replies below — like Zomato live order chat.
            </p>
          </div>
        ) : null}

        {threadItems.map((item) =>
          item.kind === 'date' ? (
            <div key={item.id} className="flex justify-center">
              <span className="text-[10px] font-extrabold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {item.label}
              </span>
            </div>
          ) : (
            <ChatBubbleWeb
              key={item.id}
              message={item.message}
              viewerRole={viewerRole}
              counterpartyName={context.counterpartyName}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t-2 border-[var(--shc-border-brutal)] bg-card p-3 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {resolvedQuickReplies.map((text) => (
            <button
              key={text}
              type="button"
              disabled={sending}
              onClick={() => onSend(text)}
              className="shrink-0 text-[11px] font-extrabold px-3 py-2 rounded-full border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-yellow)] disabled:opacity-50"
            >
              {text}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="shc-input flex-1 py-2.5"
            placeholder={viewerRole === 'customer' ? 'Message your cook…' : 'Message your customer…'}
            data-testid="chat-message-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <SHCButton size="sm" disabled={!draft.trim() || sending} onClick={handleSend} testID="chat-send-btn">
            {sending ? '…' : 'Send'}
          </SHCButton>
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground text-center">
          Order-scoped chat · Payment issues → support@shc.local
        </p>
      </div>
    </div>
  );
}

function ChatBubbleWeb({
  message,
  viewerRole,
  counterpartyName,
}: {
  message: ChatMessageRow;
  viewerRole: ChatViewerRole;
  counterpartyName?: string;
}) {
  if (isSystemChatActor(message.sender_actor)) {
    return (
      <div className="mx-auto max-w-[90%] text-center px-3 py-2 rounded-xl border border-[var(--shc-border-brutal)] bg-[var(--shc-bento-mint)]">
        <p className="text-xs font-bold">{message.body}</p>
        {message.created_at ? (
          <p className="text-[10px] text-muted-foreground mt-1">{formatChatTime(message.created_at)}</p>
        ) : null}
      </div>
    );
  }

  const outgoing = isOutgoingChatMessage(viewerRole, message.sender_actor);
  const label = outgoing ? 'You' : chatSenderLabel(viewerRole, message.sender_actor, counterpartyName);

  return (
    <div className={`max-w-[85%] ${outgoing ? 'ml-auto text-right' : 'mr-auto'}`}>
      {!outgoing ? <p className="text-[10px] font-extrabold text-muted-foreground mb-1 ml-1">{label}</p> : null}
      <div
        className={`inline-block text-left p-3 rounded-2xl border-2 border-[var(--shc-border-brutal)] ${
          outgoing ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'
        }`}
      >
        <p className="text-sm font-semibold whitespace-pre-wrap">{message.body}</p>
        <p className={`text-[10px] font-bold mt-1.5 ${outgoing ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
          {formatChatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
