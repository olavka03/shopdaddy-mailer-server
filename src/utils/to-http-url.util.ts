import { CONTACT_FORM_LIMITS } from '@constants';

/**
 * Absolute http(s) url in its serialized form, or undefined for anything else (`javascript:`, other schemes, too long).
 * A relative value is resolved against `baseUrl` when one is given, and rejected otherwise.
 */
export const toHttpUrl = (value?: string | null, baseUrl?: string): string | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : '';

  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed, baseUrl);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';

    return isHttp && url.href.length <= CONTACT_FORM_LIMITS.URL_MAX_LENGTH ? url.href : undefined;
  } catch {
    return undefined;
  }
};
