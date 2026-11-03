import { describe, it, expect } from 'vitest';
import { QuoteAgent, AgentIdeaOutputSchema } from '../agent/quotes.js';

describe('QuoteAgent', () => {
  it('generates schema-valid ideas for couple niche', async () => {
    const agent = new QuoteAgent();
    const result = await agent.generateIdea({ nicheName: 'couple romance' });

    expect(AgentIdeaOutputSchema.safeParse(result).success).toBe(true);
    expect(result.quote.length).toBeLessThanOrEqual(140);
    expect(result.caption.length).toBeGreaterThan(10);
    expect(result.hashtags.length).toBeGreaterThanOrEqual(3);
    expect(result.quote).not.toContain('@');
    expect(result.bg_queries.length).toBeGreaterThanOrEqual(3);
  });

  it('generates valid ideas for stoic niche', async () => {
    const agent = new QuoteAgent();
    const result = await agent.generateIdea({ nicheName: 'stoic wisdom' });

    expect(result.quote).toContain('power');
    expect(result.hashtags.some((t) => t.includes('stoic'))).toBe(true);
  });
});
