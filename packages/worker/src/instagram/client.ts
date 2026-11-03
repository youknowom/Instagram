import {
  GRAPH_BASE_URL,
  CONTAINER_POLL_INTERVAL_MS,
  CONTAINER_POLL_MAX_ATTEMPTS,
} from '@ig-auto/core';

export interface CreateContainerOptions {
  userId: string;
  accessToken: string;
  mediaType: 'IMAGE' | 'REELS';
  mediaUrl: string;
  caption?: string;
  altText?: string;
  coverUrl?: string;
  shareToFeed?: boolean;
  isAiGenerated?: boolean;
}

export interface ContainerStatusResponse {
  id: string;
  status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
}

export interface PublishResult {
  published: boolean;
  dryRun: boolean;
  mediaId?: string;
  containerId?: string;
  permalink?: string;
}

export class InstagramClient {
  private dryRun: boolean;

  constructor(allowLivePublish = false) {
    this.dryRun = !allowLivePublish;
  }

  /**
   * Check user publishing limit (max 100/24h)
   */
  async checkPublishingLimit(userId: string, accessToken: string) {
    const url = `${GRAPH_BASE_URL}/${userId}/content_publishing_limit?fields=quota_usage,config`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to check publishing limits: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as { access_token: string; expires_in: number };
  }

  /**
   * Create an Instagram media container
   */
  async createContainer(options: CreateContainerOptions): Promise<string> {
    const {
      userId,
      accessToken,
      mediaType,
      mediaUrl,
      caption = '',
      altText,
      coverUrl,
      shareToFeed = true,
      isAiGenerated = false,
    } = options;

    const params = new URLSearchParams();
    params.set('access_token', accessToken);

    if (mediaType === 'REELS') {
      params.set('media_type', 'REELS');
      params.set('video_url', mediaUrl);
      params.set('share_to_feed', String(shareToFeed));
      if (coverUrl) params.set('cover_url', coverUrl);
    } else {
      params.set('image_url', mediaUrl);
      if (altText) params.set('alt_text', altText);
    }

    if (caption) params.set('caption', caption);
    if (isAiGenerated) params.set('is_ai_generated', 'true');

    const url = `${GRAPH_BASE_URL}/${userId}/media`;
    const res = await fetch(url, {
      method: 'POST',
      body: params,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Instagram container creation failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { id: string };
    return data.id;
  }

  /**
   * Poll container until ready or timeout
   */
  async waitForContainer(
    containerId: string,
    accessToken: string,
    maxAttempts = CONTAINER_POLL_MAX_ATTEMPTS,
    intervalMs = 15000,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const url = `${GRAPH_BASE_URL}/${containerId}?fields=status_code&access_token=${accessToken}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Container poll failed (${res.status}): ${await res.text()}`);
      }

      const data = (await res.json()) as ContainerStatusResponse;
      if (data.status_code === 'FINISHED' || data.status_code === 'PUBLISHED') {
        return;
      }
      if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
        throw new Error(`Container reached failed state: ${data.status_code}`);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Container ${containerId} did not finish within ${maxAttempts} attempts`);
  }

  /**
   * Publish media container to live Instagram feed (idempotent guard)
   */
  async publishMedia(
    userId: string,
    containerId: string,
    accessToken: string,
  ): Promise<PublishResult> {
    if (this.dryRun) {
      console.log(
        `[DRY-RUN] Guard active: container ${containerId} would be published to @${userId}`,
      );
      return {
        published: false,
        dryRun: true,
        containerId,
      };
    }

    const params = new URLSearchParams();
    params.set('creation_id', containerId);
    params.set('access_token', accessToken);

    const url = `${GRAPH_BASE_URL}/${userId}/media_publish`;
    const res = await fetch(url, {
      method: 'POST',
      body: params,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`media_publish failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { id: string };
    const mediaId = data.id;

    // Fetch permalink
    let permalink: string | undefined;
    try {
      const pRes = await fetch(
        `${GRAPH_BASE_URL}/${mediaId}?fields=permalink&access_token=${accessToken}`,
      );
      if (pRes.ok) {
        const pData = (await pRes.json()) as { permalink: string };
        permalink = pData.permalink;
      }
    } catch {
      // Ignore permalink fetch error
    }

    return {
      published: true,
      dryRun: false,
      mediaId,
      containerId,
      permalink,
    };
  }

  /**
   * Refresh 60-day long-lived access token
   */
  async refreshToken(currentToken: string): Promise<{ access_token: string; expires_in: number }> {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Token refresh failed (${res.status}): ${await res.text()}`);
    }
    return (await res.json()) as { access_token: string; expires_in: number };
  }
}
