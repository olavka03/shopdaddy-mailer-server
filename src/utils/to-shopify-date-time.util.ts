/**
 * Formats a date as a `date_time` metafield value: ISO 8601 in UTC without milliseconds or offset,
 * for example 2024-01-01T12:30:00 (https://shopify.dev/docs/apps/build/metafields/list-of-data-types).
 */
export const toShopifyDateTime = (date: Date): string => {
  return new Date(date).toISOString().slice(0, 19);
};
