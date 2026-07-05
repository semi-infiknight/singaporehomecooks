'use client';

import React, { createContext, useContext, useState } from 'react';
import { QueryClient, QueryClientProvider as TanstackProvider } from '@tanstack/react-query';
import { SHCTrayProviderWeb } from './components/SHCWebComponents';

type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<SearchContextValue>({ query: '', setQuery: () => {} });

export function useDiscoverSearch() {
  return useContext(SearchContext);
}

function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 30, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  }));
  return (
    <TanstackProvider client={queryClient}>
      <SHCTrayProviderWeb>
        <SearchProvider>{children}</SearchProvider>
      </SHCTrayProviderWeb>
    </TanstackProvider>
  );
}