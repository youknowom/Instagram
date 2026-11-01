import { describe, it, expect } from 'vitest';
import { GRAPH_API_VERSION } from '../index.js';

describe('worker index', () => {
  it('re-exports GRAPH_API_VERSION from core', () => {
    expect(GRAPH_API_VERSION).toBe('v26.0');
  });
});
