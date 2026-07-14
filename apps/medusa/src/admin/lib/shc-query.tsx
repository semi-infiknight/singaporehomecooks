/**
 * pnpm can resolve a different @tanstack/react-query instance than @medusajs/dashboard,
 * which surfaces as: "No QueryClient set, use QueryClientProvider to set one".
 * Medusa docs: install v5.64.2 + avoid a second copy; this provider is the belt-and-braces
 * fix so SHC Ops routes always have a client from the same module as their useQuery hooks.
 */
import React, { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

function createShcQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function ShcQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createShcQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function withShcQuery<P extends object>(Component: React.ComponentType<P>) {
  const Wrapped = (props: P) => (
    <ShcQueryProvider>
      <Component {...props} />
    </ShcQueryProvider>
  )
  Wrapped.displayName = `withShcQuery(${Component.displayName || Component.name || "Component"})`
  return Wrapped
}
