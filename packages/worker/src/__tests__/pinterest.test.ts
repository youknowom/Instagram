import { describe, it, expect } from 'vitest';
import { PinterestSearchProvider } from '../providers/pinterest.js';

describe('PinterestSearchProvider', () => {
  it('initializes with default options', () => {
    const provider = new PinterestSearchProvider();
    expect(provider).toBeDefined();
  });

  it('returns aesthetic visual candidates for couple niche', async () => {
    const provider = new PinterestSearchProvider();
    const results = await provider.search({
      query: 'couple aesthetic 35mm film',
      limit: 4,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].url).toContain('https://');
    expect(results[0].width).toBeGreaterThanOrEqual(700);
    expect(results[0].height).toBeGreaterThanOrEqual(1000);
    expect(results[0].aspectRatio).toBeLessThanOrEqual(1.05); // Vertical
  });

  it('returns stoic statue visuals for stoic wisdom query', async () => {
    const provider = new PinterestSearchProvider();
    const results = await provider.search({
      query: 'stoic statue marble bust',
      limit: 2,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain('marcus');
  });
});

