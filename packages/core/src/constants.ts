/** Pinned Graph API version — update only after testing. */
export const GRAPH_API_VERSION = 'v26.0';

export const GRAPH_BASE_URL = `https://graph.instagram.com/${GRAPH_API_VERSION}`;

export const CAPTION_MAX_LENGTH = 2200;
export const HASHTAG_MAX_COUNT = 30;
export const HASHTAG_DEFAULT_COUNT = 20;
export const AT_TAG_MAX_COUNT = 20;

export const IMAGE_MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
export const IMAGE_RENDER_WIDTH = 1080;
export const IMAGE_RENDER_HEIGHT = 1350;
export const IMAGE_MIN_WIDTH = 320;
export const IMAGE_MAX_WIDTH = 1440;

export const REEL_MAX_SIZE_BYTES = 300 * 1024 * 1024; // 300 MB
export const REEL_MIN_DURATION_S = 3;
export const REEL_MAX_DURATION_S = 15 * 60; // 15 min
export const REEL_MAX_WIDTH = 1920;
export const REEL_RECOMMENDED_WIDTH = 1080;
export const REEL_RECOMMENDED_HEIGHT = 1920;

export const CONTAINER_POLL_INTERVAL_MS = 60_000;
export const CONTAINER_POLL_MAX_ATTEMPTS = 5;

export const PUBLISH_MAX_ATTEMPTS = 3;
export const CONTAINERS_PER_24H = 400;
export const POSTS_PER_24H = 100;

export const TOKEN_REFRESH_MIN_AGE_DAYS = 1;
export const TOKEN_REFRESH_WARN_DAYS = 14;
export const TOKEN_LONG_LIVED_DAYS = 60;

export const APPROVAL_REQUIRED_FIRST_N = 30;

export const TELEGRAM_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
