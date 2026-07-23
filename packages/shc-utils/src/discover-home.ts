/**
 * Discover home greeting — HomelyEats “Hi {name}” personalization.
 */

export function discoverHomeHeadline(userName?: string | null): {
  headline: string;
  subtitle?: string;
} {
  const trimmed = userName?.trim();
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    return {
      headline: `Hi, ${first}`,
      subtitle: 'What would you like today?',
    };
  }
  return { headline: 'Hungry? Order & Eat.' };
}
