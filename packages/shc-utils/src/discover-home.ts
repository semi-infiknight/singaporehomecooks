/**
 * Discover home greeting — HomelyEats “Hi {name}” personalization.
 */

export type { DiscoverHomePromo } from './discover-promos';
export { discoverHomePromoCarousel } from './discover-promos';

function greetingFirstName(name?: string | null, email?: string | null): string | null {
  const trimmed = name?.trim();
  if (trimmed) return trimmed.split(/\s+/)[0] ?? null;
  const mail = email?.trim();
  if (mail?.includes('@')) {
    const local = mail.split('@')[0]?.trim();
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return null;
}

export function discoverHomeHeadline(userName?: string | null, userEmail?: string | null): {
  headline: string;
  subtitle?: string;
} {
  const first = greetingFirstName(userName, userEmail);
  if (first) {
    return {
      headline: `Hi, ${first}`,
      subtitle: 'What would you like today?',
    };
  }
  return { headline: 'Hungry? Order & Eat.' };
}
