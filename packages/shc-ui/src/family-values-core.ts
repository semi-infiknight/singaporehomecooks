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

/** Per-step advance label — morphs as user progresses (Family Continue→Confirm pattern). */
export function wizardStepActionLabel(step: number, total: number): string {
  if (step >= total) return 'Publish';
  if (step === 1) return 'Continue';
  if (step === 2) return 'Next';
  if (step === 3) return 'Review';
  return 'Continue';
}

export function wizardCtaLabel(step: number, total: number, editing: boolean): string {
  if (step >= total) return editing ? 'Save changes' : 'Publish';
  return wizardStepActionLabel(step, total);
}

export function wizardCtaMorphFrom(step: number, total: number, editing: boolean): { from: string; to: string } {
  if (step >= total) {
    return { from: 'Review', to: editing ? 'Save changes' : 'Publish' };
  }
  const to = wizardStepActionLabel(step, total);
  const from = step <= 1 ? 'Continue' : wizardStepActionLabel(step - 1, total);
  return { from, to };
}

export type SharedDishLayout = { x: number; y: number; w: number; h: number };

const sharedDishLayouts = new Map<string, SharedDishLayout>();

export function registerSharedDishLayout(id: string, layout: SharedDishLayout): void {
  if (!id || layout.w <= 0 || layout.h <= 0) return;
  sharedDishLayouts.set(id, layout);
}

export function getSharedDishLayout(id: string): SharedDishLayout | undefined {
  return sharedDishLayouts.get(id);
}

export function clearSharedDishLayout(id: string): void {
  sharedDishLayouts.delete(id);
}

/** Compute hero entry transform from a captured card thumbnail layout. */
export function computeSharedHeroTransform(
  origin: SharedDishLayout,
  hero: SharedDishLayout
): { initialScale: number; translateX: number; translateY: number } {
  const initialScale = Math.max(origin.w / hero.w, origin.h / hero.h);
  const originCx = origin.x + origin.w / 2;
  const originCy = origin.y + origin.h / 2;
  const heroCx = hero.x + hero.w / 2;
  const heroCy = hero.y + hero.h / 2;
  return {
    initialScale,
    translateX: originCx - heroCx,
    translateY: originCy - heroCy,
  };
}