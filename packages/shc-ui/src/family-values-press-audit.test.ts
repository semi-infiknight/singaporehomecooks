import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../../..');

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

/** Extract export function until the next top-level export. */
function extractExportBlock(src: string, name: string): string {
  const re = new RegExp(`export function ${name}[\\s\\S]*?(?=\\nexport function |\\nexport const |$)`);
  return src.match(re)?.[0] ?? '';
}

describe('shared dish press structural audit', () => {
  it('GourmeatDishCard uses useSharedDishPress for navigation', () => {
    const block = extractExportBlock(read('packages/shc-ui/src/gourmeat.tsx'), 'GourmeatDishCard');
    expect(block).toContain('useSharedDishPress');
    expect(block).toContain('handleCardPress');
    expect(block).not.toMatch(/onPress=\{onPress\}/);
  });

  it('SHCZomatoDishRow uses useSharedDishPress', () => {
    const block = extractExportBlock(read('packages/shc-ui/src/zomato.tsx'), 'SHCZomatoDishRow');
    expect(block).toContain('useSharedDishPress');
    expect(block).toContain('handlePress');
    expect(block).not.toMatch(/onPress=\{onPress\}/);
  });

  it('web GourmeatDishCard wires price via SharedDishProductLink', () => {
    const block = extractExportBlock(read('apps/web/app/components/SHCWebComponents.tsx'), 'GourmeatDishCard');
    expect(block).toContain('SharedDishProductLink');
    expect(block).toMatch(/SharedDishProductLink[\s\S]*\$\{cardTestID\}-price/);
  });
});