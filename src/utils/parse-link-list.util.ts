/** Links as the storefront sent them: a JSON array, a repeated field, or a single url. They are validated later. */
export const parseLinkList = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) {
    return value;
  }

  const trimmed = value?.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    return Array.isArray(parsed) ? parsed.filter((link): link is string => typeof link === 'string') : [];
  } catch {
    // a single link sent as a bare url instead of a JSON array
    return [trimmed];
  }
};
