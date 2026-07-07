export function formatCurrency(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`;
}

export * from './food-visuals';
export * from './reorder';
export * from './occasion';
export * from './cart';
export * from './order-tracking';
export * from './favorites';
export * from './sg-areas';
export * from './location';
export * from './discover';
export * from './cook-listings';
export * from './e2e-cart';
export * from './e2e-order';
export * from './discover-evidence';
export * from './platform-counters';
