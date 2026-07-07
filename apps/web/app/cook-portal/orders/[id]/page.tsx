'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import { useCookOrder, useCookTransitionOrder, useCookOrderDisputes, useCookOrderChat } from '../../../../lib/useCookPortal';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCLoading,
  SHCSectionTitle,
  SHCButton,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../../../components/SHCWebComponents';
import {
  useShcI18n,
  getCookOrderTransitionActions,
  getCookOrderStatusLabel,
  getCookOrderDetailCopy,
  getOrderChatCopy,
} from '@shc/i18n';

function CookOrderDisputeTrayContent({
  copy,
  isPending,
  onSubmit,
}: {
  copy: ReturnType<typeof getCookOrderDetailCopy>;
  isPending: boolean;
  onSubmit: (notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  return (
    <div data-testid="cook-order-dispute-tray">
      <p className="text-sm text-muted-foreground mb-3">{copy.disputeHint}</p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={copy.disputePlaceholder}
        className="shc-input w-full min-h-[80px] mb-3"
        data-testid="cook-dispute-notes-input"
      />
      <GourmeatPrimaryButton
        label={isPending ? copy.disputeSubmitting : copy.disputeSubmit}
        onClick={() => onSubmit(notes.trim())}
        disabled={isPending || notes.trim().length < 5}
        testID="cook-submit-dispute-btn"
      />
    </div>
  );
}

export default function CookOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { locale } = useShcI18n();
  const copy = getCookOrderDetailCopy(locale);
  const chatCopy = getOrderChatCopy(locale, 'cook');
  const { data: order, isLoading } = useCookOrder(id);
  const transMut = useCookTransitionOrder();
  const { disputes, submit: submitDispute } = useCookOrderDisputes(id);
  const { openTray, dismiss } = useSHCTrayWeb();
  const { messages, send } = useCookOrderChat(id);
  const [msg, setMsg] = useState('');

  const nextActions = useMemo(() => {
    const actions = getCookOrderTransitionActions(locale);
    return Object.fromEntries(actions.map((a) => [a.status, [{ to: a.to, label: a.label }]])) as Record<
      string,
      { to: SHCOrderStatus; label: string }[]
    >;
  }, [locale]);

  const openDisputeTray = () => {
    openTray(
      { id: 'cook-order-dispute', title: copy.reportIssue, height: 'medium' },
      <CookOrderDisputeTrayContent
        copy={copy}
        isPending={submitDispute.isPending}
        onSubmit={(notes) => {
          submitDispute.mutate(notes, {
            onSuccess: () => {
              dismiss();
              openTray(
                { id: 'issue-reported', title: copy.trayReportedTitle, height: 'compact' },
                <SHCTrayActionWeb
                  message={copy.trayReportedBody}
                  primaryLabel={copy.gotIt}
                  onPrimary={dismiss}
                  testID="cook-issue-reported-tray"
                />
              );
            },
            onError: (e) => {
              openTray(
                { id: 'issue-error', title: copy.trayErrorTitle, height: 'compact' },
                <SHCTrayActionWeb
                  message={(e as Error).message || copy.trayErrorBody}
                  primaryLabel={copy.ok}
                  onPrimary={dismiss}
                />
              );
            },
          });
        }}
      />
    );
  };

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCLoading label={copy.loading} />
      </div>
    );
  }

  const status = String(order.shc_status || '');
  const actions = nextActions[status] || [];
  const dispute = disputes[0] as { status?: string; type?: string; notes?: string } | undefined;
  const items = (order.items as { qty?: number; name?: string }[]) || [];
  const dishName = items[0]?.name;

  const confirmTransition = (to: SHCOrderStatus, label: string) => {
    openTray(
      { id: 'order-status-confirm', title: label, height: 'compact' },
      <SHCTrayActionWeb
        message={copy.confirmMessage.replace('{label}', label)}
        primaryLabel={label}
        onPrimary={async () => {
          dismiss();
          try {
            await transMut.mutateAsync({ orderId: id, to });
          } catch (e) {
            openTray(
              { id: 'order-status-error', title: copy.trayErrorTitle, height: 'compact' },
              <SHCTrayActionWeb message={(e as Error).message} primaryLabel={copy.ok} onPrimary={dismiss} testID="order-status-error-tray" />
            );
          }
        }}
        secondaryLabel={copy.cancel}
        onSecondary={dismiss}
        testID="order-status-confirm-tray"
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <GourmeatScreenHeader
        title={copy.orderTitle(id, dishName)}
        subtitle={getCookOrderStatusLabel(locale, status)}
        backHref="/cook-portal/orders"
        backLabel={copy.backOrders}
      />

      <GourmeatCard appearance="cook" className="mb-4">
        <p className="font-extrabold">{copy.collection}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {order.collection_date} · {order.collection_slot}
        </p>
        <p className="text-sm font-semibold text-foreground mt-2">
          {copy.itemsMeta
            .replace('{total}', String(order.total))
            .replace('{count}', String(items.length || 1))}
        </p>
        {items.map((it, i) => (
          <p key={i} className="text-sm text-muted-foreground mt-1">
            {copy.itemLine(it.qty || 1, it.name || '')}
          </p>
        ))}
        <p className="text-xs text-muted-foreground mt-3">{copy.hint}</p>
      </GourmeatCard>

      <div className="flex flex-wrap gap-2 mb-6">
        {actions.map((a) => (
          <GourmeatPrimaryButton
            key={a.to}
            label={transMut.isPending ? copy.updating : a.label}
            disabled={transMut.isPending}
            onClick={() => confirmTransition(a.to, a.label)}
            testID={`cook-portal-order-transition-${a.to}`}
          />
        ))}
      </div>

      <div id="cook-order-chat-section">
        <SHCSectionTitle subtitle={chatCopy.subtitle}>{chatCopy.title(id)}</SHCSectionTitle>
      </div>
      <div className="border-2 border-[var(--shc-border-brutal)] bg-card rounded-xl overflow-hidden shadow-[var(--shc-shadow-brutal-sm)] mb-6">
        <div className="h-56 overflow-y-auto p-4 space-y-3 text-sm" data-testid="cook-portal-chat-messages">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-center py-8">{chatCopy.empty}</p>
          )}
          {messages.map((m: { sender_actor?: string; body?: string }, i: number) => (
            <div
              key={i}
              className={`max-w-[85%] p-3 rounded-lg ${
                m.sender_actor === 'cook'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-secondary text-foreground mr-auto'
              }`}
            >
              <p className="text-[10px] font-bold opacity-80 mb-1">{chatCopy.senderLabel(String(m.sender_actor || 'customer'))}</p>
              {m.body}
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3 border-t border-border bg-secondary">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="shc-input flex-1 py-2"
            placeholder={chatCopy.placeholder}
            data-testid="cook-portal-chat-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && msg.trim()) {
                send({ body: msg });
                setMsg('');
              }
            }}
          />
          <SHCButton
            size="sm"
            onClick={() => {
              if (msg.trim()) {
                send({ body: msg });
                setMsg('');
              }
            }}
            testID="cook-portal-chat-send"
          >
            {chatCopy.send}
          </SHCButton>
        </div>
      </div>

      {dispute ? (
        <GourmeatCard appearance="cook" className="mb-6" testID="cook-order-dispute-submitted">
          <p className="font-extrabold text-sm">{copy.issueReported}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {dispute.status === 'open' ? copy.disputeOpen : dispute.status || copy.disputeOpen} · {dispute.type || copy.disputeOther}
          </p>
          {dispute.notes ? <p className="text-sm mt-2">{dispute.notes}</p> : null}
        </GourmeatCard>
      ) : (
        <GourmeatPrimaryButton
          label={copy.reportIssue}
          className="mb-6"
          onClick={openDisputeTray}
          testID="cook-open-dispute-tray-btn"
        />
      )}

      <p className="text-xs text-muted-foreground mb-6">{copy.footer}</p>

      <Link href="/cook-portal/orders" className="block text-center text-sm font-semibold text-primary mt-8">
        {copy.backToOrders}
      </Link>
    </div>
  );
}
