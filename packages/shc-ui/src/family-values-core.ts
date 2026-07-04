/**
 * Pure Family Values utilities — tray stack, morphing labels, milestones, reduce-motion.
 * Testable without React Native / DOM.
 */

export type TrayHeight = 'compact' | 'medium' | 'tall';

export type TrayFrame = {
  id: string;
  title: string;
  height: TrayHeight;
  icon?: string;
};

export const TRAY_HEIGHT_PX: Record<TrayHeight, number> = {
  compact: 220,
  medium: 340,
  tall: 520,
};

export function pushTray(stack: TrayFrame[], frame: TrayFrame): TrayFrame[] {
  if (!frame.id || !frame.title) return stack;
  const existing = stack.findIndex((f) => f.id === frame.id);
  if (existing >= 0) return [...stack.slice(0, existing + 1), frame];
  return [...stack, frame];
}

export function popTray(stack: TrayFrame[]): TrayFrame[] {
  if (stack.length <= 1) return [];
  return stack.slice(0, -1);
}

export function dismissTray(_stack: TrayFrame[]): TrayFrame[] {
  return [];
}

export function currentTray(stack: TrayFrame[]): TrayFrame | null {
  return stack.length ? stack[stack.length - 1]! : null;
}

export function trayStackDepth(stack: TrayFrame[]): number {
  return stack.length;
}

export type MorphSegment = {
  text: string;
  kind: 'shared' | 'out' | 'in';
};

/** Family-style morph: shared prefix letters stay; remainder fades out/in. */
export function computeMorphingLabelSegments(from: string, to: string): MorphSegment[] {
  const a = from.trim();
  const b = to.trim();
  if (a === b) return [{ text: a, kind: 'shared' }];
  let i = 0;
  const minLen = Math.min(a.length, b.length);
  while (i < minLen && a[i] === b[i]) i += 1;
  const segments: MorphSegment[] = [];
  if (i > 0) segments.push({ text: a.slice(0, i), kind: 'shared' });
  const outRest = a.slice(i);
  const inRest = b.slice(i);
  if (outRest) segments.push({ text: outRest, kind: 'out' });
  if (inRest) segments.push({ text: inRest, kind: 'in' });
  return segments.length ? segments : [{ text: b, kind: 'in' }];
}

export function morphingLabelTarget(segments: MorphSegment[]): string {
  return segments
    .filter((s) => s.kind !== 'out')
    .map((s) => s.text)
    .join('');
}

export function shouldReduceMotion(pref?: boolean | null): boolean {
  if (pref === true) return true;
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as { matchMedia?: (q: string) => { matches: boolean } };
    if (g.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return true;
  }
  return false;
}

export type MilestoneId = 'first_listing_publish' | 'first_order' | 'compliance_approved';

export function milestoneStorageKey(id: MilestoneId, userId: string): string {
  return `shc:milestone:${id}:${userId || 'anon'}`;
}

export function shouldShowMilestone(
  id: MilestoneId,
  userId: string,
  seen: Record<string, boolean>
): boolean {
  const key = milestoneStorageKey(id, userId);
  return !seen[key];
}

export function markMilestoneSeen(
  id: MilestoneId,
  userId: string,
  seen: Record<string, boolean>
): Record<string, boolean> {
  return { ...seen, [milestoneStorageKey(id, userId)]: true };
}

/** Tab index delta → slide direction for directional tabs. */
export function tabSlideDirection(prevIndex: number, nextIndex: number): 'left' | 'right' | 'none' {
  if (prevIndex === nextIndex) return 'none';
  return nextIndex > prevIndex ? 'left' : 'right';
}

export const TAB_SLIDE_OFFSET = 24;

export function wizardCtaLabel(step: number, total: number, editing: boolean): string {
  if (step >= total) return editing ? 'Save changes' : 'Publish';
  return 'Continue';
}

export function wizardCtaMorphFrom(step: number, total: number, editing: boolean): { from: string; to: string } {
  const prev = step > 1 ? 'Continue' : (editing ? 'Continue' : 'Continue');
  const next = wizardCtaLabel(step, total, editing);
  if (step === total && step > 1) return { from: 'Continue', to: next };
  return { from: prev, to: next };
}