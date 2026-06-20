export function formatCurrency(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`;
}

export * from './food-visuals';
export * from './reorder';
export * from './occasion';
export * from './cart';
export * from './order-tracking';
export * from './favorites';
