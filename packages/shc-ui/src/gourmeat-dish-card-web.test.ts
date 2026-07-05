import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Structural check: web GourmeatDishCard keeps price inside SharedDishProductLink for morph capture. */
describe('GourmeatDishCard web structure', () => {
  it('places price testID before SharedDishProductLink closes', () => {
    const src = readFileSync(
      resolve(__dirname, '../../../apps/web/app/components/SHCWebComponents.tsx'),
      'utf8'
    );
    const fnStart = src.indexOf('export function GourmeatDishCard');
    const fnEnd = src.indexOf('export function GourmeatScreenHeader', fnStart);
    const block = src.slice(fnStart, fnEnd);
    const linkClose = block.indexOf('</SharedDishProductLink>');
    const priceIdx = block.indexOf('data-testid={`${cardTestID}-price`}');
    expect(priceIdx).toBeGreaterThan(-1);
    expect(linkClose).toBeGreaterThan(priceIdx);
    expect(block.indexOf('data-testid={`${cardTestID}-price`}', linkClose)).toBe(-1);
  });
});