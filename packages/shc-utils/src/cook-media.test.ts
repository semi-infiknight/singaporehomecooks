import { describe, expect, it } from 'vitest';
import { cookMediaObjectName } from './cook-media';

describe('cookMediaObjectName', () => {
  it('builds cook-owned object keys', () => {
    const key = cookMediaObjectName('cook_rose', 'avatar', 'My Photo.JPG', 'image/jpeg');
    expect(key).toMatch(/^cooks\/cook_rose\/avatar\/\d+-My-Photo\.jpg$/);
  });
});
