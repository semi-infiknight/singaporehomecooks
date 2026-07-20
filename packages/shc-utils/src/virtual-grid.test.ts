import { describe, expect, it } from 'vitest';
import { chunkForGrid } from './virtual-grid';

describe('chunkForGrid', () => {
  it('returns empty array for empty input', () => {
    expect(chunkForGrid([], 2)).toEqual([]);
  });

  it('chunks items into rows of given column count', () => {
    expect(chunkForGrid(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
    ]);
  });

  it('handles single column as one item per row', () => {
    expect(chunkForGrid([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it('treats columns < 1 as single row of all items', () => {
    expect(chunkForGrid(['x', 'y'], 0)).toEqual([['x', 'y']]);
  });

  it('does not mutate the source array', () => {
    const src = ['a', 'b', 'c'] as const;
    chunkForGrid(src, 2);
    expect(src).toEqual(['a', 'b', 'c']);
  });
});
