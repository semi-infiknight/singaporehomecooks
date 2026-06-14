export function formatCollectionDate(d: string): string {
  return new Date(d).toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isWithinWindow(slot: string): boolean {
  // Simple mock for slot validation
  return true;
}
