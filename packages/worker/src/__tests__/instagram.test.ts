import { describe, it, expect } from 'vitest';
import { InstagramClient } from '../instagram/client.js';

describe('InstagramClient', () => {
  it('enforces dry-run safeguard by default', async () => {
    const client = new InstagramClient(false); // allowLivePublish = false
    const result = await client.publishMedia('12345', 'container_999', 'mock_token');

    expect(result.published).toBe(false);
    expect(result.dryRun).toBe(true);
    expect(result.containerId).toBe('container_999');
    expect(result.mediaId).toBeUndefined();
  });
});
