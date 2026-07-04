import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const UI_SRC = join(process.cwd(), 'src');

const ALLOWED_USE_SHARED_DISH_PRESS = new Set(['family-values-ui.tsx']);
const ALLOWED_MEASURE_IN_WINDOW = new Set(['family-values-ui.tsx']);

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkTsFiles(full));
      continue;
    }
    if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      if (name.endsWith('.test.ts')) continue;
      out.push(full);
    }
  }
  return out;
}

describe('shared dish press wiring guard', () => {
  it('useSharedDishPress only appears in family-values-ui.tsx', () => {
    const violations: string[] = [];
    for (const file of walkTsFiles(UI_SRC)) {
      const base = file.slice(UI_SRC.length + 1);
      const text = readFileSync(file, 'utf8');
      if (!text.includes('useSharedDishPress')) continue;
      if (!ALLOWED_USE_SHARED_DISH_PRESS.has(base)) {
        violations.push(base);
      }
    }
    expect(violations).toEqual([]);
  });

  it('measureInWindow only appears in family-values-ui.tsx', () => {
    const violations: string[] = [];
    for (const file of walkTsFiles(UI_SRC)) {
      const base = file.slice(UI_SRC.length + 1);
      const text = readFileSync(file, 'utf8');
      if (!/\.measureInWindow\s*\(/.test(text)) continue;
      if (!ALLOWED_MEASURE_IN_WINDOW.has(base)) {
        violations.push(base);
      }
    }
    expect(violations).toEqual([]);
  });
});