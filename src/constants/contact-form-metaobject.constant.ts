/**
 * Keys of the merchant-owned metaobject definition created in the Shopify admin. Shopify Flow reads them, so they must
 * never be renamed or removed once a workflow uses them.
 */
export const CONTACT_FORM_METAOBJECT_FIELD_KEYS = {
  NAME: 'name',
  EMAIL: 'email',
  MESSAGE: 'message',
  PRODUCTS: 'products',
  LINK_LIST: 'link_list',
  LOGO: 'logo',
  PREVIOUS_PAGE: 'previous_page',
  TERMS_ACCEPTED: 'terms_accepted',
  SUBMITTED_AT: 'submitted_at',
} as const;

/** Shopify rejects url field values over 2 KB (https://shopify.dev/docs/apps/build/metafields/metafield-limits). */
export const METAOBJECT_URL_MAX_BYTES = 2048;

/** A list field holds at most 128 entries (https://shopify.dev/docs/apps/build/metafields/metafield-limits). */
export const METAOBJECT_LIST_MAX_ITEMS = 128;
