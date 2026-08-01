'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  buildDefaultQuoteLines,
  buildQuoteLinesFromSaved,
  parseCookQuoteDisplay,
  parseCustomRequestDisplay,
  sumIncludedQuoteCents,
  type CookQuoteDisplay,
  type CookQuoteLineItem,
} from '@shc/utils';

type DraftState = {
  lines: CookQuoteLineItem[];
  message: string;
};

type CookRequestQuoteDraftContextValue = {
  lines: CookQuoteLineItem[];
  message: string;
  totalCents: number;
  setMessage: (message: string) => void;
  updateLine: (lineId: string, patch: Partial<CookQuoteLineItem>) => void;
  resetFromRequest: (request: Record<string, unknown>, initialQuote?: CookQuoteDisplay | Record<string, unknown>) => void;
};

const CookRequestQuoteDraftContext = createContext<CookRequestQuoteDraftContextValue | null>(null);

export function CookRequestQuoteDraftProvider({
  children,
  request,
  initialQuote,
}: {
  children: React.ReactNode;
  request: Record<string, unknown>;
  initialQuote?: CookQuoteDisplay | Record<string, unknown>;
}) {
  const parsed = useMemo(() => parseCustomRequestDisplay(request), [request]);
  const savedParsed = useMemo(() => {
    if (!initialQuote) return null;
    return (initialQuote as CookQuoteDisplay).line_items
      ? (initialQuote as CookQuoteDisplay)
      : parseCookQuoteDisplay(initialQuote as Record<string, unknown>, parsed.lines);
  }, [initialQuote, parsed.lines]);

  const [draft, setDraft] = useState<DraftState>(() => ({
    lines: savedParsed ? buildQuoteLinesFromSaved(savedParsed, parsed.lines) : buildDefaultQuoteLines(parsed.lines),
    message: savedParsed?.message || '',
  }));

  React.useEffect(() => {
    const nextParsed = parseCustomRequestDisplay(request);
    if (initialQuote) {
      const saved = (initialQuote as CookQuoteDisplay).line_items
        ? (initialQuote as CookQuoteDisplay)
        : parseCookQuoteDisplay(initialQuote as Record<string, unknown>, nextParsed.lines);
      setDraft({
        lines: buildQuoteLinesFromSaved(saved, nextParsed.lines),
        message: saved.message || '',
      });
    } else {
      setDraft({
        lines: buildDefaultQuoteLines(nextParsed.lines),
        message: '',
      });
    }
  }, [request.id, initialQuote]);

  const resetFromRequest = useCallback(
    (nextRequest: Record<string, unknown>, nextQuote?: CookQuoteDisplay | Record<string, unknown>) => {
      const nextParsed = parseCustomRequestDisplay(nextRequest);
      if (nextQuote) {
        const saved = (nextQuote as CookQuoteDisplay).line_items
          ? (nextQuote as CookQuoteDisplay)
          : parseCookQuoteDisplay(nextQuote as Record<string, unknown>, nextParsed.lines);
        setDraft({
          lines: buildQuoteLinesFromSaved(saved, nextParsed.lines),
          message: saved.message || '',
        });
      } else {
        setDraft({
          lines: buildDefaultQuoteLines(nextParsed.lines),
          message: '',
        });
      }
    },
    []
  );

  const updateLine = useCallback((lineId: string, patch: Partial<CookQuoteLineItem>) => {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => (line.request_line_id === lineId ? { ...line, ...patch } : line)),
    }));
  }, []);

  const value = useMemo(
    () => ({
      lines: draft.lines,
      message: draft.message,
      totalCents: sumIncludedQuoteCents(draft.lines),
      setMessage: (message: string) => setDraft((prev) => ({ ...prev, message })),
      updateLine,
      resetFromRequest,
    }),
    [draft.lines, draft.message, updateLine, resetFromRequest]
  );

  return <CookRequestQuoteDraftContext.Provider value={value}>{children}</CookRequestQuoteDraftContext.Provider>;
}

export function useCookRequestQuoteDraft() {
  const ctx = useContext(CookRequestQuoteDraftContext);
  if (!ctx) throw new Error('useCookRequestQuoteDraft must be used within CookRequestQuoteDraftProvider');
  return ctx;
}
