/** Cook portal copy — time-aware greeting for dashboard hero. */

export type CookGreetingCopy = {
  morning: string;
  afternoon: string;
  evening: string;
};

export const DEFAULT_COOK_GREETING: CookGreetingCopy = {
  morning: 'Good morning, Chef',
  afternoon: 'Good afternoon, Chef',
  evening: 'Good evening, Chef',
};

export function cookPortalGreeting(
  now: Date = new Date(),
  copy: CookGreetingCopy = DEFAULT_COOK_GREETING
): string {
  const hour = now.getHours();
  if (hour < 12) return copy.morning;
  if (hour < 17) return copy.afternoon;
  return copy.evening;
}
