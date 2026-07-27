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

export function discoverHomeHeadline(
  userName?: string | null,
  userEmail?: string | null,
  copy?: { guest_headline?: string; guest_subtitle?: string; signed_in_subtitle?: string }
): {
  headline: string;
  subtitle?: string;
} {
  const first = greetingFirstName(userName, userEmail);
  if (first) {
    return {
      headline: `Hi, ${first}`,
      subtitle: copy?.signed_in_subtitle || 'What would you like today?',
    };
  }
  return {
    headline: copy?.guest_headline || 'Hungry? Order & Eat.',
    subtitle: copy?.guest_subtitle,
  };
}
