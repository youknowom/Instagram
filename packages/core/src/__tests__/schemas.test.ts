import { describe, it, expect } from 'vitest';
import { PostStatus, MediaType, PostSource } from '../schemas/post.js';

describe('post schemas', () => {
  it('validates post source', () => {
    expect(PostSource.parse('manual')).toBe('manual');
    expect(PostSource.parse('agent')).toBe('agent');
    expect(() => PostSource.parse('invalid')).toThrow();
  });

  it('validates media type', () => {
    expect(MediaType.parse('REELS')).toBe('REELS');
    expect(MediaType.parse('IMAGE')).toBe('IMAGE');
    expect(() => MediaType.parse('video')).toThrow();
  });

  it('validates post status transitions', () => {
    const validStatuses = [
      'draft',
      'pending_approval',
      'approved',
      'publishing',
      'posted',
      'failed',
      'rejected',
    ];
    for (const s of validStatuses) {
      expect(PostStatus.parse(s)).toBe(s);
    }
  });
});
