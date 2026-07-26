/** Cook portal copy — time-aware greeting for dashboard hero. */

export function cookPortalGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning, Chef';
  if (hour < 17) return 'Good afternoon, Chef';
  return 'Good evening, Chef';
}
