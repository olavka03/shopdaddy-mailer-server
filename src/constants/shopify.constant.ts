/** Latest stable Admin API version, supported until 2027-07: https://shopify.dev/docs/api/usage/versioning */
export const SHOPIFY_API_VERSION = '2026-07';

export const SHOPIFY_THROTTLE_RETRY_DELAY_MS = 1000;

export const SHOPIFY_FILE_PROCESSING = {
  POLL_INITIAL_DELAY_MS: 1000,
  POLL_MAX_DELAY_MS: 3000,
  TIMEOUT_MS: 20000,
} as const;
