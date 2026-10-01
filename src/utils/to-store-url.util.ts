import { toHttpUrl } from './to-http-url.util';

/**
 * Resolves a storefront url (usually relative: /products/<handle>?variant=<id>) against the store. Only links to the
 * store itself are kept, so a tampered request cannot put a link to another site into the admin email.
 */
export const toStoreUrl = (value: string | undefined, storeUrl: string): string | undefined => {
  const url = toHttpUrl(value, storeUrl);

  if (!url) {
    return undefined;
  }

  const { origin, username, password } = new URL(url);
  const isStoreLink = origin === new URL(storeUrl).origin && !username && !password;

  return isStoreLink ? url : undefined;
};
