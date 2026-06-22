/** Best-effort event emit — no-op when eventBusService is unavailable (CI minimal start). */
export async function emitShcEvent(container: any, name: string, data: Record<string, unknown>) {
  try {
    const eventBus = container.resolve("eventBusService") as { emit?: (n: string, d: Record<string, unknown>) => Promise<void> };
    await eventBus?.emit?.(name, data);
  } catch {
    // optional in dev/CI
  }
}