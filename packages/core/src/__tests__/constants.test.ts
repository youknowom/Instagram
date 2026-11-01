import { describe, it, expect } from 'vitest';
import { GRAPH_API_VERSION, CAPTION_MAX_LENGTH } from '../constants.js';

describe('constants', () => {
  it('has pinned graph API version', () => {
    expect(GRAPH_API_VERSION).toBe('v26.0');
  });

  it('has correct caption max length', () => {
    expect(CAPTION_MAX_LENGTH).toBe(2200);
  });
});
