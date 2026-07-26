import { describe, expect, it } from 'vitest';
import { occasionBrowseCategories, occasionBrowseHeading, occasionBrowseRoute } from './occasion-browse';

describe('occasion-browse', () => {
  it('builds category rail with All + festive options', () => {
    const cats = occasionBrowseCategories();
    expect(cats[0]?.id).toBe('');
    expect(cats.some((c) => c.id === 'Hari Raya')).toBe(true);
  });

  it('headings reflect selected occasion', () => {
    expect(occasionBrowseHeading('').title).toBe('Plan an occasion');
    expect(occasionBrowseHeading('Hari Raya').title).toBe('Hari Raya spread');
  });

  it('deep links web and mobile', () => {
    expect(occasionBrowseRoute('Deepavali').web).toContain('/occasions?occasion=');
    expect(occasionBrowseRoute('Deepavali').mobile).toContain('/(customer)/occasions');
  });
});
