'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider as TanstackProvider } from '@tanstack/react-query';

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 30, refetchOnWindowFocus: false },
      mutations: { retry: 1 },
    },
  }));
  return <TanstackProvider client={queryClient}>{children as any}</TanstackProvider>;
}
