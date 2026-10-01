import { toHttpUrl } from './to-http-url.util';

const HTTP_SCHEME_PATTERN = /^https?:\/\//i;

/** Same rule as the storefront link field: the hostname ends with a top-level domain of at least 2 characters. */
const TOP_LEVEL_DOMAIN_PATTERN = /\.[^.\s]{2,}$/;

/**
 * Link typed by the visitor. The storefront accepts links without a scheme (`example.com/item`) and sends them as typed,
 * so `https://` is added when the scheme is missing. Links with credentials or without a top-level domain are dropped.
 */
export const toLinkUrl = (value: string): string | undefined => {
  const trimmed = value.trim();
  const url = toHttpUrl(HTTP_SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`);

  if (!url) {
    return undefined;
  }

  const { hostname, username, password } = new URL(url);

  return !username && !password && TOP_LEVEL_DOMAIN_PATTERN.test(hostname) ? url : undefined;
};
