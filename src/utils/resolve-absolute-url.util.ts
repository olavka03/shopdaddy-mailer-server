const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;

export const resolveAbsoluteUrl = (url?: string | null, baseUrl?: string | null): string | null => {
  const value = typeof url === 'string' ? url.trim() : '';

  if (!value) {
    return null;
  }

  if (ABSOLUTE_URL_PATTERN.test(value)) {
    return value;
  }

  const base = typeof baseUrl === 'string' ? baseUrl.trim() : '';

  if (!base) {
    return null;
  }

  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
};
